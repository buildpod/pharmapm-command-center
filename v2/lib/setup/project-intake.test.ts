import { describe, expect, it } from "vitest";
import {
  controlOptionsForIndustry,
  evaluateSetupFeasibility,
  intakeFromTemplate,
  type SetupIntake,
} from "./project-intake";

describe("project setup intake", () => {
  it("rejects a two-day SAP implementation as not credible", () => {
    const intake: SetupIntake = {
      industry: "manufacturing",
      projectType: "implementation",
      systemFamily: "sap",
      controlModel: "internal-controls",
      region: "europe",
      scopeElements: ["migration", "integrations", "uat", "training", "cutover"],
      ownershipModel: "human-led",
      reportingModels: ["workstream", "steerco"],
      timelineCriticality: "fixed",
      deliveryMethod: "sap-activate",
    };

    const result = evaluateSetupFeasibility(intake, "2026-06-01", "2026-06-03");

    expect(result.status).toBe("impossible");
    expect(result.suggestions.join(" ")).toContain("assessment");
  });

  it("keeps a short workshop credible when the project type matches the timeline", () => {
    const intake: SetupIntake = {
      industry: "generic-it",
      projectType: "workshop",
      systemFamily: "generic",
      controlModel: "non-regulated",
      region: "country-rollout",
      scopeElements: [],
      ownershipModel: "human-led",
      reportingModels: ["pm-only"],
      timelineCriticality: "flexible",
      deliveryMethod: "hybrid",
    };

    const result = evaluateSetupFeasibility(intake, "2026-06-01", "2026-06-03");

    expect(result.status).toBe("credible");
  });

  it("flags the Veeva RIM template timeline as compressed rather than pretending it is green", () => {
    const result = evaluateSetupFeasibility(intakeFromTemplate("veeva-rim"), "2026-06-01", "2026-09-30");

    expect(result.status).toBe("compressed");
    expect(result.boardWarning).toContain("Leadership");
  });

  it("keeps finance controls away from life-sciences-only defaults", () => {
    const controls = controlOptionsForIndustry("finance").map((option) => option.id);

    expect(controls).toEqual(["sox", "internal-controls", "non-regulated"]);
  });
});
