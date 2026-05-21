import { describe, expect, it } from "vitest";
import { costLines, documents, milestones, projects, risks, tasks } from "../mockData";
import { buildSteerCoBrief } from "./steerco-brief";

describe("steerco brief", () => {
  it("summarizes the project promise and required leadership decisions", () => {
    const brief = buildSteerCoBrief({
      project: projects[0],
      milestones,
      tasks,
      risks,
      documents,
      costLines,
      currentDate: "2026-05-19",
    });

    expect(brief.promiseAnswer).toContain("leadership action");
    expect(brief.decisions.map((decision) => decision.title)).toContain("Choose the delivery tradeoff");
    expect(brief.actions.length).toBeGreaterThan(2);
  });

  it("surfaces blocked work, high risks, and pending document decisions", () => {
    const brief = buildSteerCoBrief({
      project: projects[0],
      milestones,
      tasks,
      risks,
      documents,
      costLines,
      currentDate: "2026-05-19",
    });

    expect(brief.blockedTaskCount).toBe(1);
    expect(brief.highRiskCount).toBe(1);
    expect(brief.pendingDecisionCount).toBeGreaterThan(0);
    expect(brief.actions.map((action) => action.id)).toContain("clear-blockers");
    expect(brief.actions.map((action) => action.id)).toContain("close-decisions");
  });

  it("orders workstreams by operating pressure", () => {
    const brief = buildSteerCoBrief({
      project: projects[0],
      milestones,
      tasks,
      risks,
      documents,
      costLines,
      currentDate: "2026-05-19",
    });

    expect(brief.workstreams[0].name).toBe("Data Migration");
    expect(brief.workstreams[0].tone).toBe("rose");
  });
});
