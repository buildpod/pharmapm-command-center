// CX-1 fix-it regression: a project with no cost lines (every fresh import)
// must NEVER reach the score render path — it previously showed a fabricated
// "On track — 100/100 confidence".

import { describe, it, expect } from "vitest";
import { evmCoverage, effectiveStatusDate } from "./evm-coverage";
import { computeProjectEvm } from "./evm-project";

describe("evm-coverage gate", () => {
  it("no cost lines → not ready, names the gap", () => {
    const c = evmCoverage({ costLineCount: 0, taskCount: 4 });
    expect(c.ready).toBe(false);
    expect(c.missing).toEqual(["budget lines"]);
  });

  it("no tasks → not ready", () => {
    const c = evmCoverage({ costLineCount: 3, taskCount: 0 });
    expect(c.ready).toBe(false);
    expect(c.missing).toEqual(["tasks"]);
  });

  it("both missing → both named, budget first", () => {
    expect(evmCoverage({ costLineCount: 0, taskCount: 0 }).missing).toEqual(["budget lines", "tasks"]);
  });

  it("data present → ready", () => {
    expect(evmCoverage({ costLineCount: 1, taskCount: 1 }).ready).toBe(true);
  });

  it("REGRESSION: the fabricated-100 case is exactly what the gate must catch", () => {
    // bac=0 makes every index fall back to 1 → perfect score from nothing.
    const out = computeProjectEvm({
      costLines: [],
      plannedCurve: [{ month: "Jan", planned: 200 }],
      tasks: [{ progress: 50 }],
      projectStart: "2026-06-01",
      statusDate: "2026-05-19",
      curveYear: 2026,
    });
    expect(out.verdict.score).toBe(100);          // the engine DOES fabricate…
    expect(evmCoverage({ costLineCount: 0, taskCount: 1 }).ready).toBe(false); // …so the gate must block it
  });
});

describe("effectiveStatusDate", () => {
  it("keeps the demo date for projects already running", () => {
    expect(effectiveStatusDate("2026-01-01", "2026-05-19")).toBe("2026-05-19");
  });
  it("clamps to projectStart for projects created after the demo date", () => {
    expect(effectiveStatusDate("2026-06-01", "2026-05-19")).toBe("2026-06-01");
  });
});
