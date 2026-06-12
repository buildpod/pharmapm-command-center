// Class C — per-project planned-value baseline (TRANSPARENCY_MODEL §11 v1).
//
// Until now every project's EVM ran against the SAMPLE project's budgetTrend
// curve — the last place sample data leaked into a real project's math. This
// module derives a project-specific planned-value curve at runtime: a linear
// spread of the project's own total budget from its own start date to its own
// go-live date. Deliberately simple and defensible (PMBOK-acceptable v1);
// S-curves and a persisted, re-baselineable CostBaseline entity come with the
// backend (PT-1 full).
//
// Pure domain module: no store/UI imports. Units: cumulativePV is in the same
// currency unit as totalBudget (callers pass dollars).

import type { PvPoint } from "./evm";

export interface LinearBaselineInput {
  totalBudget: number;   // BAC, in currency units (dollars)
  startDate: string;     // ISO yyyy-mm-dd
  endDate: string;       // ISO yyyy-mm-dd (go-live)
}

const DAY_MS = 86_400_000;

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

// Linear cumulative PV curve from start (0) to end (totalBudget), with a
// point at each month boundary so Earned Schedule interpolation has
// resolution. Degenerate windows (end ≤ start) collapse to a step at start —
// safeDiv in the engine keeps the indices sane.
export function deriveLinearBaseline(input: LinearBaselineInput): PvPoint[] {
  const start = new Date(`${input.startDate}T00:00:00Z`).getTime();
  const end = new Date(`${input.endDate}T00:00:00Z`).getTime();
  const budget = Math.max(0, input.totalBudget);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return [
      { date: input.startDate, cumulativePV: 0 },
      { date: input.startDate, cumulativePV: budget },
    ];
  }

  const span = end - start;
  const points: PvPoint[] = [{ date: input.startDate, cumulativePV: 0 }];

  // First day of each month strictly between start and end.
  const cursor = new Date(start);
  cursor.setUTCDate(1);
  cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  while (cursor.getTime() < end) {
    const t = cursor.getTime();
    if (t > start) {
      points.push({
        date: toIso(t),
        cumulativePV: Math.round(budget * ((t - start) / span)),
      });
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  points.push({ date: input.endDate, cumulativePV: budget });
  return points;
}

// Convenience for the app layer: derive directly from a project's cost lines
// (stored in $k) and its dates.
export function projectBaseline(args: {
  costLines: { budgetK: number }[];
  startDate: string;
  goLiveDate: string;
}): PvPoint[] {
  const totalBudget = args.costLines.reduce((s, c) => s + c.budgetK, 0) * 1000;
  return deriveLinearBaseline({ totalBudget, startDate: args.startDate, endDate: args.goLiveDate });
}

// DAY_MS exported for tests that reason about durations.
export const MS_PER_DAY = DAY_MS;
