// Per-project frozen commitment store (F2). Persists the go-live date that was
// committed at baseline, so the Impact Engine measures slips against the PROMISE
// rather than a date the PM can quietly edit. Re-baselining is explicit and
// returns the prior value so the caller can log it as a governed event.

const KEY = "aivello_baseline_commitment_v1";
const HISTORY_KEY = "aivello_baseline_rebaselines_v1";

export interface FrozenCommitment {
  committedGoLive: string;
  capturedAt: string; // ISO
}

// O8.4 — a re-baseline is a governed event, not a silent reset. We keep the
// full who/when/why so it's visible (report + banner), never hidden.
export interface RebaselineEvent {
  from: string;       // prior committed go-live (ISO date)
  to: string;         // new committed go-live (ISO date)
  at: string;         // ISO timestamp
  by: string;         // operator initials
  reason: string;     // why the commitment moved
}

type Store = Record<string, FrozenCommitment>;
type HistoryStore = Record<string, RebaselineEvent[]>;

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

function readHistory(): HistoryStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}") as HistoryStore;
  } catch {
    return {};
  }
}

function writeHistory(store: HistoryStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(store));
  } catch {
    /* quota — ignore */
  }
}

export function getCommitment(projectId: string): FrozenCommitment | null {
  return read()[projectId] ?? null;
}

// O8.4 — re-baseline history for a project, newest first.
export function getRebaselineHistory(projectId: string): RebaselineEvent[] {
  return readHistory()[projectId] ?? [];
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

// Explicit, deliberate re-baseline (O8.4). Resets the frozen commitment AND
// records a who/when/why history event so the change is visible, not hidden.
// This is the ONLY way the frozen date changes — a plain go-live field edit
// must not touch it. Returns the prior commitment and the logged event.
export function recordRebaseline(
  projectId: string,
  newGoLive: string,
  by: string,
  reason: string,
): { prior: FrozenCommitment | null; event: RebaselineEvent } {
  const store = read();
  const prior = store[projectId] ?? null;
  const at = new Date().toISOString();
  const next: FrozenCommitment = { committedGoLive: newGoLive, capturedAt: at };
  store[projectId] = next;
  write(store);

  const event: RebaselineEvent = {
    from: prior?.committedGoLive ?? newGoLive,
    to: newGoLive,
    at,
    by,
    reason: reason.trim() || "No reason given",
  };
  const history = readHistory();
  history[projectId] = [event, ...(history[projectId] ?? [])].slice(0, 50);
  writeHistory(history);

  return { prior, event };
}
