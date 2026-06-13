import { describe, it, expect } from "vitest";
import { clearOfWindows, type HardWindow } from "./hard-windows";

const freeze: HardWindow = { id: "f", label: "Q3 freeze", kind: "freeze", start: "2026-08-20", end: "2026-09-20" };

describe("clearOfWindows", () => {
  it("a date clear of all windows is unchanged", () => {
    const r = clearOfWindows("2026-07-01", [freeze]);
    expect(r.effectiveDate).toBe("2026-07-01");
    expect(r.collisions).toHaveLength(0);
  });

  it("a date inside a freeze jumps to the next working day after it", () => {
    const r = clearOfWindows("2026-09-16", [freeze]);
    // 2026-09-20 is a Sunday → next working day is Monday 2026-09-21
    expect(r.effectiveDate).toBe("2026-09-21");
    expect(r.collisions).toHaveLength(1);
    expect(r.collisions[0].window.label).toBe("Q3 freeze");
  });

  it("clears consecutive windows by iterating", () => {
    const a: HardWindow = { id: "a", label: "A", kind: "freeze", start: "2026-09-01", end: "2026-09-10" };
    const b: HardWindow = { id: "b", label: "B", kind: "absence", start: "2026-09-11", end: "2026-09-15" };
    const r = clearOfWindows("2026-09-05", [a, b]);
    expect(compare(r.effectiveDate, "2026-09-15")).toBe(1); // past both
    expect(r.collisions.length).toBeGreaterThanOrEqual(2);
  });
});

// local compare to avoid importing dates in the assertion
function compare(a: string, b: string): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}
