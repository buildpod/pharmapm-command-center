import { describe, expect, it } from "vitest";
import {
  charters,
  costLines,
  documents,
  milestones,
  projects,
  risks,
  tasks,
  teamMembers,
} from "../mockData";
import { buildCustomProjectTemplate, instantiateCustomProjectTemplate } from "./custom-project-templates";

describe("custom project templates", () => {
  it("captures a reusable operating model from an existing project", () => {
    const sourceProject = projects[0];
    const template = buildCustomProjectTemplate({
      project: sourceProject,
      templateName: "Veeva RIM release model",
      description: "Reusable release setup",
      milestones,
      tasks,
      documents,
      risks,
      costLines,
      teamMembers,
      charter: charters.find((charter) => charter.projectId === sourceProject.id),
    });

    expect(template.sourceProjectId).toBe(sourceProject.id);
    expect(template.coverage.tasks).toBe(tasks.filter((task) => task.projectId === sourceProject.id).length);
    expect(template.coverage.milestones).toBe(milestones.filter((milestone) => milestone.projectId === sourceProject.id).length);
    expect(template.coverage.workstreams).toContain("Configuration");
    expect(template.model.charter?.projectId).toBe(sourceProject.id);
  });

  it("instantiates a saved template as a fresh release with shifted dates and reset progress", () => {
    const sourceProject = projects[0];
    const template = buildCustomProjectTemplate({
      project: sourceProject,
      templateName: "Veeva RIM release model",
      milestones,
      tasks,
      documents,
      risks,
      costLines,
      teamMembers,
      charter: charters.find((charter) => charter.projectId === sourceProject.id),
    });

    const model = instantiateCustomProjectTemplate({
      template,
      projectId: "proj-release-2",
      projectName: "Veeva RIM Operational Release 2",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-07-06",
      goLiveDate: "2026-12-18",
      methodology: "GAMP 5 / CSV",
    });

    expect(model.tasks).toHaveLength(template.coverage.tasks);
    expect(model.tasks.every((task) => task.projectId === "proj-release-2")).toBe(true);
    expect(model.tasks.every((task) => task.status === "Not Started" && task.progress === 0)).toBe(true);
    expect(model.documents.every((document) => document.status === "draft" && document.version === "0.1")).toBe(true);
    expect(model.risks.every((risk) => risk.status === "open")).toBe(true);
    expect(model.costLines.every((line) => line.actualK === 0)).toBe(true);
    expect(model.milestones[0].plannedDate).toBe("2026-07-12");
    expect(model.tasks.some((task) => task.dependsOn?.some((id) => id.startsWith("proj-release-2-task-")))).toBe(true);
  });
});
