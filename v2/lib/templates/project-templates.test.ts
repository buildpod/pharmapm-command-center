import { describe, expect, it } from "vitest";
import { buildTemplateOperatingModel } from "./project-templates";
import { previewTaskCascade } from "../domain/scheduling";

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

  it("builds an SAP Activate operating model with SAP-specific delivery work", () => {
    const model = buildTemplateOperatingModel({
      templateId: "sap-s4hana",
      projectId: "proj-test-sap",
      projectName: "SAP S/4HANA Global Implementation",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2027-01-30",
      methodology: "SAP Activate",
    });

    expect(model.milestones).toHaveLength(12);
    expect(model.tasks).toHaveLength(30);
    expect(model.documents).toHaveLength(12);
    expect(model.risks).toHaveLength(8);
    expect(model.teamMembers).toHaveLength(15);
    expect(model.costLines).toHaveLength(7);
    expect(model.tasks.some((task) => task.name.includes("fit-to-standard"))).toBe(true);
    expect(model.tasks.some((task) => task.workstream === "Security & Controls")).toBe(true);
    expect(model.tasks.some((task) => task.workstream === "Cutover")).toBe(true);
    expect(model.documents.some((document) => document.abbreviation === "FTS")).toBe(true);
    expect(model.documents.some((document) => document.abbreviation === "CUT")).toBe(true);
    expect(model.risks.some((risk) => risk.title.includes("Master data quality"))).toBe(true);
    expect(model.operatingNotes.some((note) => note.includes("fit-gap backlog"))).toBe(true);
  });

  it("pressure-tests SAP task dependencies with a real generated implementation plan", () => {
    const model = buildTemplateOperatingModel({
      templateId: "sap-s4hana",
      projectId: "proj-test-sap-cascade",
      projectName: "SAP S/4HANA Global Implementation",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2027-01-30",
      methodology: "SAP Activate",
    });
    const result = previewTaskCascade(model.tasks, {
      id: "proj-test-sap-cascade-t4",
      newDueDate: "2026-07-10",
    });
    const pushedById = Object.fromEntries(result.affected.map((row) => [row.id, row.newDue]));

    expect(result.error).toBeNull();
    expect(pushedById["proj-test-sap-cascade-t5"]).toBe("2026-07-13");
    expect(pushedById["proj-test-sap-cascade-t6"]).toBe("2026-07-13");
    expect(pushedById["proj-test-sap-cascade-t7"]).toBe("2026-07-13");
    expect(pushedById["proj-test-sap-cascade-t8"]).toBe("2026-07-13");
  });
});
