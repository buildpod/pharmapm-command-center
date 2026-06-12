// Class C — per-project linear PV baseline tests.

import { describe, it, expect } from "vitest";
import { deriveLinearBaseline, projectBaseline } from "./baseline";

describe("deriveLinearBaseline", () => {
  it("starts at 0 and ends at the full budget on the end date", () => {
    const curve = deriveLinearBaseline({ totalBudget: 120_000, startDate: "2026-06-01", endDate: "2026-12-01" });
    expect(curve[0]).toEqual({ date: "2026-06-01", cumulativePV: 0 });
    expect(curve[curve.length - 1]).toEqual({ date: "2026-12-01", cumulativePV: 120_000 });
  });

  it("is linear: halfway through the window ≈ half the budget", () => {
    const curve = deriveLinearBaseline({ totalBudget: 100_000, startDate: "2026-01-01", endDate: "2026-12-31" });
    const july = curve.find((p) => p.date === "2026-07-01");
    expect(july).toBeDefined();
    // 181 of 364 days elapsed ≈ 49.7%
    expect(july!.cumulativePV).toBeGreaterThan(48_000);
    expect(july!.cumulativePV).toBeLessThan(52_000);
  });

  it("adds a point per month boundary for ES interpolation resolution", () => {
    const curve = deriveLinearBaseline({ totalBudget: 90_000, startDate: "2026-06-15", endDate: "2026-09-15" });
    const dates = curve.map((p) => p.date);
    expect(dates).toEqual(["2026-06-15", "2026-07-01", "2026-08-01", "2026-09-01", "2026-09-15"]);
  });

  it("is monotonically non-decreasing", () => {
    const curve = deriveLinearBaseline({ totalBudget: 77_777, startDate: "2026-03-10", endDate: "2027-02-20" });
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].cumulativePV).toBeGreaterThanOrEqual(curve[i - 1].cumulativePV);
    }
  });

  it("degenerate window (end ≤ start) collapses to a step, never throws", () => {
    const curve = deriveLinearBaseline({ totalBudget: 50_000, startDate: "2026-06-01", endDate: "2026-06-01" });
    expect(curve[0].cumulativePV).toBe(0);
    expect(curve[curve.length - 1].cumulativePV).toBe(50_000);
  });

  it("crosses year boundaries correctly (the month-label bug this replaces)", () => {
    // A Jun 2026 → Jan 2027 project broke the old month-label mapping, which
    // anchored every label to one curveYear. Dates can't be ambiguous.
    const curve = deriveLinearBaseline({ totalBudget: 100_000, startDate: "2026-06-01", endDate: "2027-01-30" });
    expect(curve.some((p) => p.date === "2027-01-01")).toBe(true);
    expect(curve[curve.length - 1].date).toBe("2027-01-30");
  });
});

describe("projectBaseline", () => {
  it("derives BAC from the project's own cost lines ($k → $)", () => {
    const curve = projectBaseline({
      costLines: [{ budgetK: 300 }, { budgetK: 200 }],
      startDate: "2026-06-01",
      goLiveDate: "2026-11-30",
    });
    expect(curve[curve.length - 1].cumulativePV).toBe(500_000);
  });
});
