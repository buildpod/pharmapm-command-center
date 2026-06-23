import { describe, expect, it } from "vitest";
import {
  buildSteerCoReportData,
  buildWeeklyReportData,
  type ReportDataInput,
} from "./report-data";
import type {
  CostLine,
  DecisionRecord,
  Document,
  Issue,
  Milestone,
  Project,
  Risk,
  Task,
} from "@/lib/mockData";
import type { ProjectEvm } from "@/lib/domain/evm-project";

const activeProject: Project = {
  id: "proj-active",
  code: "ADC-ACT-2026",
  name: "Regulated Data Migration Project",
  client: "AivelloStudio Demo Corp",
  phase: "Phase 0 - Discovery",
  startDate: "2026-06-01",
  goLiveDate: "2026-09-30",
  methodology: "GAMP 5 / CSV",
};

const otherProject: Project = {
  id: "proj-other",
  code: "ADC-OTHER-2026",
  name: "Veeva RIM Implementation",
  client: "AivelloStudio Demo Corp",
  phase: "Phase 1 - Mobilise",
  startDate: "2026-01-01",
  goLiveDate: "2026-12-31",
  methodology: "GAMP 5 / CSV",
};

function milestone(id: string, projectId = activeProject.id): Milestone {
  return {
    id,
    projectId,
    name: projectId === activeProject.id ? "Mapping baseline approved" : "Wrong project milestone",
    phase: "Migration",
    plannedDate: "2026-06-20",
    forecastDate: "2026-06-25",
    status: "pending",
    locked: false,
    owner: "DM",
    duration: 5,
    lag: 0,
  };
}

function task(id: string, projectId = activeProject.id): Task {
  return {
    id,
    projectId,
    name: projectId === activeProject.id ? "Build reconciliation counts" : "Wrong project task",
    workstream: "Data Migration",
    priority: "High",
    status: "In Progress",
    progress: 50,
    milestoneId: `${projectId}-m1`,
    owner: "DM",
    dueDate: "2026-06-18",
  };
}

function risk(id: string, projectId = activeProject.id): Risk {
  return {
    id,
    projectId,
    title: projectId === activeProject.id ? "Mapping gaps found in dry-run" : "Wrong project risk",
    category: "Mapping",
    probability: 4,
    impact: 4,
    score: 16,
    status: "open",
    owner: "QA",
    mitigation: "Track unmapped fields and require owner signoff before dry-run 2.",
  };
}

function documentWithStatus(status: "pending" | "approved", projectId = activeProject.id): Document {
  return {
    id: `${projectId}-doc`,
    projectId,
    name: projectId === activeProject.id ? "Migration Verification Protocol" : "Wrong project document",
    abbreviation: "MVP",
    type: "Validation",
    phase: "Validation",
    version: "1.0",
    status: "in-review",
    dueDate: "2026-06-22",
    owner: "QA",
    reviewers: [
      { person: "Quality Lead", initials: "QA", role: "Reviewer", status },
    ],
    approvers: [
      { person: "System Owner", initials: "SO", role: "Approver", status: "pending" },
    ],
  };
}

function costLine(projectId = activeProject.id): CostLine {
  return {
    id: `${projectId}-cost`,
    projectId,
    category: "Migration vendor",
    description: "Dry-run migration support",
    budgetK: 500,
    actualK: 125,
    contractType: "Fixed",
    owner: "DM",
  };
}

function decisionRecord(projectId = activeProject.id): DecisionRecord {
  return {
    id: `${projectId}-decision`,
    projectId,
    title: projectId === activeProject.id ? "Approve production load window" : "Wrong project decision",
    context: "The production migration window needs leadership approval.",
    decidedDate: "2026-06-10",
    decidedBy: "Sponsor",
    alternatives: ["Friday night", "Saturday morning"],
    chosenOption: "Saturday morning",
    rationale: "Lowest operational disruption.",
    status: "Pending",
  };
}

function issue(projectId = activeProject.id): Issue {
  return {
    id: `${projectId}-issue`,
    projectId,
    title: "Dry-run defect triage backlog",
    description: "Dry-run defects need triage before reconciliation sign-off.",
    raisedDate: "2026-06-08",
    severity: "High",
    status: "Open",
    owner: "DM",
  };
}

function readyEvm(): ReportDataInput["evm"] {
  return {
    coverage: { ready: true, missing: [] },
    statusDate: "2026-06-12",
    evm: {
      snapshot: {
        bac: 500_000,
        ac: 125_000,
      },
    } as unknown as ProjectEvm,
  };
}

function input(overrides: Partial<ReportDataInput> = {}): ReportDataInput {
  return {
    project: activeProject,
    milestones: [milestone(`${activeProject.id}-m1`), milestone(`${otherProject.id}-m1`, otherProject.id)],
    tasks: [task(`${activeProject.id}-t1`), task(`${otherProject.id}-t1`, otherProject.id)],
    risks: [risk(`${activeProject.id}-r1`), risk(`${otherProject.id}-r1`, otherProject.id)],
    documents: [documentWithStatus("pending"), documentWithStatus("pending", otherProject.id)],
    costLines: [costLine(), costLine(otherProject.id)],
    decisionRecords: [decisionRecord(), decisionRecord(otherProject.id)],
    issues: [issue(), issue(otherProject.id)],
    evm: readyEvm(),
    ...overrides,
  };
}

describe("report data builders", () => {
  it("scopes weekly report metrics and evidence to the active project", () => {
    const report = buildWeeklyReportData(input());

    expect(report.project.name).toBe("Regulated Data Migration Project");
    expect(report.openRisks).toHaveLength(1);
    expect(report.openRisks[0].title).toBe("Mapping gaps found in dry-run");
    expect(report.tasksInFlight).toHaveLength(1);
    expect(report.tasksInFlight[0].name).toBe("Build reconciliation counts");
    expect(report.evidenceRows.map((row) => row.source).join(" ")).not.toContain("Wrong project");
  });

  it("moves the pending decision count when one reviewer is approved", () => {
    const before = buildWeeklyReportData(input({
      documents: [documentWithStatus("pending")],
    }));
    const after = buildWeeklyReportData(input({
      documents: [documentWithStatus("approved")],
    }));

    expect(before.pendingDecisions).toHaveLength(2);
    expect(after.pendingDecisions).toHaveLength(1);
  });

  it("shows an EVM pending state when cost evidence is missing", () => {
    const report = buildWeeklyReportData(input({
      costLines: [],
      evm: {
        coverage: { ready: false, missing: ["budget lines"] },
        statusDate: "2026-06-12",
        evm: null,
      },
    }));

    expect(report.budget.ready).toBe(false);
    expect(report.budget.label).toBe("Budget confidence pending");
    expect(report.budget.detail).toContain("budget lines");
  });

  it("captures accepted decisions/slips this period from the audit log (O9.2)", () => {
    const report = buildWeeklyReportData(input({
      auditLog: [
        { id: "a1", type: "update", entityKind: "milestone", entityId: "m1", source: "user-edit", projectId: activeProject.id, timestamp: "2026-06-11T09:00:00.000Z", note: "Accepted slip: go-live moves 12 days" },
        { id: "a2", type: "cascade-apply", entityKind: "milestone", entityId: "m2", source: "cascade", projectId: activeProject.id, timestamp: "2026-06-10T09:00:00.000Z" },
        { id: "a3", type: "update", entityKind: "task", entityId: "t1", source: "user-edit", projectId: activeProject.id, timestamp: "2026-06-09T09:00:00.000Z", note: "Renamed task" },
        { id: "a4", type: "update", entityKind: "milestone", entityId: "m3", source: "user-edit", projectId: otherProject.id, timestamp: "2026-06-11T09:00:00.000Z", note: "Accepted slip on wrong project" },
      ],
    }));

    expect(report.acceptedChanges).toHaveLength(2);
    expect(report.acceptedChanges[0].summary).toContain("Accepted slip: go-live moves 12 days");
    expect(report.acceptedChanges.map((c) => c.summary).join(" ")).not.toContain("wrong project");
    expect(report.acceptedChanges.map((c) => c.summary).join(" ")).not.toContain("Renamed task");
  });

  it("surfaces the integrity caveat when reported progress may be overstated (O9.3)", () => {
    const clean = buildWeeklyReportData(input());
    expect(clean.integrityCaveat).toBeNull();

    const overstated = buildWeeklyReportData(input({
      evm: {
        coverage: { ready: true, missing: [] },
        statusDate: "2026-06-12",
        evm: {
          snapshot: { bac: 500_000, ac: 125_000, percentComplete: 0.9, percentSpent: 0.05, cpi: 2.4 },
        } as unknown as ProjectEvm,
      },
    }));
    expect(overstated.integrityCaveat).not.toBeNull();
    expect(typeof overstated.integrityCaveat).toBe("string");
  });

  it("surfaces pending SteerCo decision records with focus links", () => {
    const report = buildSteerCoReportData(input());

    expect(report.steerCoDecisions.some((decision) => decision.title === "Approve production load window")).toBe(true);
    expect(report.steerCoDecisions.find((decision) => decision.title === "Approve production load window")?.route)
      .toBe("/pharmapm-command-center/v2/decisions/?focus=proj-active-decision");
    expect(report.steerCoDecisions.map((decision) => decision.title).join(" ")).not.toContain("Wrong project");
  });
});
