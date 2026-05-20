import { describe, expect, it } from "vitest";
import { buildTemplateOperatingModel } from "./project-templates";

describe("project templates", () => {
  it("builds a Veeva RIM operating model, not just tasks", () => {
    const model = buildTemplateOperatingModel({
      templateId: "veeva-rim",
      projectId: "proj-test-veeva",
      projectName: "Veeva RIM Global Implementation",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2026-09-30",
      methodology: "GAMP 5 / CSV",
    });

    expect(model.milestones).toHaveLength(13);
    expect(model.tasks).toHaveLength(31);
    expect(model.documents).toHaveLength(12);
    expect(model.risks).toHaveLength(7);
    expect(model.teamMembers).toHaveLength(15);
    expect(model.costLines).toHaveLength(6);
    expect(model.charter.projectId).toBe("proj-test-veeva");
    expect(model.tasks.some((task) => task.workstream === "Vault Connections")).toBe(true);
    expect(model.tasks.some((task) => task.workstream === "Data Migration")).toBe(true);
    expect(model.documents.some((document) => document.abbreviation === "VSR")).toBe(true);
  });

  it("does not create milestones after go-live or tasks after their linked milestone", () => {
    const model = buildTemplateOperatingModel({
      templateId: "veeva-rim",
      projectId: "proj-test-veeva-tight",
      projectName: "Veeva RIM Tight Timeline",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2026-09-30",
      methodology: "GAMP 5 / CSV",
    });
    const milestoneDateById = new Map(model.milestones.map((milestone) => [milestone.id, milestone.plannedDate]));

    expect(model.milestones.every((milestone) => milestone.plannedDate <= "2026-09-30")).toBe(true);
    expect(model.tasks.every((task) => {
      const linkedDate = task.milestoneId ? milestoneDateById.get(task.milestoneId) : undefined;
      return !linkedDate || task.dueDate <= linkedDate;
    })).toBe(true);
  });
});
