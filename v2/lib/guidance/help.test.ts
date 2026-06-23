import { describe, expect, it } from "vitest";
import { helpByRoute, missingHelpRoutes } from "./help";
import { toursByRoute } from "./tours";
import { routeToTabMap } from "../navigation";

describe("guidance content", () => {
  it("has help content for every shell route", () => {
    expect(missingHelpRoutes()).toEqual([]);
  });

  it("keeps help entries useful and concise", () => {
    Object.entries(helpByRoute).forEach(([route, entry]) => {
      expect(entry.question, `${route} question`).toMatch(/\?$/);
      expect(entry.canDo.length, `${route} action count`).toBeGreaterThanOrEqual(3);
      expect(entry.canDo.length, `${route} action count`).toBeLessThanOrEqual(5);
      entry.canDo.forEach((line) => expect(line.trim().length).toBeGreaterThan(16));
    });
  });

  it("keeps tours short enough to avoid blocking work", () => {
    expect(Object.keys(toursByRoute).sort()).toEqual(Object.keys(routeToTabMap).sort());
    Object.entries(toursByRoute).forEach(([route, steps]) => {
      expect(steps.length, `${route} tour length`).toBeGreaterThanOrEqual(3);
      expect(steps.length, `${route} tour length`).toBeLessThanOrEqual(5);
      steps.forEach((step) => {
        expect(step.anchor).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.body).toBeTruthy();
      });
    });
  });
});
