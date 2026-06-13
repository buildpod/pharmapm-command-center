// Impact Engine consequence tests. Each spec rule (C1, C3, C5, C6, C7) has a
// test that asserts the WRONG answer never appears — that is the product.

import { describe, it, expect } from "vitest";
import { projectConsequence, type ProjectConsequenceInput, type MilestonePush } from "./consequence";
import type { EvmSnapshot } from "./evm";

// A behind-on-cost snapshot: CPI < 1 so extra burn visibly lowers confidence.
function snapshot(over: Partial<EvmSnapshot> = {}): EvmSnapshot {
  const bac = 2_000_000;
  const ev = 800_000;
  const ac = 1_000_000;       // CPI = 0.8
  const cpi = ev / ac;
  const eac2 = bac / cpi;     // 2.5M → breach 0.25
  return {
    bac, pv: 900_000, ev, ac,
    cv: ev - ac, sv: ev - 900_000,
    cpi, spi: ev / 900_000,
    eac1: ac + (bac - ev), eac2, eac3: eac2, eacHeadline: eac2,
    etc: eac2 - ac, vac: bac - eac2,
    tcpi: (bac - ev) / (bac - ac),
    es: 120, at: 140, svt: -20, spit: 120 / 140,
    percentComplete: ev / bac, percentSpent: ac / bac,
    ...over,
  };
}

function baseline(over: Partial<ProjectConsequenceInput["baseline"]> = {}): ProjectConsequenceInput["baseline"] {
  return {
    committedGoLive: "2026-09-02",
    projectStart: "2026-01-06",
    goLiveMilestoneId: "m13",
    goLiveName: "Go-Live",
    goLiveLocked: false,
    goLiveProjectedUnlocked: "2026-09-16", // +10 working days → go-live slips
    ...over,
  };
}

const intermediatePush: MilestonePush = {
  milestoneId: "m8", milestoneName: "Configuration Complete",
  oldPlannedDate: "2026-06-30", proposedNewDate: "2026-07-07",
  drivenByTaskId: "t1", drivenByTaskName: "SIT Cycle 2", daysShifted: 5,
};

function base(over: Partial<ProjectConsequenceInput> = {}): ProjectConsequenceInput {
  return {
    editedTaskName: "SIT Cycle 2",
    editWorkingDaysShift: 5,
    affected: [],
    milestonePushes: [intermediatePush],
    baseline: baseline(),
    costLines: [
      { budgetK: 320, contractType: "T&M" },
      { budgetK: 650, contractType: "Fixed" },
      { budgetK: 150, contractType: "Internal" },
    ],
    snapshot: snapshot(),
    ...over,
  };
}

describe("C1 — a slip never raises confidence", () => {
  it("confidence after ≤ before when the slip adds T&M cost", () => {
    const r = projectConsequence(base());
    expect(r.confidence.before).not.toBeNull();
    expect(r.confidence.after!).toBeLessThanOrEqual(r.confidence.before!);
  });

  it("even with a huge slip, confidence cannot increase", () => {
    const r = projectConsequence(base({ baseline: baseline({ goLiveProjectedUnlocked: "2027-03-01" }) }));
    expect(r.confidence.after!).toBeLessThanOrEqual(r.confidence.before!);
  });
});

describe("C3 — a slip with slack moves nothing", () => {
  it("go-live unaffected (work still fits) → absorbed, zero slip, zero cost, confidence held", () => {
    const r = projectConsequence(base({ baseline: baseline({ goLiveProjectedUnlocked: null }) }));
    expect(r.goLive.absorbed).toBe(true);
    expect(r.goLive.lockedBreach).toBe(false);
    expect(r.goLive.workingDaysSlip).toBe(0);
    expect(r.cost.addedCost).toBe(0);
    expect(r.confidence.moves).toBe(false);
    expect(r.commitmentBreach).toBe(false);
  });

  it("downstream dates shift but still fit → absorbed, summary names the shifts honestly", () => {
    const r = projectConsequence(base({
      baseline: baseline({ goLiveProjectedUnlocked: null }),
      affected: [{ id: "t2", name: "B", oldDue: "2026-05-30", newDue: "2026-06-04", daysShifted: 4 }],
    }));
    expect(r.goLive.absorbed).toBe(true);
    expect(r.summary).toMatch(/still fit before go-live/i);
    expect(r.summary).not.toMatch(/nothing downstream/i);
  });
});

describe("locked breach — a locked go-live the work overruns is NOT absorbed", () => {
  it("flags lockedBreach, holds the date, reports the overrun + compression", () => {
    const r = projectConsequence(base({
      baseline: baseline({ goLiveLocked: true, goLiveProjectedUnlocked: "2026-09-16" }),
    }));
    expect(r.goLive.absorbed).toBe(false);
    expect(r.goLive.lockedBreach).toBe(true);
    expect(r.goLive.projected).toBe("2026-09-02");   // pinned to committed
    expect(r.goLive.workingDaysSlip).toBeGreaterThan(0);
    expect(r.commitmentBreach).toBe(true);
    expect(r.summary).toMatch(/locked/i);
    expect(r.summary).toMatch(/compress|missed/i);
  });
});

describe("C5 — cost accrues on T&M lines only", () => {
  it("fixed/internal-only project → cost not estimable, no fabricated number", () => {
    const r = projectConsequence(
      base({ costLines: [{ budgetK: 650, contractType: "Fixed" }, { budgetK: 150, contractType: "Internal" }] }),
    );
    expect(r.cost.estimable).toBe(false);
    expect(r.cost.addedCost).toBe(0);
    expect(r.cost.reason).toMatch(/time-&-materials/i);
    // confidence holds (no defensible cost to move it) but go-live still slips
    expect(r.confidence.moves).toBe(false);
    expect(r.commitmentBreach).toBe(true);
  });

  it("T&M added cost = implied day-rate × working-day slip", () => {
    const r = projectConsequence(base());
    // T&M budget 320k over committed duration; 10-wd slip. Positive, bounded.
    expect(r.cost.estimable).toBe(true);
    expect(r.cost.addedCost).toBeGreaterThan(0);
    expect(r.cost.tmBudget).toBe(320_000);
  });
});

describe("C6 — working AND calendar days reported", () => {
  it("exposes both and the summary pairs them", () => {
    const r = projectConsequence(base());
    expect(r.goLive.workingDaysSlip).toBeGreaterThan(0);
    expect(r.goLive.calendarDaysSlip).toBeGreaterThanOrEqual(r.goLive.workingDaysSlip);
    expect(r.summary).toMatch(/working day/i);
    expect(r.summary).toMatch(/week|day/i);
  });
});

describe("C7 — never show a number you can't defend", () => {
  it("no snapshot (no coverage) → confidence is null, not fabricated", () => {
    const r = projectConsequence(base({ snapshot: null }));
    expect(r.confidence.before).toBeNull();
    expect(r.confidence.after).toBeNull();
    expect(r.confidence.moves).toBe(false);
    expect(r.confidence.note).toMatch(/coverage/i);
  });
});

describe("chain + breach", () => {
  it("builds a traceable task → milestone → go-live chain and flags the breach", () => {
    const r = projectConsequence(base({ milestonePushes: [intermediatePush] }));
    expect(r.commitmentBreach).toBe(true);
    expect(r.chain[0].kind).toBe("task");
    expect(r.chain[r.chain.length - 1].name).toMatch(/go-live/i);
    expect(r.chain.some((c) => c.kind === "milestone" && c.name === "Configuration Complete")).toBe(true);
  });
});
