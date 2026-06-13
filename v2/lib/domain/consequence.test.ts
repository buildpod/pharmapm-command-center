// Impact Engine consequence tests. Each spec rule (C1, C3, C5, C6, C7) has a
// test that asserts the WRONG answer never appears — that is the product. Step 5
// adds the perturbation union: scope-add, cost-overcharge, absence all flow the
// same chain as a task date slip.

import { describe, it, expect } from "vitest";
import {
  projectConsequence,
  type ProjectConsequenceInput,
  type ScheduleOutcome,
  type Perturbation,
} from "./consequence";
import type { EvmSnapshot } from "./evm";
import { compare } from "./dates";

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
    ...over,
  };
}

const intermediatePush = {
  milestoneId: "m8", milestoneName: "Configuration Complete",
  oldPlannedDate: "2026-06-30", proposedNewDate: "2026-07-07",
  drivenByTaskId: "t1", drivenByTaskName: "SIT Cycle 2", daysShifted: 5,
};

// A schedule outcome where go-live overruns by ~10 working days.
function slipSchedule(over: Partial<ScheduleOutcome> = {}): ScheduleOutcome {
  return {
    affected: [],
    milestonePushes: [intermediatePush],
    goLiveProjectedUnlocked: "2026-09-16",
    ...over,
  };
}

const taskDate: Perturbation = { kind: "task-date", taskName: "SIT Cycle 2", workingDaysShift: 5 };

function base(over: Partial<ProjectConsequenceInput> = {}): ProjectConsequenceInput {
  return {
    perturbation: taskDate,
    schedule: slipSchedule(),
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

describe("C1 — a disruption never raises confidence", () => {
  it("confidence after ≤ before when the slip adds T&M cost", () => {
    const r = projectConsequence(base());
    expect(r.confidence.before).not.toBeNull();
    expect(r.confidence.after!).toBeLessThanOrEqual(r.confidence.before!);
  });

  it("even with a huge slip, confidence cannot increase", () => {
    const r = projectConsequence(base({ schedule: slipSchedule({ goLiveProjectedUnlocked: "2027-03-01" }) }));
    expect(r.confidence.after!).toBeLessThanOrEqual(r.confidence.before!);
  });
});

describe("C3 — a slip with slack moves nothing", () => {
  it("go-live unaffected → absorbed, benign, zero slip/cost, confidence held", () => {
    const r = projectConsequence(base({ schedule: slipSchedule({ goLiveProjectedUnlocked: null }) }));
    expect(r.goLive.absorbed).toBe(true);
    expect(r.goLive.lockedBreach).toBe(false);
    expect(r.goLive.workingDaysSlip).toBe(0);
    expect(r.cost.addedCost).toBe(0);
    expect(r.confidence.moves).toBe(false);
    expect(r.commitmentBreach).toBe(false);
    expect(r.benign).toBe(true);
  });

  it("downstream dates shift but still fit → absorbed, summary names the shifts honestly", () => {
    const r = projectConsequence(base({
      schedule: slipSchedule({
        goLiveProjectedUnlocked: null,
        affected: [{ id: "t2", name: "B", oldDue: "2026-05-30", newDue: "2026-06-04", daysShifted: 4 }],
      }),
    }));
    expect(r.goLive.absorbed).toBe(true);
    expect(r.summary).toMatch(/still fit before go-live/i);
    expect(r.summary).not.toMatch(/nothing downstream/i);
  });
});

describe("locked breach — a locked go-live the work overruns is NOT absorbed", () => {
  it("flags lockedBreach, holds the date, reports the overrun + compression", () => {
    const r = projectConsequence(base({ baseline: baseline({ goLiveLocked: true }) }));
    expect(r.goLive.absorbed).toBe(false);
    expect(r.goLive.lockedBreach).toBe(true);
    expect(r.goLive.projected).toBe("2026-09-02");
    expect(r.goLive.workingDaysSlip).toBeGreaterThan(0);
    expect(r.commitmentBreach).toBe(true);
    expect(r.summary).toMatch(/locked/i);
    expect(r.summary).toMatch(/compress|missed/i);
  });
});

describe("C5 — duration cost accrues on T&M lines only", () => {
  it("fixed/internal-only project → extension cost not estimable, no fabricated number", () => {
    const r = projectConsequence(
      base({ costLines: [{ budgetK: 650, contractType: "Fixed" }, { budgetK: 150, contractType: "Internal" }] }),
    );
    expect(r.cost.estimable).toBe(false);
    expect(r.cost.addedCost).toBe(0);
    expect(r.cost.reason).toMatch(/time-&-materials/i);
    expect(r.confidence.moves).toBe(false);
    expect(r.commitmentBreach).toBe(true);
  });

  it("T&M extension cost is positive and derives from the T&M budget", () => {
    const r = projectConsequence(base());
    expect(r.cost.estimable).toBe(true);
    expect(r.cost.tmExtensionCost).toBeGreaterThan(0);
    expect(r.cost.tmBudget).toBe(320_000);
  });
});

describe("C6 — working AND calendar days reported", () => {
  it("exposes both and the summary pairs them", () => {
    const r = projectConsequence(base());
    expect(r.goLive.workingDaysSlip).toBeGreaterThan(0);
    expect(r.goLive.calendarDaysSlip).toBeGreaterThanOrEqual(r.goLive.workingDaysSlip);
    expect(r.summary).toMatch(/working day/i);
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
  it("builds a traceable source → milestone → go-live chain and flags the breach", () => {
    const r = projectConsequence(base());
    expect(r.commitmentBreach).toBe(true);
    expect(r.chain[0].kind).toBe("task");
    expect(r.chain[r.chain.length - 1].name).toMatch(/go-live/i);
    expect(r.chain.some((c) => c.kind === "milestone" && c.name === "Configuration Complete")).toBe(true);
  });
});

// ─── Step 5: the perturbation union ────────────────────────────────────────────

describe("cost-overcharge — pure-cost disruption, no schedule arm", () => {
  it("go-live holds, but cost rises and confidence drops (not benign)", () => {
    const r = projectConsequence({
      perturbation: { kind: "cost-overcharge", lineName: "Validation vendor", overAmount: 200_000 },
      schedule: null,
      baseline: baseline(),
      costLines: [{ budgetK: 320, contractType: "T&M" }],
      snapshot: snapshot(),
    });
    expect(r.goLive.absorbed).toBe(true);
    expect(r.commitmentBreach).toBe(false);
    expect(r.cost.directCost).toBe(200_000);
    expect(r.cost.addedCost).toBe(200_000);
    expect(r.confidence.moves).toBe(true);
    expect(r.confidence.after!).toBeLessThan(r.confidence.before!);  // C1
    expect(r.benign).toBe(false);                                    // amber, not all-clear
    expect(r.summary).toMatch(/over budget/i);
  });
});

describe("scope-add — direct cost plus optional schedule arm", () => {
  it("adds budget and, when it reaches go-live, slips it too", () => {
    const r = projectConsequence({
      perturbation: { kind: "scope-add", itemName: "Extra integration", addedBudget: 120_000 },
      schedule: slipSchedule(),
      baseline: baseline(),
      costLines: [{ budgetK: 320, contractType: "T&M" }],
      snapshot: snapshot(),
    });
    expect(r.cost.directCost).toBe(120_000);
    expect(r.cost.addedCost).toBeGreaterThan(120_000); // direct + T&M extension
    expect(r.commitmentBreach).toBe(true);
    expect(r.confidence.after!).toBeLessThanOrEqual(r.confidence.before!);
    expect(r.summary).toMatch(/Extra integration/);
  });
});

describe("trust & adjust — overridable T&M day-rate re-flows the cost", () => {
  it("exposes the implied rate and derivation fields", () => {
    const r = projectConsequence(base());
    expect(r.cost.tmDayRateImplied).toBeGreaterThan(0);
    expect(r.cost.tmDayRate).toBe(r.cost.tmDayRateImplied);
    expect(r.cost.committedDurationDays).toBeGreaterThan(0);
    expect(r.cost.overrunDays).toBe(r.goLive.workingDaysSlip);
    expect(r.cost.rateOverridden).toBe(false);
  });

  it("a higher PM-supplied rate raises the extension cost and is flagged", () => {
    const base0 = projectConsequence(base());
    const override = projectConsequence(base({ tmDayRateOverride: base0.cost.tmDayRateImplied * 3 }));
    expect(override.cost.rateOverridden).toBe(true);
    expect(override.cost.tmExtensionCost).toBeGreaterThan(base0.cost.tmExtensionCost);
    // C1 still holds — more cost can only lower or hold confidence
    expect(override.confidence.after!).toBeLessThanOrEqual(base0.confidence.after!);
  });
});

describe("step 6 — hard windows enlarge the slip and are reported", () => {
  it("a go-live landing in a freeze is pushed to the next clear date", () => {
    const r = projectConsequence(base({
      baseline: baseline(),  // unlocked → go-live can move
      hardWindows: [{ id: "f", label: "Q3 freeze", kind: "freeze", start: "2026-09-10", end: "2026-09-30" }],
    }));
    // raw projected 2026-09-16 is inside the freeze → pushed past 2026-09-30
    expect(r.windowCollision).not.toBeNull();
    expect(r.windowCollision!.label).toBe("Q3 freeze");
    expect(compare(r.goLive.projected, "2026-09-30")).toBe(1);
    expect(r.summary).toMatch(/Q3 freeze/);
  });

  it("no windows → no collision, slip unchanged", () => {
    const r = projectConsequence(base());
    expect(r.windowCollision).toBeNull();
  });
});

describe("absence — forced gate date flows the same chain", () => {
  it("when the gate can't complete before the return date and overruns go-live", () => {
    const r = projectConsequence({
      perturbation: { kind: "absence", who: "QA approver", until: "2026-09-10", gateName: "UAT Sign-off" },
      schedule: slipSchedule(),
      baseline: baseline({ goLiveLocked: true }),
      costLines: [{ budgetK: 320, contractType: "T&M" }],
      snapshot: snapshot(),
    });
    expect(r.goLive.lockedBreach).toBe(true);
    expect(r.summary).toMatch(/QA approver/);
    expect(r.summary).toMatch(/unavailable until 2026-09-10/);
  });
});
