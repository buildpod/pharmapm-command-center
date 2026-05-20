import { describe, expect, it } from "vitest";
import { calculateDeliveryTruth, type DeliveryTruthInput } from "./delivery-truth";
import type { CostLine, Document, Milestone, Project, Risk, Task } from "@/lib/mockData";

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
