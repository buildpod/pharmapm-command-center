// Impact Engine — Consequence Projection (IMPACT_ENGINE_SPEC.md steps 3–5).
//
// ONE pipeline for every kind of disruption. A task date slip, a scope add, a
// vendor over-charge, and an approver absence all reduce to the same two
// deltas — a SCHEDULE outcome (forced new dates → does go-live move?) and a
// COST delta — and the same projector turns them into the true downstream
// consequence: go-live, forecast cost, and confidence, measured against the
// frozen commitment (milestone plannedDate / project.goLiveDate), never a
// rebased plan. A date slip is just perturbation #1.
//
// This module is the consequence math ONLY. The schedule cascade itself
// (previewTaskCascade / previewTaskToMilestonePush in scheduling.ts) is run by
// the caller, who owns the task↔milestone id translation and hands us the
// resulting ScheduleOutcome. We stay pure and decoupled.
//
// Correctness rules (spec §1):
//   C1  A disruption never RAISES confidence — added cost can only lower CPI
//       (or hold it). Confidence routes through real cost, never fabricated.
//   C3  A slip with slack moves nothing — go-live is "absorbed" when work still
//       fits before the committed date.
//   C5  Duration-driven cost accrues on TIME-&-MATERIALS lines only; Fixed /
//       Internal lines do not cost more for taking longer.
//   C6  Working days AND calendar days are both reported.
//   C7  Never show a number you can't defend — no defensible figure → an
//       honest blank, and confidence does not move.
//
// Pure domain module: no store/UI imports. Currency units = dollars.

import { workingDaysBetween, daysBetween, compare } from "./dates";
import type { EvmSnapshot } from "./evm";

// ─── Perturbations (the unifying input) ────────────────────────────────────────

export type Perturbation =
  // A task's date moved (the original trigger).
  | { kind: "task-date"; taskName?: string; workingDaysShift: number }
  // New work added to the plan — carries its own budget as direct new cost.
  | { kind: "scope-add"; itemName: string; addedBudget: number }
  // A cost line is forecasting over budget (e.g. a T&M vendor over-charging) —
  // direct cost hit, no schedule movement.
  | { kind: "cost-overcharge"; lineName: string; overAmount: number }
  // A person (approver / key resource) is unavailable until a date — a gate that
  // needs them cannot complete before then. The caller forces that date into the
  // cascade; we project the consequence.
  | { kind: "absence"; who: string; until: string; gateName?: string };

// ─── Schedule outcome (from the cascade) ───────────────────────────────────────

// Shape of one entry from previewTaskCascade(...).affected
export interface AffectedTask {
  id: string;
  name?: string;
  oldDue: string;
  newDue: string;
  daysShifted: number;
}

// Shape of one entry from previewTaskToMilestonePush(...)
export interface MilestonePush {
  milestoneId: string;
  milestoneName?: string;
  oldPlannedDate: string;
  proposedNewDate: string;
  drivenByTaskId: string;
  drivenByTaskName?: string;
  daysShifted: number;
  transitive?: boolean;
}

export interface ScheduleOutcome {
  affected: AffectedTask[];
  milestonePushes: MilestonePush[];
  // Where go-live WOULD land if its own lock were ignored — computed by the
  // caller (cascade with go-live unlocked). null = the change does not reach
  // go-live at all (genuinely absorbed). The single signal that distinguishes
  // real slack from a locked-date collision.
  goLiveProjectedUnlocked: string | null;
}

export interface ConsequenceCostLine {
  budgetK: number;          // $k budgeted
  contractType: string;     // "T&M" | "Fixed" | "Internal" | ...
}

// The frozen commitment we measure against (spec §4): the project's own
// committed dates, immutable in practice. A persisted re-baseline comes later.
export interface ConsequenceBaseline {
  committedGoLive: string;   // ISO — the date we promised
  projectStart: string;      // ISO
  goLiveMilestoneId: string; // which milestone IS go-live (resolved by caller)
  goLiveName?: string;       // display name for the chain tail
  // A locked go-live cannot move on paper — when work overruns it the result is
  // a HARD breach (miss/compress), not absorption. Defaults to false.
  goLiveLocked?: boolean;
}

export interface ProjectConsequenceInput {
  perturbation: Perturbation;
  // Present when the perturbation moves dates; null for pure-cost disruptions
  // (a vendor over-charge has no schedule arm).
  schedule: ScheduleOutcome | null;
  baseline: ConsequenceBaseline;
  costLines: ConsequenceCostLine[];
  snapshot: EvmSnapshot | null;     // current EVM snapshot, or null (no coverage)
  workingDays?: number[];
  holidays?: string[];
}

// ─── Output ────────────────────────────────────────────────────────────────────

export interface ConsequenceProjection {
  kind: Perturbation["kind"];
  // True only when there is genuinely nothing to worry about: go-live holds AND
  // no added cost AND confidence unchanged. Drives the all-clear (emerald) tone;
  // anything else is a governed tradeoff (amber).
  benign: boolean;
  goLive: {
    absorbed: boolean;          // true → work still fits before go-live (C3)
    lockedBreach: boolean;      // true → go-live is locked but work overruns it
    committed: string;
    projected: string;          // where it lands (or would land, if locked)
    workingDaysSlip: number;    // overrun in working days (0 when absorbed)
    calendarDaysSlip: number;   // paired with working days (C6)
    pctOfPlan: number;
  };
  chain: { id: string; name?: string; kind: "task" | "milestone" }[];
  cost: {
    estimable: boolean;
    reason?: string;            // why not estimable (C7)
    addedCost: number;          // dollars; 0 when none / not estimable
    directCost: number;         // explicit cost from the perturbation (scope/overcharge)
    tmExtensionCost: number;    // duration-driven T&M burn from the overrun
    tmBudget: number;           // T&M budget the rate derives from
  };
  confidence: {
    moves: boolean;
    before: number | null;
    after: number | null;
    note: string;
  };
  commitmentBreach: boolean;    // true → this misses the committed go-live
  summary: string;              // one causal sentence the PM reads first
}

const WD = [1, 2, 3, 4, 5];

// ─── Go-live designation (spec C2) ─────────────────────────────────────────────
//
// Go-live ≠ "latest milestone" (projects have post-go-live milestones like
// hypercare/PQ). Resolve deterministically: an explicit Go-Live phase/name wins;
// then the milestone whose planned date equals the committed go-live; then, only
// as a last resort, the latest milestone.
export interface GoLiveCandidate {
  id: string;
  name?: string;
  phase?: string;
  plannedDate: string;
}

export function resolveGoLiveMilestone(
  milestones: GoLiveCandidate[],
  committedGoLive: string,
): string | null {
  if (milestones.length === 0) return null;
  const byPhaseOrName = milestones.find(
    (m) => /go.?live/i.test(m.phase ?? "") || /go.?live/i.test(m.name ?? ""),
  );
  if (byPhaseOrName) return byPhaseOrName.id;
  const byDate = milestones.find((m) => m.plannedDate === committedGoLive);
  if (byDate) return byDate.id;
  return milestones.reduce((a, b) => (compare(a.plannedDate, b.plannedDate) >= 0 ? a : b)).id;
}

// ─── Core ──────────────────────────────────────────────────────────────────────

export function projectConsequence(input: ProjectConsequenceInput): ConsequenceProjection {
  const wd = input.workingDays ?? WD;
  const hols = input.holidays ?? [];
  const { baseline, perturbation } = input;
  const sched = input.schedule;

  // 1. Schedule arm — does the disruption reach go-live? `goLiveProjectedUnlocked`
  //    is where go-live would land ignoring its own lock. Three states:
  //      • unaffected / still fits  → ABSORBED (genuine slack, C3)
  //      • overruns, not locked     → go-live SLIPS to the projected date
  //      • overruns, locked         → LOCKED BREACH: date can't move on paper,
  //        so the work overruns it — miss or compress.
  const projUnlocked = sched?.goLiveProjectedUnlocked ?? null;
  const overruns = projUnlocked != null && compare(projUnlocked, baseline.committedGoLive) > 0;
  const absorbed = !overruns;
  const lockedBreach = overruns && !!baseline.goLiveLocked;
  const projected = overruns && !lockedBreach ? projUnlocked! : baseline.committedGoLive;

  const workingDaysSlip = overruns
    ? workingDaysBetween(baseline.committedGoLive, projUnlocked!, wd, hols)
    : 0;
  const calendarDaysSlip = overruns
    ? Math.abs(daysBetween(baseline.committedGoLive, projUnlocked!))
    : 0;
  const committedDuration = Math.max(
    1,
    workingDaysBetween(baseline.projectStart, baseline.committedGoLive, wd, hols),
  );
  const pctOfPlan = workingDaysSlip / committedDuration;

  // 2. The causal chain (traceable). Only when the disruption reaches go-live.
  const chain: ConsequenceProjection["chain"] = [];
  if (overruns && sched) {
    chain.push({ id: "source", name: sourceLabel(perturbation), kind: "task" });
    sched.milestonePushes
      .filter((p) => p.milestoneId !== baseline.goLiveMilestoneId)
      .sort((a, b) => compare(a.oldPlannedDate, b.oldPlannedDate))
      .forEach((p) => chain.push({ id: p.milestoneId, name: p.milestoneName, kind: "milestone" }));
    chain.push({ id: baseline.goLiveMilestoneId, name: baseline.goLiveName ?? "Go-Live", kind: "milestone" });
  }

  // 3. Cost — two additive sources:
  //    • directCost: the perturbation's own money (scope budget, over-charge).
  //    • tmExtensionCost: duration-driven T&M burn from a go-live overrun (C5).
  //    No defensible figure for an overrun (no T&M lines, no direct cost) → an
  //    honest blank rather than a fabricated number (C7).
  const tmBudget =
    input.costLines
      .filter((c) => normalizeContract(c.contractType) === "tm")
      .reduce((s, c) => s + c.budgetK, 0) * 1000;
  const directCost = directCostOf(perturbation);

  let tmExtensionCost = 0;
  let estimable = true;
  let reason: string | undefined;
  if (overruns) {
    if (tmBudget > 0) {
      tmExtensionCost = Math.round((tmBudget / committedDuration) * workingDaysSlip);
    } else if (directCost === 0) {
      estimable = false;
      reason = "No time-&-materials cost lines — extension cost not estimable.";
    }
  }
  const addedCost = directCost + tmExtensionCost;
  const cost: ConsequenceProjection["cost"] = {
    estimable,
    reason,
    addedCost,
    directCost,
    tmExtensionCost,
    tmBudget,
  };

  // 4. Confidence — routes through the REAL cost mechanism. Extra cost raises AC
  //    → lowers CPI → raises EAC₂ → confidence drops. So any disruption can only
  //    lower or hold confidence (C1). No defensible cost → confidence holds (C7).
  const confidence = projectConfidence(input.snapshot, estimable ? addedCost : 0);

  const commitmentBreach = overruns;
  const benign = absorbed && addedCost === 0 && !confidence.moves;

  return {
    kind: perturbation.kind,
    benign,
    goLive: { absorbed, lockedBreach, committed: baseline.committedGoLive, projected, workingDaysSlip, calendarDaysSlip, pctOfPlan },
    chain,
    cost,
    confidence,
    commitmentBreach,
    summary: buildSummary(perturbation, {
      absorbed,
      lockedBreach,
      affectedCount: sched?.affected.length ?? 0,
      workingDaysSlip,
      calendarDaysSlip,
      committed: baseline.committedGoLive,
      projected,
      cost,
      confidence,
    }),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeContract(t: string): "tm" | "fixed" | "internal" | "other" {
  const s = t.toLowerCase().replace(/[^a-z&]/g, "");
  if (s === "t&m" || s === "tm" || s.includes("time")) return "tm";
  if (s.includes("fixed")) return "fixed";
  if (s.includes("internal")) return "internal";
  return "other";
}

function directCostOf(p: Perturbation): number {
  switch (p.kind) {
    case "scope-add": return Math.max(0, p.addedBudget);
    case "cost-overcharge": return Math.max(0, p.overAmount);
    default: return 0;
  }
}

function sourceLabel(p: Perturbation): string {
  switch (p.kind) {
    case "task-date": return p.taskName ?? "This task";
    case "scope-add": return p.itemName;
    case "cost-overcharge": return p.lineName;
    case "absence": return p.gateName ?? `${p.who}'s approval`;
  }
}

// Recompute confidence with extra cost folded into AC. Mirrors the B4 formula in
// evm-project.ts (confidenceScore), adjusting only AC — EV and SPI(t) are
// unchanged (a future change doesn't alter what's already been earned to date).
function projectConfidence(
  snapshot: EvmSnapshot | null,
  addedCost: number,
): ConsequenceProjection["confidence"] {
  if (!snapshot) {
    return { moves: false, before: null, after: null, note: "Confidence not computed — project has no cost/task coverage yet." };
  }
  const before = b4(snapshot.cpi, snapshot.spit, snapshot.eac2, snapshot.bac);
  if (addedCost <= 0) {
    return { moves: false, before, after: before, note: "No forecast-cost impact — confidence is unchanged." };
  }
  const newAc = snapshot.ac + addedCost;
  const newCpi = newAc > 0 ? snapshot.ev / newAc : snapshot.cpi;
  const newEac2 = newCpi > 0 ? snapshot.bac / newCpi : snapshot.eac2;
  const after = b4(newCpi, snapshot.spit, newEac2, snapshot.bac);
  return { moves: after !== before, before, after, note: `Forecast cost rises (CPI ${snapshot.cpi.toFixed(2)} → ${newCpi.toFixed(2)}).` };
}

// The B4 confidence formula, isolated so before/after use identical arithmetic.
function b4(cpi: number, spit: number, eac2: number, bac: number): number {
  const cost = Math.min(cpi, 1);
  const sched = Math.min(spit, 1);
  const breach = Math.max(0, (bac > 0 ? eac2 / bac : 1) - 1);
  const raw = 0.4 * cost + 0.4 * sched + 0.2 * (1 - Math.min(breach, 1));
  return Math.round(100 * Math.max(0, Math.min(1, raw)));
}

interface SummaryState {
  absorbed: boolean;
  lockedBreach: boolean;
  affectedCount: number;
  workingDaysSlip: number;
  calendarDaysSlip: number;
  committed: string;
  projected: string;
  cost: ConsequenceProjection["cost"];
  confidence: ConsequenceProjection["confidence"];
}

function buildSummary(p: Perturbation, s: SummaryState): string {
  const wd = `${s.workingDaysSlip} working day${s.workingDaysSlip === 1 ? "" : "s"}`;
  const costSuffix = s.cost.estimable
    ? s.cost.addedCost > 0 ? `, adding about ${money(s.cost.addedCost)} in forecast cost` : ""
    : ` (cost impact not estimable — ${s.cost.reason})`;
  const confSuffix = s.confidence.moves ? ` Confidence ${s.confidence.before} → ${s.confidence.after}.` : "";

  switch (p.kind) {
    case "cost-overcharge": {
      // Pure-cost: no schedule movement. Lead with the money + confidence.
      const amt = money(p.overAmount);
      return `${p.lineName} is forecasting about ${amt} over budget. No schedule impact — go-live holds — but forecast cost rises ${amt}.${confSuffix}`;
    }
    case "scope-add": {
      const head = `Adding "${p.itemName}" (+${money(p.addedBudget)})`;
      if (s.absorbed) return `${head} is absorbed by slack — go-live holds.${confSuffix}`;
      if (s.lockedBreach) return `${head} pushes the work ${wd} past the committed go-live of ${s.committed}, which is locked — the date will be missed unless work compresses by ${wd}${costSuffix}.`;
      return `${head} slips go-live ${wd} (≈ ${calWeeks(s.calendarDaysSlip)}) to ${s.projected}${costSuffix}.`;
    }
    case "absence": {
      const head = `${p.who} is unavailable until ${p.until}, so ${p.gateName ?? "the dependent gate"} can't complete before then`;
      if (s.absorbed) return `${head} — but it's absorbed by slack; go-live holds.${confSuffix}`;
      if (s.lockedBreach) return `${head}, pushing the work ${wd} past the committed go-live of ${s.committed}, which is locked — the date will be missed unless work compresses by ${wd}${costSuffix}.`;
      return `${head}: go-live slips ${wd} (≈ ${calWeeks(s.calendarDaysSlip)}) to ${s.projected}${costSuffix}.`;
    }
    case "task-date":
    default: {
      const moved = `${p.kind === "task-date" ? (p.taskName ?? "This task") : "This task"} moves ${p.kind === "task-date" ? p.workingDaysShift : 0} working day${p.kind === "task-date" && p.workingDaysShift === 1 ? "" : "s"}`;
      if (s.absorbed) {
        if (s.affectedCount > 0) return `${moved}. ${s.affectedCount} downstream date${s.affectedCount === 1 ? "" : "s"} shift, but they still fit before go-live — the committed date holds.`;
        return `${moved} — absorbed by slack. Go-live holds; nothing downstream is forced to move.`;
      }
      if (s.lockedBreach) return `${moved} and pushes the work ${wd} (≈ ${calWeeks(s.calendarDaysSlip)}) past the committed go-live of ${s.committed}, which is locked. The date will be missed unless the remaining work compresses by ${wd}${costSuffix}.`;
      return `${moved} and is on the path to go-live: it slips ${wd} (≈ ${calWeeks(s.calendarDaysSlip)}) to ${s.projected}${costSuffix}.`;
    }
  }
}

function calWeeks(days: number): string {
  const w = days / 7;
  if (w < 1) return `${days} day${days === 1 ? "" : "s"}`;
  return `${w.toFixed(w >= 2 ? 0 : 1)} week${w >= 2 ? "s" : ""}`;
}

function money(dollars: number): string {
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}k`;
  return `$${dollars}`;
}
