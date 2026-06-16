import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildImportPreview,
  parseDelimitedTable,
  previewOwnersToTeamMembers,
  previewTasksToTasks,
  previewToMilestones,
  recordsFromMatrix,
} from "./project-import";

describe("project import parser", () => {
  it("keeps bundled Microsoft Project sample importable", () => {
    const sample = readFileSync(new URL("../../public/samples/microsoft-project-export-sample.csv", import.meta.url), "utf8");
    const preview = buildImportPreview(parseDelimitedTable(sample));

    expect(preview.sourceKind).toBe("microsoft-project");
    expect(preview.stats.importedTasks).toBe(4);
    expect(preview.stats.unresolvedDependencies).toBe(0);
  });

  it("keeps bundled Microsoft Planner sample importable", () => {
    const sample = readFileSync(new URL("../../public/samples/microsoft-planner-export-sample.csv", import.meta.url), "utf8");
    const preview = buildImportPreview(parseDelimitedTable(sample));

    expect(preview.sourceKind).toBe("microsoft-planner");
    expect(preview.stats.importedTasks).toBe(3);
    expect(preview.owners.map((owner) => owner.initials)).toContain("PS");
  });

  it("explains unsupported spreadsheet layouts instead of importing garbage", () => {
    const sample = readFileSync(new URL("../../public/samples/unsupported-random-excel-layout.csv", import.meta.url), "utf8");
    const preview = buildImportPreview(parseDelimitedTable(sample));

    expect(preview.stats.importedTasks).toBe(0);
    expect(preview.warnings.join(" ")).toContain("No recognizable task table");
  });

  it("maps Microsoft Planner CSV exports into guided preview tasks", () => {
    const records = parseDelimitedTable(`Task ID,Task title,Bucket Name,Status,Start Date,Due Date,Assignments,Priority
1,Confirm validation scope,Validation,In progress,2026-06-01,2026-06-10,Priya Sharma,Important
2,Run dry migration,Data Migration,Not started,2026-06-11,2026-06-20,Migration Agent,Medium`);

    const preview = buildImportPreview(records);

    expect(preview.sourceKind).toBe("microsoft-planner");
    expect(preview.stats.importedTasks).toBe(2);
    expect(preview.workstreams).toEqual(["Validation", "Data Migration"]);
    expect(preview.tasks[0]).toMatchObject({
      name: "Confirm validation scope",
      ownerInitials: "PS",
      priority: "High",
      status: "In Progress",
      dueDate: "2026-06-10",
    });
  });

  it("detects Microsoft Project header rows below summary metadata", () => {
    const records = recordsFromMatrix([
      ["Project name", "Veeva RIM"],
      ["Project manager", "Vineet Pathak"],
      [],
      ["ID", "Task Name", "Start", "Finish", "% Complete", "Resource Names", "Predecessors"],
      [1, "Kickoff", "2026-06-01", "2026-06-01", "100%", "Vineet Pathak", ""],
      [2, "Design approval", "2026-06-02", "2026-06-08", "25%", "QA Agent", "1"],
    ]);

    const preview = buildImportPreview(records);

    expect(preview.sourceKind).toBe("microsoft-project");
    expect(preview.stats.importedTasks).toBe(2);
    expect(preview.stats.linkedDependencies).toBe(1);
    expect(preview.tasks[1].dependsOn).toEqual(["import-task-1"]);
  });

  it("converts preview output into app tasks and team members", () => {
    const records = parseDelimitedTable(`ID,Task Name,Finish,Resource Names,Predecessors
1,Kickoff,2026-06-01,Vineet Pathak,
2,Configuration,2026-06-08,Config Agent,1`);
    const preview = buildImportPreview(records);
    const tasks = previewTasksToTasks("proj-imported", preview);
    const team = previewOwnersToTeamMembers("proj-imported", preview);

    expect(tasks).toHaveLength(2);
    expect(tasks[1].dependsOn).toEqual(["proj-imported-task-1"]);
    expect(team.map((member) => member.initials)).toEqual(["VP", "CA"]);
    expect(team[1].role).toBe("Agent Workstream");
  });
});

describe("milestone extraction (import fidelity)", () => {
  it("pulls milestone rows out as a gate spine, not tasks", () => {
    const records = parseDelimitedTable(
`Task ID,Task Name,Milestone,Duration,Finish,Status,Predecessors,Resource Names
1,Build config,No,10 days,2026-03-01,In Progress,,KM
2,Config Complete,Yes,0,2026-03-05,Not Started,1,KM
3,UAT Sign-off,Yes,0 days,2026-05-01,Not Started,2,QA`);
    const preview = buildImportPreview(records);
    expect(preview.stats.importedTasks).toBe(1);
    expect(preview.stats.importedMilestones).toBe(2);
    expect(preview.milestones.map((m) => m.name)).toEqual(["Config Complete", "UAT Sign-off"]);
  });

  it("detects milestones by zero duration when there is no flag", () => {
    const records = parseDelimitedTable(
`Task Name,Duration,Finish,Status,Predecessors
Design,15 days,2026-02-01,Complete,
Design Approved,0 days,2026-02-03,Complete,1`);
    const preview = buildImportPreview(records);
    expect(preview.stats.importedMilestones).toBe(1);
    expect(preview.milestones[0].name).toBe("Design Approved");
    expect(preview.milestones[0].status).toBe("complete");
  });

  it("chains milestone → milestone predecessors and emits engine-ready ids", () => {
    const records = parseDelimitedTable(
`Task ID,Task Name,Milestone,Finish,Predecessors,Resource Names
10,Gate A,Yes,2026-03-05,,KM
20,Gate B,Yes,2026-05-01,10,QA`);
    const milestones = previewToMilestones("proj-x", buildImportPreview(records));
    expect(milestones.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(milestones[1].predecessor).toBe("m1"); // Gate B → Gate A, by source key
    expect(milestones[0].owner).toBe("KM");
    expect(milestones[0].locked).toBe(false);
  });
});
