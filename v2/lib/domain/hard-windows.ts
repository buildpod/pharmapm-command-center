// Impact Engine — hard windows (IMPACT_ENGINE_SPEC.md step 6).
//
// The mechanical cascade moves dates by dependency math (finish + 1 working
// day). But real go-lives hit WALLS the cascade knows nothing about: a change
// freeze, an approver's absence, a resource rolling off. When a projected date
// lands inside one of these windows it cannot happen there — it jumps to the
// next clear date, and the real slip is bigger than the dependency math says.
//
// This is the part no competitor's cascade can fake, because it encodes the
// organisation's own calendar, not just the task graph.
//
// Pure domain module: no store/UI imports.

import { addWorkingDays, compare } from "./dates";

export type HardWindowKind = "freeze" | "absence" | "roll-off";

export interface HardWindow {
  id: string;
  label: string;            // human-readable, e.g. "Q3 validation freeze"
  kind: HardWindowKind;
  start: string;            // ISO, inclusive
  end: string;              // ISO, inclusive — nothing may land in [start, end]
}

export interface WindowResolution {
  effectiveDate: string;                                    // first date clear of all windows
  collisions: { window: HardWindow; landedOn: string }[];   // windows the proposal hit, in order
}

function inWindow(date: string, w: HardWindow): boolean {
  return compare(date, w.start) >= 0 && compare(date, w.end) <= 0;
}

// Push `proposed` forward until it clears every window. A date pushed out of one
// window can land in another, so we iterate (bounded). The next clear date is
// the first working day AFTER the blocking window's end.
export function clearOfWindows(
  proposed: string,
  windows: HardWindow[],
  workingDays: number[] = [1, 2, 3, 4, 5],
  holidays: string[] = [],
): WindowResolution {
  const collisions: WindowResolution["collisions"] = [];
  let cursor = proposed;
  let guard = 0;

  while (guard < 100) {
    const hit = windows.find((w) => inWindow(cursor, w));
    if (!hit) break;
    collisions.push({ window: hit, landedOn: cursor });
    // Next working day strictly after the window end.
    const next = addWorkingDays(hit.end, 1, workingDays, holidays);
    if (!next || compare(next, cursor) <= 0) break; // defensive: no progress
    cursor = next;
    guard++;
  }

  return { effectiveDate: cursor, collisions };
}

// Demo seed — only the sample project carries windows until there's UI to
// author them (kept here, sample-scoped, like use-project-evm's budgetTrend).
// A realistic pharma release freeze straddling the sample's go-live window.
export const SAMPLE_HARD_WINDOWS: HardWindow[] = [
  {
    id: "freeze-q4",
    label: "Q4 release freeze",
    kind: "freeze",
    start: "2026-10-01",
    end: "2026-11-15",
  },
];
