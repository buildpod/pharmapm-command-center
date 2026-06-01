import { describe, expect, it } from "vitest";
import { StatusPill, statusToneClasses } from "./status-pill";

describe("StatusPill", () => {
  it("uses the shared rose token classes", () => {
    const element = StatusPill({ tone: "rose", children: "Blocked" });

    expect(element.props.className).toContain("rounded-full");
    expect(element.props.className).toContain("text-[10px]");
    expect(element.props.className).toContain(statusToneClasses.rose.pill);
    expect(element.props.children).toBe("Blocked");
  });

  it("supports the small text size", () => {
    const element = StatusPill({ tone: "emerald", size: "sm", children: "Stable" });

    expect(element.props.className).toContain("text-[11px]");
    expect(element.props.className).toContain("bg-emerald-50");
  });
});
