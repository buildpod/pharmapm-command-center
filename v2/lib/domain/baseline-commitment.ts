// Frozen delivery commitment (pressure-test finding F2).
//
// Impact used to measure against `project.goLiveDate` — a live, editable field.
// That let a slip vanish: move the date later and the breach reads zero. The
// commitment must be FROZEN at baseline, so impact is measured against the date
// that was promised, not whatever the plan was quietly edited to. Changing it is
// a deliberate, logged re-baseline — never a silent edit.
//
// This module is the pure logic (no storage). The per-project frozen value is
// persisted by the caller (baseline-store); here we just reason about it.

import { compare, daysBetween } from "./dates";

export interface CommitmentStatus {
  committed: string;        // the FROZEN committed go-live — what impact measures against
  current: string;          // the project's current (live) go-live date
  rebaselined: boolean;     // true → the live date differs from the frozen commitment
  driftDays: number;        // calendar days the current date has moved from committed (+ = later)
}

// Decide the commitment to measure against and surface any drift. Always returns
// the FROZEN committed date as the measurement anchor — moving the live date
// does not change it (that's the whole point of F2).
export function commitmentStatus(frozenCommitted: string, currentGoLive: string): CommitmentStatus {
  const rebaselined = !!frozenCommitted && !!currentGoLive && compare(frozenCommitted, currentGoLive) !== 0;
  return {
    committed: frozenCommitted || currentGoLive,
    current: currentGoLive,
    rebaselined,
    driftDays: rebaselined ? daysBetween(frozenCommitted, currentGoLive) : 0,
  };
}
