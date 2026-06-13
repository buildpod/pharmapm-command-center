import { describe, expect, it } from "vitest";
import type { Charter, CostLine, DecisionRecord, Document, Milestone, Project, Risk, Task } from "../mockData";
import { buildProjectReadiness, buildSmartNudges } from "./guided-work";

const project: Project = {
  id: "proj-guidance",
  code: "GUIDE-2026",
  name: "Guided Implementation",
  client: "AivelloStudio Demo Corp",
  phase: "Phase 1",
  startDate: "2026-01-01",
  goLiveDate: "2026-09-30",
  methodology: "GAMP 5 / CSV",
};

const charter: Charter = {
  id: "charter-guidance",
  projectId: project.id,
  purpose: "Implement a regulated system with evidence behind the project story.",
  objectives: ["Approve the regulated operating model"],
  inScope: ["Configuration"],
  outOfScope: [],
  successCriteria: ["Go-live decision approved"],
  assumptions: [],
  constraints: [],
  sponsor: "Sponsor",
  projectManager: "PM",
  budgetSummary: "$1.0M",
  status: "draft",
  lastUpdated: "2026-01-02",
};

const milestones: Milestone[] = [
  { id: "m1", name: "Plan approved", phase: "Planning", plannedDate: "2026-02-01", forecastDate: "2026-02-01", status: "complete", locked: true, owner: "PM", duration: 5, projectId: project.id },
  { id: "m2", name: "Build complete", phase: "Config", plannedDate: "2026-05-01", forecastDate: "2026-05-01", status: "pending", locked: false, owner: "IT", predecessor: "m1", duration: 20, projectId: project.id },
  { id: "m3", name: "Release decision", phase: "Go-Live", plannedDate: "2026-09-30", forecastDate: "2026-09-30", status: "pending", locked: true, owner: "QA", predecessor: "m2", duration: 1, projectId: project.id },
];

const tasks: Task[] = [
  { id: "t1", name: "Confirm plan", workstream: "PMO", priority: "High", status: "Complete", progress: 100, owner: "PM", dueDate: "2026-02-01", milestoneId: "m1", projectId: project.id },
  { id: "t2", name: "Configure workflow", workstream: "Config", priority: "Medium", status: "In Progress", progress: 50, owner: "IT", dueDate: "2026-04-15", milestoneId: "m2", dependsOn: ["t1"], projectId: project.id },
];

const risks: Risk[] = [
  { id: "r1", title: "Validation resources unavailable", category: "Resource", probability: 3, impact: 4, score: 12, status: "open", owner: "QA", mitigation: "Reserve validation calendar before OQ.", projectId: project.id },
];

const documents: Document[] = [
  {
    id: "doc1",
    name: "Validation Plan",
    abbreviation: "VP",
    type: "Validation",
    phase: "Planning",
    version: "1.0",
    status: "approved",
    dueDate: "2026-02-01",
    owner: "QA",
    reviewers: [{ person: "Reviewer", initials: "RV", role: "Reviewer", status: "approved" }],
    approvers: [{ person: "Approver", initials: "AP", role: "Approver", status: "approved" }],
    projectId: project.id,
  },
];

const costLines: CostLine[] = [
  { id: "c1", category: "Validation services", description: "External validation support", budgetK: 400, actualK: 120, contractType: "T&M", owner: "QA", projectId: project.id },
];

const pendingDecision: DecisionRecord = {
  id: "decision-1",
  title: "Approve cutover window",
  context: "Leadership must confirm the downtime window.",
  decidedDate: "2026-08-01",
  decidedBy: "Sponsor",
  alternatives: ["Friday", "Saturday"],
  chosenOption: "Saturday",
  rationale: "Lower user impact.",
  status: "Pending",
  projectId: project.id,
};

function input(overrides: Partial<Parameters<typeof buildProjectReadiness>[0]> = {}) {
  return {
    project,
    charters: [charter],
    milestones,
    tasks,
    risks,
    documents,
    costLines,
    issues: [],
    decisionRecords: [],
    ...overrides,
  };
}

describe("guided work builders", () => {
  it("marks the setup checklist complete when required live records exist", () => {
    const items = buildProjectReadiness(input());
    expect(items.map((item) => [item.id, item.status])).toEqual([
      ["charter", "done"],
      ["milestones", "done"],
      ["tasks", "done"],
      ["risks", "done"],
      ["budget", "done"],
      ["documents", "done"],
      ["report", "done"],
    ]);
  });

  it("shows a budget nudge only when the active project has no cost lines", () => {
    const nudges = buildSmartNudges(input({ costLines: [] }), "pm");
    expect(nudges.map((nudge) => nudge.id)).toContain("budget-missing");
    expect(nudges.find((nudge) => nudge.id === "budget-missing")?.href).toBe("/costs");
    expect(buildSmartNudges(input(), "pm").map((nudge) => nudge.id)).not.toContain("budget-missing");
  });

  it("links unassigned or unlinked records directly with focus parameters", () => {
    const unownedMilestones = [{ ...milestones[0], owner: "" }, ...milestones.slice(1)];
    const unlinkedTasks = [{ ...tasks[0], milestoneId: undefined }, tasks[1]];
    const nudges = buildSmartNudges(input({ milestones: unownedMilestones, tasks: unlinkedTasks }), "pm");
    expect(nudges.find((nudge) => nudge.id === "milestone-owner")?.href).toBe("/milestones?focus=m1");
    expect(nudges.find((nudge) => nudge.id === "task-milestone")?.href).toBe("/tasks?focus=t1");
  });

  it("removes approval-debt guidance when document decisions are approved", () => {
    const pendingDoc: Document = {
      ...documents[0],
      status: "in-review",
      approvers: [{ person: "Approver", initials: "AP", role: "Approver", status: "pending" }],
    };
    expect(buildSmartNudges(input({ documents: [pendingDoc] }), "qa").map((nudge) => nudge.id)).toContain("document-approvals");
    expect(buildSmartNudges(input({ documents }), "qa").map((nudge) => nudge.id)).not.toContain("document-approvals");
  });

  it("frames nudges by role without changing the underlying project data", () => {
    const sponsorNudges = buildSmartNudges(input({ decisionRecords: [pendingDecision] }), "sponsor");
    const qaNudges = buildSmartNudges(input({ documents: [{ ...documents[0], status: "in-review" }] }), "qa");
    expect(sponsorNudges.map((nudge) => nudge.id)).toContain("sponsor-decision");
    expect(qaNudges.map((nudge) => nudge.id)).toContain("qa-evidence");
  });
});
