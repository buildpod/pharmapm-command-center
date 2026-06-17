import { describe, it, expect } from "vitest";
import { computeStatusIntegrity } from "./status-integrity";

describe("Status Integrity Index (F1)", () => {
  it("a believable project (progress tracks spend + gates) is consistent", () => {
    const r = computeStatusIntegrity({
      percentComplete: 0.4, percentSpent: 0.38, cpi: 1.05, gatesTotal: 8, gatesComplete: 3,
    });
    expect(r.band).toBe("consistent");
    expect(r.flags).toHaveLength(0);
  });

  it("the pressure-test fake (all 100% done, half spent → CPI 2) is flagged overstated", () => {
    const r = computeStatusIntegrity({
      percentComplete: 1, percentSpent: 0.5, cpi: 2, gatesTotal: 8, gatesComplete: 0,
    });
    expect(r.band).toBe("overstated");
    expect(r.flags.some((f) => f.kind === "efficiency-implausible")).toBe(true);
    expect(r.flags.some((f) => f.kind === "no-gate-corroboration")).toBe(true);
  });

  it("completion with no gates reached is at least a watch", () => {
    const r = computeStatusIntegrity({
      percentComplete: 0.6, percentSpent: 0.55, cpi: 1.1, gatesTotal: 6, gatesComplete: 0,
    });
    expect(r.band).toBe("watch");
    expect(r.flags[0].kind).toBe("no-gate-corroboration");
  });

  it("near-complete with almost no spend is flagged", () => {
    const r = computeStatusIntegrity({
      percentComplete: 0.7, percentSpent: 0.05, cpi: 1.2, gatesTotal: 0, gatesComplete: 0,
    });
    expect(r.flags.some((f) => f.kind === "progress-without-spend")).toBe(true);
  });

  it("does not flag genuine early efficiency that has gate progress", () => {
    // CPI just under threshold, gates moving → no false alarm.
    const r = computeStatusIntegrity({
      percentComplete: 0.3, percentSpent: 0.22, cpi: 1.36, gatesTotal: 8, gatesComplete: 2,
    });
    expect(r.band).toBe("consistent");
  });
});
