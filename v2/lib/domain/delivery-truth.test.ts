import { describe, expect, it } from "vitest";
import { calculateDeliveryTruth, type DeliveryTruthInput } from "./delivery-truth";
import { confidenceScore as evmConfidenceScore } from "./evm-project";
import type { EvmSnapshot } from "./evm";
import type { CostLine, Document, Milestone, Project, Risk, Task } from "@/lib/mockData";

// Minimal EVM snapshot factory — only the fields the truth engine reads matter.
function snap(over: Partial<EvmSnapshot> = {}): EvmSnapshot {
  return {
    bac: 100_000, pv: 50_000, ev: 50_000, ac: 50_000,
    cv: 0, sv: 0, cpi: 1, spi: 1,
    eac1: 100_000, eac2: 100_000, eac3: 100_000, eacHeadline: 100_000,
    etc: 50_000, vac: 0, tcpi: 1,
    es: 60, at: 60, svt: 0, spit: 1,
    percentComplete: 0.5, percentSpent: 0.5,
    ...over,
  };
}

const project: Project = {
  id: "p1",
  name: "Demo Project",
  client: "Demo Client",
  phase: "Execution",
  startDate: "2026-01-01",
  goLiveDate: "2026-06-30",
  methodology: "GAMP 5",
};

const milestone: Milestone = {
  id: "m1",
  name: "Go-Live",
  phase: "Go-Live",
  plannedDate: "2026-06-30",
  forecastDate: "2026-06-30",
  status: "pending",
  locked: true,
  owner: "VP",
  projectId: project.id,
};

const task: Task = {
  id: "t1",
  name: "Prepare package",
  workstream: "Project Mgmt",
  priority: "Medium",
  status: "In Progress",
  progress: 80,
  owner: "VP",
  dueDate: "2026-05-30",
  projectId: project.id,
};

const document: Document = {
  id: "d1",
  name: "Readiness Checklist",
  type: "Go-Live",
  phase: "Go-Live",
  version: "1.0",
  status: "approved",
  dueDate: "2026-06-15",
  owner: "VP",
  reviewers: [],
  approvers: [],
  projectId: project.id,
};

const risk: Risk = {
  id: "r1",
  title: "Minor adoption risk",
  category: "Change",
  probability: 1,
  impact: 2,
  score: 2,
  status: "mitigated",
  owner: "VP",
  mitigation: "Monitor",
  projectId: project.id,
};

const costLine: CostLine = {
  id: "c1",
  category: "Implementation",
  description: "Configuration",
  budgetK: 100,
  actualK: 20,
  contractType: "Fixed",
  owner: "VP",
  projectId: project.id,
};

function input(overrides: Partial<DeliveryTruthInput> = {}): DeliveryTruthInput {
  return {
    project,
    milestones: [milestone],
    tasks: [task],
    risks: [risk],
    documents: [document],
    costLines: [costLine],
    currentDate: "2026-03-01",
    ...overrides,
  };
}

describe("calculateDeliveryTruth", () => {
  it("keeps confidence high for a clean project", () => {
    const truth = calculateDeliveryTruth(input());

    expect(truth.coverage.isReady).toBe(true);
    expect(truth.confidenceBand).toBe("credible");
    expect(truth.confidenceScore).toBe(100);
    expect(truth.signals).toHaveLength(0);
    expect(truth.decisionOptions[0].id).toBe("maintain-course");
  });

  it("does not call an empty project credible", () => {
    const truth = calculateDeliveryTruth(input({
      milestones: [],
      tasks: [],
      documents: [],
      costLines: [],
    }));

    expect(truth.coverage.isReady).toBe(false);
    expect(truth.confidenceBand).toBe("not-ready");
    expect(truth.confidenceScore).toBe(0);
    expect(truth.decisionOptions[0].id).toBe("finish-setup");
    expect(truth.coverage.reasons).toContain("Add at least one milestone so the promise has a target path.");
  });

  it("raises schedule drift when forecast dates move later than plan", () => {
    const truth = calculateDeliveryTruth(input({
      milestones: [{ ...milestone, forecastDate: "2026-07-08" }],
    }));

    expect(truth.signals.map((signal) => signal.kind)).toContain("schedule-drift");
    expect(truth.scheduleDeltaDays).toBe(8);
    expect(truth.confidenceBand).toBe("watch");
  });

  it("raises cost pressure when actual spend exceeds budget", () => {
    const truth = calculateDeliveryTruth(input({
      costLines: [{ ...costLine, actualK: 125 }],
    }));

    const signal = truth.signals.find((item) => item.kind === "cost-pressure");
    expect(signal?.severity).toBe("critical");
    expect(truth.budget.burnPct).toBe(125);
  });

  it("raises decision debt for overdue pending document decisions", () => {
    const truth = calculateDeliveryTruth(input({
      currentDate: "2026-05-20",
      documents: [{
        ...document,
        status: "in-review",
        dueDate: "2026-05-18",
        approvers: [{ person: "Vineet Pathak", initials: "VP", role: "PM", status: "pending" }],
      }],
    }));

    const signal = truth.signals.find((item) => item.kind === "decision-debt");
    expect(signal?.severity).toBe("high");
    expect(signal?.metric?.value).toBe("1");
  });

  it("raises readiness compression for urgent validation work", () => {
    const truth = calculateDeliveryTruth(input({
      currentDate: "2026-05-20",
      tasks: [{
        ...task,
        id: "t-validation",
        name: "Draft IQ protocol",
        workstream: "Validation",
        priority: "Critical",
        progress: 20,
        dueDate: "2026-06-01",
      }],
    }));

    const signal = truth.signals.find((item) => item.kind === "readiness-compression");
    expect(signal?.severity).toBe("medium");
    expect(signal?.sources[0].id).toBe("t-validation");
  });

  it("raises blocked work when high-priority tasks are blocked", () => {
    const truth = calculateDeliveryTruth(input({
      tasks: [{ ...task, priority: "High", status: "Blocked", progress: 0 }],
    }));

    const signal = truth.signals.find((item) => item.kind === "blocked-work");
    expect(signal?.severity).toBe("high");
    expect(signal?.metric?.value).toBe("1");
  });

  it("raises risk pressure for high-score open risks", () => {
    const truth = calculateDeliveryTruth(input({
      risks: [{ ...risk, status: "open", probability: 4, impact: 5, score: 20 }],
    }));

    const signal = truth.signals.find((item) => item.kind === "risk-pressure");
    expect(signal?.severity).toBe("high");
    expect(signal?.metric?.value).toBe("20");
  });

  it("combines multiple signals into lower confidence and decision options", () => {
    const truth = calculateDeliveryTruth(input({
      currentDate: "2026-05-20",
      milestones: [{ ...milestone, forecastDate: "2026-07-08" }],
      tasks: [{ ...task, priority: "High", status: "Blocked", progress: 0 }],
      documents: [{
        ...document,
        status: "in-review",
        dueDate: "2026-05-18",
        approvers: [{ person: "Vineet Pathak", initials: "VP", role: "PM", status: "pending" }],
      }],
      risks: [{ ...risk, status: "open", probability: 4, impact: 5, score: 20 }],
    }));

    expect(truth.confidenceScore).toBeLessThan(70);
    expect(truth.decisionOptions.map((option) => option.id)).toContain("delivery-tradeoff");
    expect(truth.decisionOptions.map((option) => option.id)).toContain("protect-readiness");
    expect(truth.decisionOptions.map((option) => option.id)).toContain("risk-escalation");
  });
});

// ── Phase-2: EVM-grounded mode (one financial truth) ────────────────────────

describe("calculateDeliveryTruth — EVM-grounded", () => {
  it("confidence IS the dashboard's EVM score, not the deduction tally", () => {
    const evm = snap({ cpi: 0.67, spit: 0.53, bac: 2_000_000, eac2: 2_990_000 });
    const truth = calculateDeliveryTruth(input({ evm }));

    expect(truth.evmGrounded).toBe(true);
    expect(truth.confidenceScore).toBe(evmConfidenceScore(evm));
  });

  it("legacy mode is unchanged when no snapshot is supplied", () => {
    const truth = calculateDeliveryTruth(input());
    expect(truth.evmGrounded).toBe(false);
    expect(truth.confidenceScore).toBe(100);
  });

  it("cost pressure fires on forecast overrun even when burn% looks calm", () => {
    // 39% burned (calm by the legacy heuristic) but CPI 0.67 forecasts +50%.
    const evm = snap({ cpi: 0.67, bac: 2_000_000, eac2: 2_990_000, ac: 780_000 });
    const truth = calculateDeliveryTruth(input({ evm }));
    const cost = truth.signals.find((s) => s.kind === "cost-pressure");

    expect(cost).toBeDefined();
    expect(cost?.severity).toBe("critical");          // 49% over budget
    expect(cost?.summary).toContain("$2.99M");
    expect(cost?.metric?.value).toBe("0.67");
  });

  it("cost pressure stays quiet for healthy front-loaded spend (the legacy false alarm)", () => {
    // 80% burned at 80% done with CPI 1 — legacy heuristic would alarm on
    // burn vs elapsed; EVM correctly sees a project finishing on budget.
    const evm = snap({ cpi: 1, eac2: 100_000, bac: 100_000, percentSpent: 0.8 });
    const truth = calculateDeliveryTruth(input({
      evm,
      costLines: [{ ...costLine, budgetK: 100, actualK: 80 }],
      currentDate: "2026-02-01",                       // only ~17% elapsed
    }));

    expect(truth.signals.find((s) => s.kind === "cost-pressure")).toBeUndefined();
  });

  it("flags pace divergence when work is slow but milestone forecasts still hold", () => {
    const evm = snap({ spit: 0.53 });
    const truth = calculateDeliveryTruth(input({ evm }));
    const pace = truth.signals.find((s) => s.id === "schedule-pace");

    expect(pace).toBeDefined();
    expect(pace?.severity).toBe("high");               // spit < 0.75
    expect(pace?.summary).toContain("53%");
    expect(pace?.summary.toLowerCase()).toContain("stale");
  });

  it("no pace signal when forecasts already admit the slip (no divergence)", () => {
    const lateMilestone = { ...milestone, forecastDate: "2026-07-15" };
    const evm = snap({ spit: 0.53 });
    const truth = calculateDeliveryTruth(input({ evm, milestones: [lateMilestone] }));

    expect(truth.signals.find((s) => s.id === "schedule-pace")).toBeUndefined();
    expect(truth.signals.find((s) => s.kind === "schedule-drift")).toBeDefined();
  });

  it("bands align with the dashboard verdict thresholds in EVM mode", () => {
    // score 100 → credible (≥80, the verdict's on-track line)
    expect(calculateDeliveryTruth(input({ evm: snap() })).confidenceBand).toBe("credible");
    // 0.4·0.70 + 0.4·0.70 + 0.2·1 = 0.76 → 76 → watch (60–79)
    expect(calculateDeliveryTruth(input({ evm: snap({ cpi: 0.7, spit: 0.7 }) })).confidenceBand).toBe("watch");
    // 0.4·0.50 + 0.4·0.40 + 0.2·0.5 = 0.46 → 46 → at-risk (35–59)
    expect(calculateDeliveryTruth(input({
      evm: snap({ cpi: 0.5, spit: 0.4, bac: 100_000, eac2: 150_000 }),
    })).confidenceBand).toBe("at-risk");
  });
});
