import { describe, expect, it } from "vitest";
import { buildTemplateOperatingModel, PROJECT_TEMPLATES } from "./project-templates";
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

  it("builds a CSV validation playbook with GAMP 5 and CSA-specific work", () => {
    const model = buildTemplateOperatingModel({
      templateId: "csv-validation",
      projectId: "proj-test-csv",
      projectName: "GxP System Validation Project",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2026-11-30",
      methodology: "GAMP 5 / CSA",
    });

    expect(model.template.tier).toBe("playbook");
    expect(model.milestones).toHaveLength(11);
    expect(model.tasks).toHaveLength(26);
    expect(model.documents).toHaveLength(11);
    expect(model.risks).toHaveLength(5);
    expect(model.teamMembers).toHaveLength(6);
    expect(model.costLines).toHaveLength(4);
    expect(model.teamMembers.map((member) => member.role)).toEqual([
      "Validation Lead",
      "QA Approver",
      "System Owner",
      "Process Owner",
      "Supplier Contact",
      "IT Architecture Lead",
    ]);
    expect(model.documents.some((document) => document.abbreviation === "RTM")).toBe(true);
    expect(model.documents.some((document) => document.abbreviation === "VSR")).toBe(true);
    expect(model.documents.some((document) => document.abbreviation === "VP")).toBe(true);
    expect(model.documents.some((document) => document.abbreviation === "URS")).toBe(true);
    expect(model.tasks.some((task) => /unscripted.*exploratory/i.test(task.name))).toBe(true);
    expect(model.tasks.some((task) => task.name.includes("ALCOA+"))).toBe(true);
    expect(model.risks.some((risk) => risk.title.includes("Supplier documentation"))).toBe(true);
    expect(model.risks.some((risk) => risk.mitigation.includes("residual-risk acceptance"))).toBe(true);
    expect(model.operatingNotes.some((note) => note.includes("GAMP 5 ed.2") && note.includes("FDA CSA"))).toBe(true);
  });

  it("keeps CSV validation milestones and tasks inside their approval gates", () => {
    const model = buildTemplateOperatingModel({
      templateId: "csv-validation",
      projectId: "proj-test-csv-dates",
      projectName: "GxP System Validation Project",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2026-11-30",
      methodology: "GAMP 5 / CSA",
    });
    const milestoneDateById = new Map(model.milestones.map((milestone) => [milestone.id, milestone.plannedDate]));
    const terminalRelease = model.milestones[model.milestones.length - 1];

    expect(model.milestones.every((milestone) => milestone.plannedDate <= "2026-11-30")).toBe(true);
    expect(terminalRelease.name).toContain("release decision");
    expect(terminalRelease.locked).toBe(true);
    expect(model.tasks.every((task) => {
      const linkedDate = task.milestoneId ? milestoneDateById.get(task.milestoneId) : undefined;
      return !linkedDate || task.dueDate <= linkedDate;
    })).toBe(true);
  });

  it("pressure-tests CSV validation task dependencies with the generated plan", () => {
    const model = buildTemplateOperatingModel({
      templateId: "csv-validation",
      projectId: "proj-test-csv-cascade",
      projectName: "GxP System Validation Project",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2026-11-30",
      methodology: "GAMP 5 / CSA",
    });
    const result = previewTaskCascade(model.tasks, {
      id: "proj-test-csv-cascade-t15",
      newDueDate: "2026-09-30",
    });
    const pushedById = Object.fromEntries(result.affected.map((row) => [row.id, row.newDue]));

    expect(result.error).toBeNull();
    expect(pushedById["proj-test-csv-cascade-t17"]).toBe("2026-10-01");
    expect(pushedById["proj-test-csv-cascade-t19"]).toBe("2026-10-02");
    expect(pushedById["proj-test-csv-cascade-t20"]).toBe("2026-10-05");
    expect(result.affected.length).toBeGreaterThanOrEqual(3);
  });

  // ── CX-4 honesty gate ──────────────────────────────────────────────────

  it("every template declares its tier; only bespoke builds are playbooks", () => {
    expect(PROJECT_TEMPLATES.every((t) => t.tier === "playbook" || t.tier === "starter")).toBe(true);
    const playbooks = PROJECT_TEMPLATES.filter((t) => t.tier === "playbook").map((t) => t.id).sort();
    expect(playbooks).toEqual(["csv-validation", "sap-s4hana", "veeva-rim"]);
    expect(PROJECT_TEMPLATES.filter((t) => t.tier === "starter")).toHaveLength(10);
  });

  it("starter scaffolds never fake domain specificity", () => {
    const model = buildTemplateOperatingModel({
      templateId: "lims-qc-lab",
      projectId: "proj-test-lims",
      projectName: "LIMS QC Rollout",
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2026-12-15",
      methodology: "GAMP 5",
    });

    // The old placeholder pattern must be gone…
    expect(model.tasks.some((task) => task.name.includes("complete setup activity"))).toBe(false);
    // …replaced by honest scaffold naming the user is told to rename.
    expect(model.tasks.every((task) => task.name.includes("(rename me)"))).toBe(true);
    expect(model.documents.every((doc) => doc.name.includes("(rename me)"))).toBe(true);
    // Risk mitigations vary by stage instead of one repeated string.
    expect(new Set(model.risks.map((risk) => risk.mitigation)).size).toBeGreaterThan(1);
  });

  it.each([
    ["csv-validation", "proj-test-csv-honest", "GxP System Validation Project", "GAMP 5 / CSA"],
    ["sap-s4hana", "proj-test-sap-honest", "SAP S/4HANA", "SAP Activate"],
    ["veeva-rim", "proj-test-veeva-honest", "Veeva RIM", "GAMP 5 / CSV"],
  ] as const)("playbook output contains no scaffold markers for %s", (templateId, projectId, projectName, methodology) => {
    const model = buildTemplateOperatingModel({
      templateId,
      projectId,
      projectName,
      client: "AivelloStudio Demo Corp",
      startDate: "2026-06-01",
      goLiveDate: "2026-11-30",
      methodology,
    });
    const everything = [
      ...model.tasks.map((t) => t.name),
      ...model.documents.map((d) => d.name),
      ...model.risks.map((r) => r.title),
      ...model.operatingNotes,
    ].map((text) => text.toLowerCase());
    expect(everything.some((name) => name.includes("rename me") || name.includes("scaffold"))).toBe(false);
  });
});
