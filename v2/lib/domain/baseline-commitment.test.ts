import { describe, it, expect } from "vitest";
import { commitmentStatus } from "./baseline-commitment";

describe("commitmentStatus — F2: a moved go-live can't erase the commitment", () => {
  it("no drift when current matches the frozen commitment", () => {
    const s = commitmentStatus("2026-09-02", "2026-09-02");
    expect(s.rebaselined).toBe(false);
    expect(s.driftDays).toBe(0);
    expect(s.committed).toBe("2026-09-02");
  });

  it("always anchors on the FROZEN date even when the live date is moved later", () => {
    const s = commitmentStatus("2026-09-02", "2026-12-01");
    expect(s.committed).toBe("2026-09-02"); // impact still measured against the promise
    expect(s.rebaselined).toBe(true);
    expect(s.driftDays).toBeGreaterThan(0);
  });

  it("flags an earlier pull-in too", () => {
    const s = commitmentStatus("2026-09-02", "2026-08-01");
    expect(s.rebaselined).toBe(true);
    expect(s.driftDays).toBeLessThan(0);
  });

  it("falls back to current when no frozen baseline exists yet", () => {
    const s = commitmentStatus("", "2026-09-02");
    expect(s.committed).toBe("2026-09-02");
    expect(s.rebaselined).toBe(false);
  });
});
