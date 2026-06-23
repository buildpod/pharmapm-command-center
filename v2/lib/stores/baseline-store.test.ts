import { beforeEach, describe, expect, it } from "vitest";
import {
  ensureCommitment,
  getCommitment,
  getRebaselineHistory,
  recordRebaseline,
} from "./baseline-store";

// The store guards on `typeof window` and uses localStorage. Default vitest env
// is node (no jsdom installed), so provide a tiny in-memory polyfill rather than
// pulling in a DOM environment for a thin localStorage CRUD module.
function installLocalStorage() {
  const data = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  };
  (globalThis as Record<string, unknown>).window = globalThis;
  (globalThis as Record<string, unknown>).localStorage = ls;
}

describe("baseline commitment store (F2 + O8.4)", () => {
  beforeEach(() => {
    installLocalStorage();
    localStorage.clear();
  });

  it("freezes the commitment on first sighting and stays idempotent", () => {
    const first = ensureCommitment("p1", "2026-09-30");
    expect(first.committedGoLive).toBe("2026-09-30");
    // A later sighting with a different live date must NOT move the frozen value.
    const second = ensureCommitment("p1", "2026-12-31");
    expect(second.committedGoLive).toBe("2026-09-30");
    expect(getCommitment("p1")?.committedGoLive).toBe("2026-09-30");
  });

  it("records a re-baseline with who/when/why and resets the frozen commitment (O8.4)", () => {
    ensureCommitment("p1", "2026-09-30");
    const { prior, event } = recordRebaseline("p1", "2026-10-21", "AK", "SteerCo approved 3-week extension");

    expect(prior?.committedGoLive).toBe("2026-09-30");
    expect(event.from).toBe("2026-09-30");
    expect(event.to).toBe("2026-10-21");
    expect(event.by).toBe("AK");
    expect(event.reason).toContain("SteerCo approved");
    // The frozen commitment is now the new date.
    expect(getCommitment("p1")?.committedGoLive).toBe("2026-10-21");
  });

  it("keeps re-baseline history newest-first and defaults a blank reason", () => {
    ensureCommitment("p1", "2026-09-30");
    recordRebaseline("p1", "2026-10-21", "AK", "first move");
    recordRebaseline("p1", "2026-11-30", "AK", "   ");

    const history = getRebaselineHistory("p1");
    expect(history).toHaveLength(2);
    expect(history[0].to).toBe("2026-11-30"); // newest first
    expect(history[0].reason).toBe("No reason given");
    expect(history[1].to).toBe("2026-10-21");
    // Scoped per project.
    expect(getRebaselineHistory("other")).toHaveLength(0);
  });
});
