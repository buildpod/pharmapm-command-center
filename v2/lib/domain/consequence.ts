// Impact Engine — Consequence Projection (IMPACT_ENGINE_SPEC.md).
//
// Turns a schedule perturbation (today: a task date slip) into its TRUE
// downstream consequence: does go-live move, by how much, what does it cost,
// and what does it do to confidence — measured against the frozen commitment
// (milestone plannedDate / project.goLiveDate), never a rebased plan.
//
// This module is the consequence math ONLY. The schedule cascade itself
// (previewTaskCascade → affected tasks; previewTaskToMilestonePush → milestone
// pushes) is already built and tested in scheduling.ts and is run by the
// caller, who also owns the task↔milestone id translation. We take those
// outputs and project the consequence, so we stay pure and decoupled.
//
// Correctness rules enforced here (spec §1):
//   C1  A slip never RAISES confidence — extension can only add cost, and added
//       cost can only lower CPI → lower confidence (or leave it flat).
//   C3  A slip with slack moves nothing — `absorbed` is true when the go-live
//       milestone is NOT in the push set.
//   C5  Cost accrues on TIME-&-MATERIALS lines only; Fixed / Internal lines do
//       not cost more for taking longer.
//   C6  Working days AND calendar days are both reported.
//   C7  Never show a number you can't defend — when there is no T&M rate to
//       derive, cost is `estimable:false` and confidence does not move.
//
// Pure domain module: no store/UI imports. Currency units = dollars.

import { workingDaysBetween, daysBetween, compare } from "./dates";
import type { EvmSnapshot } from "./evm";

// ─── Inputs ──────────────────────────────────────────────────────────────────

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

export interface ConsequenceCostLine {
  budgetK: number;          // $k budgeted
  contractType: string;     // "T&M" | "Fixed" | "Internal" | ...
}

// The frozen commitment we measure against (spec §4). For v1 this is the
// project's own committed dates — milestone plannedDate / project.goLiveDate —
// which are immutable in practice. A persisted re-baseline snapshot comes later.
export interface ConsequenceBaseline {
  committedGoLive: string;  // ISO — project.goLiveDate (the date we promised)
  projectStart: string;     // ISO
  goLiveMilestoneId: string;// which milestone IS go-live (resolved by caller)
  goLiveName?: string;      // display name for the chain tail
  // Whether the go-live milestone date is locked (a committed/fixed date). A
  // locked go-live cannot move on paper — so when work overruns it, the result
  // is a HARD breach (miss/compress), not absorption. Defaults to false.
  goLiveLocked?: boolean;
  // Where go-live WOULD land if its own lock were ignored — computed by the
  // caller (run the milestone cascade with go-live unlocked). null = the change
  // does not reach go-live at all (genuinely absorbed). This is the single
  // signal that distinguishes real slack from a locked-date collision.
  goLiveProjectedUnlocked: string | null;
}

export interface ProjectConsequenceInput {
  editedTaskName?: string;
  editWorkingDaysShift: number;     // how far the PM moved the edited task (working days)
  affected: AffectedTask[];         // downstream tasks that shifted (from cascade)
  milestonePushes: MilestonePush[]; // milestones that shifted (from cascade)
  baseline: ConsequenceBaseline;
  costLines: ConsequenceCostLine[];
  snapshot: EvmSnapshot | null;     // current EVM snapshot, or null (no coverage)
  workingDays?: number[];
  holidays?: string[];
}

// ─── Output ────────────────────────────────────────────────────────────────────

export interface ConsequenceProjection {
  goLive: {
    absorbed: boolean;          // true → work still fits before go-live (C3)
    lockedBreach: boolean;      // true → go-live is locked but work overruns it
    committed: string;          // the frozen committed date
    projected: string;          // where it lands (or would land, if locked)
    workingDaysSlip: number;    // overrun in working days (0 when absorbed)
    calendarDaysSlip: number;   // paired with working days (C6)
    pctOfPlan: number;          // slip ÷ committed duration (0..n)
  };
  chain: { id: string; name?: string; kind: "task" | "milestone" }[];
  cost: {
    estimable: boolean;
    reason?: string;            // why not estimable (C7)
    addedCost: number;          // dollars; 0 when none / not estimable
    tmBudget: number;           // total T&M budget the rate derives from
  };
  confidence: {
    moves: boolean;
    before: number | null;
    after: number | null;
    note: string;               // plain-language why it moved / didn't
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
  const { baseline } = input;

  // 1. Does the change reach go-live? `goLiveProjectedUnlocked` is where go-live
  //    would land ignoring its own lock (computed by the caller). Three states:
  //      • unaffected / still fits  → ABSORBED (genuine slack, C3)
  //      • overruns, not locked     → go-live SLIPS to the projected date
  //      • overruns, locked         → LOCKED BREACH: the date can't move on
  //        paper, so the work overruns it — miss or compress (the bug this fix
  //        catches: a locked go-live is NOT "absorbed").
  const projUnlocked = baseline.goLiveProjectedUnlocked;
  const overruns = projUnlocked != null && compare(projUnlocked, baseline.committedGoLive) > 0;
  const absorbed = !overruns;
  const lockedBreach = overruns && !!baseline.goLiveLocked;

  // Projected date the PM sees: where go-live moves to (unlocked), or — when
  // locked — the committed date it's pinned to (the overrun is reported as slip days).
  const projected = !overruns
    ? baseline.committedGoLive
    : lockedBreach
      ? baseline.committedGoLive
      : projUnlocked!;

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

  // 2. The causal chain (traceable). Edited task → intermediate gates → go-live.
  const chain: ConsequenceProjection["chain"] = [];
  if (overruns) {
    chain.push({
      id: input.milestonePushes[0]?.drivenByTaskId ?? "edit",
      name: input.editedTaskName,
      kind: "task",
    });
    // Intermediate milestone pushes (excluding go-live), in PLAN order (their
    // original dates) so the chain reads the way the project was sequenced.
    input.milestonePushes
      .filter((p) => p.milestoneId !== baseline.goLiveMilestoneId)
      .sort((a, b) => compare(a.oldPlannedDate, b.oldPlannedDate))
      .forEach((p) => chain.push({ id: p.milestoneId, name: p.milestoneName, kind: "milestone" }));
    chain.push({
      id: baseline.goLiveMilestoneId,
      name: baseline.goLiveName ?? "Go-Live",
      kind: "milestone",
    });
  }

  // 3. Cost — TIME-&-MATERIALS lines only (C5). Extension burns T&M resources
  //    at their implied linear day-rate; Fixed / Internal lines cost nothing
  //    extra for taking longer. No T&M lines → not estimable (C7).
  const tmBudget =
    input.costLines
      .filter((c) => normalizeContract(c.contractType) === "tm")
      .reduce((s, c) => s + c.budgetK, 0) * 1000;

  let cost: ConsequenceProjection["cost"];
  if (!overruns) {
    cost = { estimable: true, addedCost: 0, tmBudget };
  } else if (tmBudget <= 0) {
    cost = {
      estimable: false,
      reason: "No time-&-materials cost lines — extension cost not estimable.",
      addedCost: 0,
      tmBudget: 0,
    };
  } else {
    // Implied linear T&M day-rate over the committed duration.
    const dayRate = tmBudget / committedDuration;
    const addedCost = Math.round(dayRate * workingDaysSlip);
    cost = { estimable: true, addedCost, tmBudget };
  }

  // 4. Confidence — routed through the REAL cost mechanism, never fabricated.
  //    Extra T&M burn raises AC → lowers CPI → raises EAC₂ → confidence drops.
  //    A slip can therefore only lower or hold confidence (C1). When there is
  //    no defensible added cost, confidence does not move and we say why (C7).
  const confidence = projectConfidence(input.snapshot, cost.estimable ? cost.addedCost : 0, {
    absorbed,
    estimable: cost.estimable,
  });

  const commitmentBreach = overruns;

  return {
    goLive: {
      absorbed,
      lockedBreach,
      committed: baseline.committedGoLive,
      projected,
      workingDaysSlip,
      calendarDaysSlip,
      pctOfPlan,
    },
    chain,
    cost,
    confidence,
    commitmentBreach,
    summary: buildSummary({
      editedTaskName: input.editedTaskName,
      editWorkingDaysShift: input.editWorkingDaysShift,
      absorbed,
      lockedBreach,
      affectedCount: input.affected.length,
      workingDaysSlip,
      calendarDaysSlip,
      committed: baseline.committedGoLive,
      projected,
      cost,
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

// Recompute confidence with extra cost folded into AC. Mirrors the B4 formula
// in evm-project.ts (confidenceScore) exactly, adjusting only AC (EV and the
// schedule term SPI(t) are unchanged — a future date move does not change what
// has already been earned to date).
function projectConfidence(
  snapshot: EvmSnapshot | null,
  addedCost: number,
  ctx: { absorbed: boolean; estimable: boolean },
): ConsequenceProjection["confidence"] {
  if (!snapshot) {
    return {
      moves: false,
      before: null,
      after: null,
      note: "Confidence not computed — project has no cost/task coverage yet.",
    };
  }

  const before = b4(snapshot.cpi, snapshot.spit, snapshot.eac2, snapshot.bac);

  if (ctx.absorbed) {
    return { moves: false, before, after: before, note: "Absorbed by slack — confidence unchanged." };
  }
  if (!ctx.estimable || addedCost <= 0) {
    return {
      moves: false,
      before,
      after: before,
      note: "No forecast-cost impact (no time-&-materials extension cost) — confidence is unchanged, but the committed go-live is missed.",
    };
  }

  const newAc = snapshot.ac + addedCost;
  const newCpi = newAc > 0 ? snapshot.ev / newAc : snapshot.cpi;
  const newEac2 = newCpi > 0 ? snapshot.bac / newCpi : snapshot.eac2;
  const after = b4(newCpi, snapshot.spit, newEac2, snapshot.bac);

  return {
    moves: after !== before,
    before,
    after,
    note: `Forecast cost rises with the extension (CPI ${snapshot.cpi.toFixed(2)} → ${newCpi.toFixed(2)}).`,
  };
}

// The B4 confidence formula, isolated so before/after use identical arithmetic.
function b4(cpi: number, spit: number, eac2: number, bac: number): number {
  const cost = Math.min(cpi, 1);
  const sched = Math.min(spit, 1);
  const breach = Math.max(0, (bac > 0 ? eac2 / bac : 1) - 1);
  const raw = 0.4 * cost + 0.4 * sched + 0.2 * (1 - Math.min(breach, 1));
  return Math.round(100 * Math.max(0, Math.min(1, raw)));
}

function buildSummary(p: {
  editedTaskName?: string;
  editWorkingDaysShift: number;
  absorbed: boolean;
  lockedBreach: boolean;
  affectedCount: number;
  workingDaysSlip: number;
  calendarDaysSlip: number;
  committed: string;
  projected: string;
  cost: ConsequenceProjection["cost"];
}): string {
  const task = p.editedTaskName ?? "This task";
  const moved = `${task} moves ${p.editWorkingDaysShift} working day${p.editWorkingDaysShift === 1 ? "" : "s"}`;
  const wd = `${p.workingDaysSlip} working day${p.workingDaysSlip === 1 ? "" : "s"}`;

  // ABSORBED — go-live holds. Acknowledge any downstream date shifts honestly
  // (they moved, but they still fit before go-live) rather than claiming
  // "nothing moves" while listing tasks that did.
  if (p.absorbed) {
    if (p.affectedCount > 0) {
      return `${moved}. ${p.affectedCount} downstream date${p.affectedCount === 1 ? "" : "s"} shift, but they still fit before go-live — the committed date holds.`;
    }
    return `${moved} — absorbed by slack. Go-live holds; nothing downstream is forced to move.`;
  }

  const costPart = p.cost.estimable
    ? p.cost.addedCost > 0
      ? `, adding about ${money(p.cost.addedCost)} in time-&-materials cost`
      : ""
    : ` (cost impact not estimable — ${p.cost.reason})`;

  // LOCKED BREACH — the date is pinned but the work now runs past it.
  if (p.lockedBreach) {
    return `${moved} and pushes the work ${wd} (≈ ${calWeeks(p.calendarDaysSlip)}) past the committed go-live of ${p.committed}, which is locked. The date will be missed unless the remaining work compresses by ${wd}${costPart}.`;
  }

  // SLIP — go-live moves.
  return `${moved} and is on the path to go-live: it slips ${wd} (≈ ${calWeeks(p.calendarDaysSlip)}) to ${p.projected}${costPart}.`;
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
