import { describe, expect, it } from "vitest";
import {
  buildImportPreview,
  parseDelimitedTable,
  previewOwnersToTeamMembers,
  previewTasksToTasks,
  recordsFromMatrix,
} from "./project-import";

describe("project import parser", () => {
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
