// Project EVM adapter + confidence scoring (PT-1 derivation + PT-9).
//
// Bridges live project data → the pure EVM engine (evm.ts), then derives the
// leadership "confidence" score + plain-language verdict that replaces the
// former hand-set dashboard health number (the NotebookLM dark-pattern fix).
//
// Scope note: this derives an EVM input from existing data (cost lines for
// BAC/AC, a cumulative planned-cost curve for PV, task progress for EV). A
// persisted, frozen, re-baselineable CostBaseline entity (full PT-1, needed
// for audit-grade re-baseline history) remains a future item.
//
// F3 (per-task budget weighting, PT-2): when EVERY task carries a budgetK,
// EV is budget-weighted — a $200k task at 100% earns far more than a $2k task.
// The rule is all-or-nothing: partial budgets fall back to equal weighting
// rather than silently mixing stated and assumed weights (same philosophy as
// the coverage gate — no half-fabricated inputs). Task budgets are WEIGHTS
// only; BAC remains solely Σ cost-line budgets (one financial truth).

import { computeEvm, forecastRange, type EvmInput, type EvmSnapshot, type PvPoint, type EvmItem, type ForecastRange } from "./evm";

// ─── Derivation inputs (kept framework-agnostic — caller passes plain data) ───

export interface CostLineLike { budgetK: number; actualK: number; }
export interface PlannedPointLike { month: string; planned: number; }  // cumulative $k
export interface TaskLike {
  progress: number;   // 0..100
  budgetK?: number;   // optional $k budget — activates weighted EV only when ALL tasks have one
}

export interface DeriveInput {
  costLines: CostLineLike[];
  // Class C: a project-specific date-based PV curve (e.g. from
  // baseline.ts/projectBaseline). Preferred — month labels can't cross year
  // boundaries. When provided, plannedCurve/curveYear are ignored.
  curve?: PvPoint[];
  plannedCurve?: PlannedPointLike[];  // legacy: cumulative planned $k by month label
  tasks: TaskLike[];                  // project tasks (progress drives EV)
  projectStart: string;              // ISO
  statusDate: string;                // ISO ("today")
  curveYear?: number;                // year to anchor legacy month labels onto
}

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

// Build an EvmInput from live project data.
// - BAC = Σ cost-line budgets (×1000, since stored in $k)
// - AC  = Σ cost-line actuals (×1000)
// - PV curve = cumulative planned $k mapped to month-start dates
// - EV  = BAC × overall task completion (avg progress). Approximation pending
//   per-item budgets (PT-2); documented above.
export function deriveEvmInput(input: DeriveInput): EvmInput {
  const bac = input.costLines.reduce((s, c) => s + c.budgetK, 0) * 1000;
  const ac = input.costLines.reduce((s, c) => s + c.actualK, 0) * 1000;

  // Class C: a date-based per-project curve wins; the month-label path
  // survives only for the sample project's hand-shaped budgetTrend.
  const curve: PvPoint[] = input.curve ?? [
    { date: `${input.curveYear}-01-01`, cumulativePV: 0 },
    ...(input.plannedCurve ?? [])
      .filter((p) => MONTHS[p.month])
      .map((p) => ({
        date: `${input.curveYear}-${MONTHS[p.month]}-01`,
        cumulativePV: p.planned * 1000,
      })),
  ];

  // EV derivation (F3). If every task carries a budget, earn value by budget
  // weight: each task becomes an EvmItem holding its share of BAC (weights are
  // normalized to BAC so Σ items.budget === BAC, per the EvmItem contract —
  // task budgets never become a second budget truth). Any task without a
  // budget (or with 0) disables weighting entirely — all-or-nothing, so the
  // number is either fully stated or fully the declared equal-weight default.
  const allBudgeted =
    input.tasks.length > 0 && input.tasks.every((t) => (t.budgetK ?? 0) > 0);

  let items: EvmItem[];
  if (allBudgeted) {
    const totalWeightK = input.tasks.reduce((s, t) => s + (t.budgetK ?? 0), 0);
    items = input.tasks.map((t, i) => ({
      id: `task-${i}`,
      budget: bac * ((t.budgetK ?? 0) / totalWeightK),
      progress: t.progress / 100,
    }));
  } else {
    // Equal-weight fallback: single synthetic item carrying the whole BAC at
    // the average progress — equivalent to BAC × avgProgress.
    const avgProgress = input.tasks.length
      ? input.tasks.reduce((s, t) => s + t.progress, 0) / input.tasks.length / 100
      : 0;
    items = [{ id: "_project", budget: bac, progress: avgProgress }];
  }

  return {
    bac, curve, items, actualCost: ac,
    statusDate: input.statusDate, projectStart: input.projectStart,
  };
}

// ─── Confidence score (PT-9 / B4 formula) ───────────────────────────────────

// 100 × clamp01( 0.4·min(CPI,1) + 0.4·min(SPI(t),1) + 0.2·(1 − forecastBreach) )
// forecastBreach = how far EAC₂ exceeds BAC, as a fraction (0 if under budget).
// Cost and schedule weighted equally; forecast over-run is the lighter third
// term since it's downstream of CPI. Computed + non-editable — no hand-setting.
export function confidenceScore(s: EvmSnapshot): number {
  const cost = Math.min(s.cpi, 1);
  const sched = Math.min(s.spit, 1);
  const breach = Math.max(0, (s.bac > 0 ? s.eac2 / s.bac : 1) - 1);
  const raw = 0.4 * cost + 0.4 * sched + 0.2 * (1 - Math.min(breach, 1));
  return Math.round(100 * Math.max(0, Math.min(1, raw)));
}

export type VerdictLevel = "on-track" | "watch" | "at-risk";

export interface ExecutiveVerdict {
  score: number;
  level: VerdictLevel;
  headline: string;   // "On track" | "Watch" | "At risk"
  reason: string;     // plain-language dominant driver
  planOnly: boolean;  // true when nothing earned/spent yet — score is plan-only, not earned confidence
}

// Plain-language verdict for the dashboard. Headline by score band; reason
// names the single worst driver so the exec knows WHY without reading indices.
export function executiveVerdict(s: EvmSnapshot): ExecutiveVerdict {
  const score = confidenceScore(s);
  const level: VerdictLevel = score >= 80 ? "on-track" : score >= 60 ? "watch" : "at-risk";
  const headline = level === "on-track" ? "On track" : level === "watch" ? "Watch" : "At risk";

  // Identify the dominant drag.
  const breach = Math.max(0, (s.bac > 0 ? s.eac2 / s.bac : 1) - 1);
  let reason: string;
  if (s.ev === 0 && s.ac === 0) {
    // Day-zero honesty: a fresh project scores "on plan" because nothing has
    // deviated yet — say that, don't imply earned trust.
    reason = "Nothing earned or spent yet — the score reflects the plan only, and sharpens as work and spend register.";
  } else if (level === "on-track") {
    reason = "Cost and schedule both tracking to plan.";
  } else if (s.cpi <= s.spit && s.cpi < 1) {
    reason = `Cost efficiency is the main drag (CPI ${s.cpi.toFixed(2)}). Forecast final cost ${breach > 0 ? `${(breach * 100).toFixed(0)}% over budget` : "near budget"}.`;
  } else if (s.spit < 1) {
    reason = `Schedule is the main drag (SPI(t) ${s.spit.toFixed(2)}) — behind in real time.`;
  } else {
    reason = `Forecast final cost is ${(breach * 100).toFixed(0)}% over budget.`;
  }
  return { score, level, headline, reason, planOnly: s.ev === 0 && s.ac === 0 };
}

// Convenience: derive → compute → score + range in one call for the dashboard.
export interface ProjectEvm {
  snapshot: EvmSnapshot;
  verdict: ExecutiveVerdict;
  range: ForecastRange;
}
export function computeProjectEvm(input: DeriveInput): ProjectEvm {
  const snapshot = computeEvm(deriveEvmInput(input));
  return { snapshot, verdict: executiveVerdict(snapshot), range: forecastRange(snapshot) };
}
