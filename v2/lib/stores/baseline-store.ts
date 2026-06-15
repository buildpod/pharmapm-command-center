// Per-project frozen commitment store (F2). Persists the go-live date that was
// committed at baseline, so the Impact Engine measures slips against the PROMISE
// rather than a date the PM can quietly edit. Re-baselining is explicit and
// returns the prior value so the caller can log it as a governed event.

const KEY = "aivello_baseline_commitment_v1";

export interface FrozenCommitment {
  committedGoLive: string;
  capturedAt: string; // ISO
}

type Store = Record<string, FrozenCommitment>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota — ignore */
  }
}

export function getCommitment(projectId: string): FrozenCommitment | null {
  return read()[projectId] ?? null;
}

// Freeze the commitment on first sighting from the project's current go-live
// date. Idempotent — once frozen, the live date can change but this won't.
export function ensureCommitment(projectId: string, goLiveDate: string): FrozenCommitment {
  const store = read();
  if (!store[projectId]) {
    store[projectId] = { committedGoLive: goLiveDate, capturedAt: new Date().toISOString() };
    write(store);
  }
  return store[projectId];
}

// Explicit, deliberate re-baseline. Returns the prior commitment so the caller
// can write an audit entry (old → new). This is the ONLY way the frozen date
// changes — a plain go-live field edit must not touch it.
export function rebaseline(projectId: string, newGoLive: string): { prior: FrozenCommitment | null; next: FrozenCommitment } {
  const store = read();
  const prior = store[projectId] ?? null;
  const next: FrozenCommitment = { committedGoLive: newGoLive, capturedAt: new Date().toISOString() };
  store[projectId] = next;
  write(store);
  return { prior, next };
}
