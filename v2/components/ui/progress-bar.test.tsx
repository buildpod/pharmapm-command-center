import { describe, expect, it } from "vitest";
import { ProgressBar, clampProgressValue } from "./progress-bar";

describe("ProgressBar", () => {
  it("clamps progress values to the 0-100 range", () => {
    expect(clampProgressValue(-12)).toBe(0);
    expect(clampProgressValue(45.4)).toBe(45);
    expect(clampProgressValue(140)).toBe(100);
    expect(clampProgressValue(Number.NaN)).toBe(0);
  });

  it("uses the primary fill token", () => {
    const element = ProgressBar({ value: 72 });
    const track = element.props.children[0];
    const fill = track.props.children;

    expect(element.props.style).toEqual({ minWidth: 100 });
    expect(track.props.className).toContain("bg-muted");
    expect(fill.props.className).toContain("bg-primary");
    expect(fill.props.style).toEqual({ width: "72%" });
  });
});
