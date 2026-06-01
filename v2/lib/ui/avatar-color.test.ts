import { describe, expect, it } from "vitest";
import { AVATAR_COLORS, avatarColor } from "./avatar-color";

describe("avatarColor", () => {
  it("returns a stable color for the same initials", () => {
    expect(avatarColor("VP")).toBe(avatarColor("VP"));
  });

  it("returns one of the shared avatar colors", () => {
    expect(AVATAR_COLORS).toContain(avatarColor("QA"));
  });

  it("uses the documented hash mapping", () => {
    const expected = AVATAR_COLORS[("A".charCodeAt(0) + "R".charCodeAt(0)) % AVATAR_COLORS.length];

    expect(avatarColor("AR")).toBe(expected);
  });
});
