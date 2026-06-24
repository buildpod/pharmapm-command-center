// O10 — reporting trend ("is this getting better or worse?").
//
// There was no time-series: the report only ever showed the current state, so a
// sponsor couldn't see direction of travel. This store persists a small snapshot
// of the headline metrics each time the PM captures a reporting point, so the
// next report can show the delta since last time. One snapshot per report week
// (re-capturing the same week replaces it — viewing the report doesn't multiply
// points). Pure localStorage CRUD; the report decides when to capture.

const KEY = "aivello_report_trend_v1";

export type TrendRag = "Green" | "Amber" | "Red";

export interface TrendSnapshot {
  at: string;                 // ISO timestamp captured
  weekLabel: string;          // report week this point represents (dedupe key)
  confidence: number;         // 0–100 leadership confidence score
  scheduleHealth: TrendRag;
  daysToGoLive: number;
  committedGoLive: string;    // ISO date of the committed go-live at capture
  budgetBurnPct: number | null;
}

type Store = Record<string, TrendSnapshot[]>;

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

// Snapshots for a project, newest first.
export function getTrendSnapshots(projectId: string): TrendSnapshot[] {
  return read()[projectId] ?? [];
}

// The most recent captured point (the comparison baseline for "since last time").
export function getLatestSnapshot(projectId: string): TrendSnapshot | null {
  return getTrendSnapshots(projectId)[0] ?? null;
}

// Capture (or replace) the snapshot for its report week. Returns the stored list
// (newest first), capped to the last 52 points (~a year of weekly reporting).
export function captureSnapshot(projectId: string, snapshot: TrendSnapshot): TrendSnapshot[] {
  const store = read();
  const existing = store[projectId] ?? [];
  // Replace any existing point for the same week so re-capturing is idempotent.
  const deduped = existing.filter((s) => s.weekLabel !== snapshot.weekLabel);
  const next = [snapshot, ...deduped]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 52);
  store[projectId] = next;
  write(store);
  return next;
}
