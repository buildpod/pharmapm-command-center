"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  X, ArrowRight, AlertTriangle, Info, Milestone as MilestoneIcon, CheckSquare, Search,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DependencyRepairAction,
  DependencyRepairEdge,
  DependencyRepairPlan,
} from "@/lib/domain/scheduling";
import type { ConsequenceProjection } from "@/lib/domain/consequence";

// M20: Universal selective-cascade impact review.
// - Holds local state for per-row exclusions + date overrides
// - Calls parent-provided onRecompute() on every state change to fetch
//   fresh sections + constraint violations
// - Renders per-row checkbox + editable date input
// - Apply count reflects the *current* selection, not the original cascade

// ─── Section + row shapes ────────────────────────────────────────────────────

export interface ImpactRow {
  id: string;            // task id ("t12") or milestone id ("m6" or "1" — caller decides)
  name?: string;
  oldDate: string;
  newDate: string;
  daysShifted: number;
  isCritical?: boolean;
  // M20.6 — optional grouping bucket (workstream for tasks, phase for milestones).
  // If any row in a section has a `group`, the drawer renders collapsible
  // sub-sections per group. Sections where no row sets `group` render flat.
  group?: string;
  // M20.6 — ancestry trace for transitive proposals. E.g. a milestone shift
  // driven by a task push surfaces as "← driven by T1". Caller supplies a
  // short human-readable hint string. Renders as a small caption below the name.
  ancestry?: string;
}

export interface ViolationRow {
  id: string;
  name?: string;
  message: string;
}

// M20.3 — read-only info row (blue tone). Used for "slack created" entries
// where a milestone moving later leaves linked tasks with headroom — no shift
// required, just a positive informational nudge.
export interface InfoRow {
  id: string;
  name?: string;
  oldDate: string;       // e.g. task due
  newDate: string;       // e.g. milestone new planned
  slackDays: number;     // working-day slack gained
}

// M21-DrawerRewrite — single info card with title + body + optional
// collapsible item list + optional action button. Used for partial-success
// states (e.g. cycle-blocked preview where the user's edit still saved).
// Always tone-matched to outcome (amber for partial-success, blue for info,
// slate for neutral) — never rose.
export interface CalloutSection {
  kind: "callout";
  tone: "amber" | "blue" | "slate";
  title: string;
  body: string;
  collapsibleLabel?: string;          // e.g. "Show 10 tasks in the loop"
  collapsibleItems?: { id: string; name?: string; group?: string }[];
  actionLabel?: string;                // e.g. "Open Tasks page"
  onAction?: () => void;
}

export type ImpactSection =
  | { kind: "milestones"; title: string; rows: ImpactRow[] }
  | { kind: "tasks";      title: string; rows: ImpactRow[] }
  | { kind: "warnings";   title: string; rows: ViolationRow[] }
  | { kind: "info";       title: string; rows: InfoRow[] }
  | {
      kind: "dependency-workbench";
      title: string;
      plan: DependencyRepairPlan;
      onResolveLink?: (action: DependencyRepairAction, edge: DependencyRepairEdge) => void;
    }
  | CalloutSection;

export interface ImpactSummary {
  originatorKind: "milestone" | "task";
  originatorId: string;
  originatorName: string;
  oldDate: string;
  newDate: string;
  daysShifted: number;
}

// What the parent provides on every recompute(). The drawer calls this
// whenever the user toggles include / edits a newDate, so the parent re-runs
// the cascade engine with the new opts and returns fresh sections.
// Trust & adjust — fact assumptions the PM can override; changing them re-flows
// the impact. Confidence is deliberately NOT here: a computed-not-hand-set score
// is the trust guarantee.
export interface ImpactAssumptions {
  tmDayRateOverride?: number | null;  // $/working day; null = implied
  freezeApplies?: boolean;            // default true; false = ignore hard windows
}

export interface RecomputeResult {
  sections: ImpactSection[];
  // Impact Engine — the consequence story (go-live / cost / confidence vs. the
  // frozen commitment). Rendered ABOVE the evidence sections: causal sentence
  // first, evidence underneath. Optional — absent for non-date originators.
  consequence?: ConsequenceProjection;
}

// ─── Mini-timeline (M20.6) ──────────────────────────────────────────────────
//
// A thin horizontal bar showing each row's old → new position on a shared
// axis scaled to the drawer's full date range. Two markers:
//   - old position: small grey tick
//   - new position: solid colored pill (rose if forward, emerald if backward)
// A colored segment connects them. Gives PMs the *shape* of the shift at a
// glance — far more legible than reading two ISO dates and computing the delta.

function MiniTimeline({
  tMin, tMax, oldDate, newDate, daysShifted, excluded,
}: {
  tMin: string; tMax: string;
  oldDate: string; newDate: string;
  daysShifted: number;
  excluded?: boolean;
}) {
  if (!tMin || !tMax || tMin === tMax) return null;
  const minMs = new Date(tMin).getTime();
  const maxMs = new Date(tMax).getTime();
  const span  = maxMs - minMs;
  if (span <= 0) return null;
  const pct = (d: string) => {
    const ms = new Date(d).getTime();
    return Math.max(0, Math.min(100, ((ms - minMs) / span) * 100));
  };
  const oldPct = pct(oldDate);
  const newPct = pct(newDate);
  const segStart = Math.min(oldPct, newPct);
  const segWidth = Math.max(0.5, Math.abs(newPct - oldPct));
  const forwardShift = daysShifted > 0;

  return (
    <div
      className={cn(
        "relative mt-2 h-1.5 w-full rounded-full bg-muted",
        excluded && "opacity-40"
      )}
      aria-hidden
    >
      {/* connecting segment */}
      <div
        className={cn(
          "absolute top-0 h-1.5 rounded-full",
          forwardShift ? "bg-rose-300" : "bg-emerald-300"
        )}
        style={{ left: `${segStart}%`, width: `${segWidth}%` }}
      />
      {/* old marker — grey tick */}
      <div
        className="absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-muted-foreground/60"
        style={{ left: `${oldPct}%` }}
        title={`Before: ${oldDate}`}
      />
      {/* new marker — colored solid pill */}
      <div
        className={cn(
          "absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm shadow-sm",
          forwardShift ? "bg-rose-600" : "bg-emerald-600"
        )}
        style={{ left: `${newPct}%` }}
        title={`After: ${newDate}`}
      />
    </div>
  );
}

// ─── Consequence story (Impact Engine) ───────────────────────────────────────
//
// The narrative spine, top of the drawer: what you did → does it matter → the
// one go-live headline → why (chain) → true cost → confidence. Tone is amber
// for a governed tradeoff (a slip you're choosing), emerald when absorbed —
// never rose. Honest blanks: a figure that can't be defended says so (C7).
function ConsequenceStory({
  c, assumptions, onAssumptionsChange,
}: {
  c: ConsequenceProjection;
  assumptions: ImpactAssumptions;
  onAssumptionsChange: (next: ImpactAssumptions) => void;
}) {
  // Tone keys off `benign` (truly nothing wrong), NOT `absorbed` — a vendor
  // over-charge holds go-live but still costs money, so it stays amber.
  const benign = c.benign;
  const [showRationale, setShowRationale] = useState(false);

  return (
    <div
      className={cn(
        "mb-4 rounded-lg border p-3",
        benign ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60",
      )}
    >
      {/* Causal sentence — read this first */}
      <p className={cn("text-sm font-medium", benign ? "text-emerald-950" : "text-amber-950")}>
        {c.summary}
      </p>

      {!benign && (
        <>
          {/* The three consequences */}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat label="Go-live">
              {c.goLive.absorbed ? (
                <span className="tabular-nums font-semibold text-foreground">
                  {c.goLive.committed}
                  <span className="ml-1.5 text-[11px] font-medium text-emerald-700">holds</span>
                </span>
              ) : c.goLive.lockedBreach ? (
                <>
                  <span className="tabular-nums font-semibold text-foreground">{c.goLive.committed}</span>
                  <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-900">
                    locked
                  </span>
                  <span className="mt-0.5 block text-[11px] text-amber-700">
                    work overruns by +{c.goLive.workingDaysSlip} working days
                  </span>
                </>
              ) : (
                <>
                  <span className="tabular-nums">
                    <span className="text-muted-foreground line-through">{c.goLive.committed}</span>
                    <span className="px-1">→</span>
                    <span className="font-semibold text-foreground">{c.goLive.projected}</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-amber-700">
                    +{c.goLive.workingDaysSlip} working days
                  </span>
                </>
              )}
            </Stat>

            <Stat label="Confidence">
              {c.confidence.before === null ? (
                <span className="text-xs text-muted-foreground">Not computed yet</span>
              ) : c.confidence.moves ? (
                <span className="tabular-nums">
                  <span className="text-muted-foreground">{c.confidence.before}</span>
                  <span className="px-1">→</span>
                  <span className="font-semibold text-amber-800">{c.confidence.after}</span>
                </span>
              ) : (
                <span className="tabular-nums font-semibold text-foreground">{c.confidence.before}</span>
              )}
              {!c.confidence.moves && c.confidence.before !== null && (
                <span className="mt-0.5 block text-[11px] text-muted-foreground">unchanged</span>
              )}
            </Stat>

            <Stat label="Forecast cost">
              {c.cost.estimable ? (
                c.cost.addedCost > 0 ? (
                  <span className="font-semibold text-amber-800 tabular-nums">
                    +{formatMoney(c.cost.addedCost)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No added cost</span>
                )
              ) : (
                <span className="text-xs text-muted-foreground">Not estimable</span>
              )}
            </Stat>
          </div>

          {/* Hard-window collision — the organisational wall the cascade can't see */}
          {c.windowCollision && (
            <p className="mt-3 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Lands inside the <strong>{c.windowCollision.label}</strong> — next clear date {c.windowCollision.nextClear}.
              </span>
            </p>
          )}

          {/* Why — the traceable chain */}
          {c.chain.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
              {c.chain.map((node, i) => (
                <span key={`${node.kind}-${node.id}`} className="flex items-center gap-1">
                  {i > 0 && <ArrowRight className="h-3 w-3 shrink-0 opacity-50" />}
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-medium",
                      node.kind === "milestone"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-card text-foreground border border-border",
                    )}
                  >
                    {node.name ?? node.id.toUpperCase()}
                  </span>
                </span>
              ))}
            </p>
          )}

          {/* Honest note when confidence holds despite the breach */}
          {!c.confidence.moves && c.confidence.before !== null && (
            <p className="mt-2 text-[11px] text-amber-800">{c.confidence.note}</p>
          )}

          {/* Trust & adjust — full rationale, with editable fact assumptions */}
          <button
            onClick={() => setShowRationale((v) => !v)}
            className="mt-3 flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:underline"
          >
            {showRationale ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {showRationale ? "Hide how this is calculated" : "How is this calculated?"}
          </button>
          {showRationale && (
            <RationalePanel c={c} assumptions={assumptions} onAssumptionsChange={onAssumptionsChange} />
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

function formatMoney(dollars: number): string {
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}k`;
  return `$${dollars}`;
}

// Trust & adjust — the full derivation. Facts the PM owns (T&M day-rate, whether
// a freeze applies) are editable and re-flow the impact; the confidence formula
// is shown but not editable, because a hand-set score is a score no one trusts.
function RationalePanel({
  c, assumptions, onAssumptionsChange,
}: {
  c: ConsequenceProjection;
  assumptions: ImpactAssumptions;
  onAssumptionsChange: (next: ImpactAssumptions) => void;
}) {
  const cost = c.cost;
  return (
    <div className="mt-2 space-y-3 rounded-md border border-border bg-card/60 p-3 text-[11px] text-foreground">
      {/* Go-live */}
      <div>
        <p className="font-semibold uppercase tracking-wider text-muted-foreground">Go-live</p>
        <p className="mt-1 text-muted-foreground">
          Projected from the latest task feeding each gate, plus a 1 working-day gate buffer, then
          carried down the binding path to go-live.
        </p>
        {c.windowCollision && (
          <label className="mt-1.5 flex items-center gap-1.5 text-foreground">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-border accent-primary"
              checked={assumptions.freezeApplies !== false}
              onChange={(e) => onAssumptionsChange({ ...assumptions, freezeApplies: e.target.checked })}
            />
            <span>
              The <strong>{c.windowCollision.label}</strong> applies (pushes go-live to {c.windowCollision.nextClear})
            </span>
          </label>
        )}
      </div>

      {/* Forecast cost — editable day-rate */}
      <div>
        <p className="font-semibold uppercase tracking-wider text-muted-foreground">Forecast cost</p>
        {cost.directCost > 0 && (
          <p className="mt-1 text-muted-foreground">Direct cost (added scope / over-charge): <strong>{formatMoney(cost.directCost)}</strong>.</p>
        )}
        {cost.estimable && cost.overrunDays > 0 ? (
          <>
            <p className="mt-1 text-muted-foreground">
              <strong>${cost.tmDayRate.toLocaleString()}</strong>/day{" "}
              {cost.rateOverridden
                ? <>(you set · implied ${cost.tmDayRateImplied.toLocaleString()} = {formatMoney(cost.tmBudget)} T&M ÷ {cost.committedDurationDays} days)</>
                : <>(T&M lines {formatMoney(cost.tmBudget)} ÷ {cost.committedDurationDays} working days)</>}
              {" "}× {cost.overrunDays} overrun days = <strong>{formatMoney(cost.tmExtensionCost)}</strong>.
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-muted-foreground">T&M rate used:</span>
              <span className="text-foreground">$</span>
              <input
                type="number"
                min={0}
                value={cost.tmDayRate}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  onAssumptionsChange({ ...assumptions, tmDayRateOverride: v === "" ? null : Math.max(0, Number(v)) });
                }}
                className="w-24 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-muted-foreground">/day</span>
              {cost.rateOverridden && (
                <button
                  onClick={() => onAssumptionsChange({ ...assumptions, tmDayRateOverride: null })}
                  className="text-blue-700 hover:underline"
                >
                  reset to implied
                </button>
              )}
            </div>
          </>
        ) : !cost.estimable ? (
          <p className="mt-1 text-muted-foreground">{cost.reason}</p>
        ) : (
          <p className="mt-1 text-muted-foreground">No schedule extension — no duration-driven cost.</p>
        )}
      </div>

      {/* Confidence — read-only by design */}
      <div>
        <p className="font-semibold uppercase tracking-wider text-muted-foreground">Confidence</p>
        <p className="mt-1 text-muted-foreground">
          Computed: 40% cost-efficiency + 40% schedule-pace + 20% forecast-headroom.
          {c.confidence.before !== null && (
            <> {c.confidence.moves ? `Added cost moved it ${c.confidence.before} → ${c.confidence.after}.` : `Holds at ${c.confidence.before}.`}</>
          )}
        </p>
        <p className="mt-1 italic text-muted-foreground">This score is computed, never hand-set — that is what makes it trustworthy.</p>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function ImpactDrawer({
  open,
  summary,
  recompute,
  onApply,
  onCancel,
}: {
  open: boolean;
  summary: ImpactSummary;
  // Pure function; called on every state change.
  recompute: (excludeIds: Set<string>, overrides: Record<string, string>, assumptions: ImpactAssumptions) => RecomputeResult;
  // Called with the user's final selection on Apply.
  onApply: (excludeIds: Set<string>, overrides: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [excludeIds, setExcludeIds] = useState<Set<string>>(new Set());
  const [overrides,  setOverrides]  = useState<Record<string, string>>({});
  // Decision-first: when there's a consequence story to lead with, the full
  // editable cascade collapses behind a disclosure (closed by default). With no
  // story to lead with, details stay open so the drawer is never empty.
  const [showDetails, setShowDetails] = useState(false);
  // Trust & adjust — overridable fact assumptions; changing them re-flows the impact.
  const [assumptions, setAssumptions] = useState<ImpactAssumptions>({ freezeApplies: true });

  // Reset state on open (in case the drawer is re-used across edits)
  useEffect(() => { if (open) { setExcludeIds(new Set()); setOverrides({}); } }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Recompute on every state change. Memoised on (excludeIds, overrides).
  const { sections, consequence } = useMemo(
    () => recompute(excludeIds, overrides, assumptions),
    // reason: recompute is captured from props; we intentionally re-run only on state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [excludeIds, overrides, assumptions]
  );

  if (!open) return null;

  // M20.6 — info-kind rows aren't shifts; they're read-only nudges.
  // Strictly count only milestones + tasks for shift totals.
  const shiftRows = sections
    .filter((s): s is Extract<ImpactSection, { kind: "milestones" | "tasks" }> =>
      s.kind === "milestones" || s.kind === "tasks")
    .flatMap((s) => s.rows);
  const includedShifts = shiftRows.filter((r) => !excludeIds.has(r.id)).length;
  const totalShifts = shiftRows.length;
  // Step 2 — how many of the shifts are on the binding path to go-live.
  const criticalShifts = shiftRows.filter((r) => r.isCritical).length;

  // M20.6 — compute timeline range across the originator + every shift row so
  // each row's mini-timeline bar is scaled to the same axis. Falls back to a
  // single-point window if all dates collide (rare in practice).
  const allDates: string[] = [summary.oldDate, summary.newDate];
  sections.forEach((s) => {
    if (s.kind === "milestones" || s.kind === "tasks") {
      s.rows.forEach((r) => { allDates.push(r.oldDate, r.newDate); });
    } else if (s.kind === "info") {
      s.rows.forEach((r) => { allDates.push(r.oldDate, r.newDate); });
    }
  });
  const validDates = allDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const tMin = validDates.length ? validDates.reduce((a, b) => a < b ? a : b) : "";
  const tMax = validDates.length ? validDates.reduce((a, b) => a > b ? a : b) : "";

  const totalWarnings = sections
    .filter((s): s is Extract<ImpactSection, { kind: "warnings" }> => s.kind === "warnings")
    .flatMap((s) => s.rows)
    .length;

  const totalInfo = sections
    .filter((s): s is Extract<ImpactSection, { kind: "info" }> => s.kind === "info")
    .flatMap((s) => s.rows)
    .length;

  // M21-DrawerRewrite — detect a callout section. Used to know we're in a
  // partial-success state (e.g. cycle blocked preview) so the Save button can
  // label itself honestly. Replaces the prior engine-error detection.
  const hasCallout = sections.some((s) => s.kind === "callout");

  function toggleExclude(id: string) {
    setExcludeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    // Also drop the override for this row if it was set (consistency)
    setOverrides((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function setOverride(id: string, newDate: string) {
    setOverrides((prev) => ({ ...prev, [id]: newDate }));
  }

  function clearOverride(id: string) {
    setOverrides((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onCancel} aria-hidden />

      <div className="impact-modal-wrap">
        <div
          className="impact-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Review schedule impact"
          data-coachmark-anchor="schedule-impact-modal"
        >
        {/* Header */}
        <header className="impact-modal-header">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="impact-modal-header__title">Review Schedule Impact</h2>
              <p className="impact-modal-header__subtitle">
                Review what will change. Uncheck a row to keep its date, or pick a different date inline.
              </p>
            </div>
            <button
              onClick={onCancel}
              className="drawer-close"
              title="Cancel (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Originating change */}
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {summary.originatorKind === "milestone" ? <MilestoneIcon className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                <span className="font-mono text-[10px] font-bold text-muted-foreground">{summary.originatorId.toUpperCase()}</span>
                {" · "}
                {summary.originatorName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
                <span className="line-through">{summary.oldDate}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-semibold text-foreground">{summary.newDate}</span>
                {summary.daysShifted !== 0 && (
                  <span className={cn(
                    "ml-1 rounded-full px-1.5 py-0 text-[10px] font-bold",
                    summary.daysShifted > 0
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}>
                    {summary.daysShifted > 0 ? `+${summary.daysShifted}d` : `${summary.daysShifted}d`}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Totals strip — M21-DrawerRewrite cleanup. When callout state
              (partial success / preview unavailable), don't pretend totalShifts
              means anything; show a single quiet "preview unavailable" chip. */}
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            {hasCallout ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                preview unavailable
              </span>
            ) : (
              <span className={cn(
                "rounded-full border px-2 py-0.5 font-semibold",
                totalShifts === 0
                  ? "border-slate-200 bg-slate-50 text-slate-600"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              )}>
                {totalShifts === 0
                  ? "Nothing else changes"
                  : `${includedShifts} of ${totalShifts} included`}
              </span>
            )}
            {criticalShifts > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                {criticalShifts} of {totalShifts} drive go-live
              </span>
            )}
            {totalWarnings > 0 && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">
                {totalWarnings} to review
              </span>
            )}
            {Object.keys(overrides).length > 0 && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                {Object.keys(overrides).length} edited
              </span>
            )}
            {totalInfo > 0 && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                {totalInfo} gained slack
              </span>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="impact-modal-body">
          {consequence && (
            <ConsequenceStory c={consequence} assumptions={assumptions} onAssumptionsChange={setAssumptions} />
          )}
          {(() => {
            const nothingElse = totalShifts === 0 && totalWarnings === 0 && totalInfo === 0 && !hasCallout;
            // With a consequence story, the story already states the outcome —
            // don't repeat it with an empty-state box.
            if (nothingElse) {
              if (consequence) return null;
              return (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center">
                  <Info className="mx-auto mb-2 h-5 w-5 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">Nothing else will change</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Save to apply this change. No other tasks or milestones are affected.
                  </p>
                </div>
              );
            }

            // Decision-first: lead with the story; the editable cascade lives
            // behind a disclosure. With no story to lead with, keep it open.
            const detailsOpen = showDetails || !consequence;
            const renderedSections = sections.map((section, sIdx) => {
              if (
                section.kind !== "callout" &&
                section.kind !== "dependency-workbench" &&
                section.rows.length === 0
              ) return null;
              return (
                <Section
                  key={sIdx}
                  section={section}
                  excludeIds={excludeIds}
                  overrides={overrides}
                  onToggle={toggleExclude}
                  onOverride={setOverride}
                  onClearOverride={clearOverride}
                  tMin={tMin}
                  tMax={tMax}
                />
              );
            });

            return (
              <>
                {consequence && (
                  <button
                    onClick={() => setShowDetails((v) => !v)}
                    className="mb-2 flex w-full items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {detailsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {detailsOpen ? "Hide details" : "Review & adjust details"}
                    <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                      {totalShifts} change{totalShifts === 1 ? "" : "s"}
                      {totalWarnings > 0 ? ` · ${totalWarnings} to review` : ""}
                    </span>
                  </button>
                )}
                {detailsOpen && renderedSections}
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <footer className="impact-modal-footer">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Discard changes
            </button>
            <button
              onClick={() => onApply(excludeIds, overrides)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {/* M21-DrawerRewrite — Save semantics. Drops "Apply edit"
                  jargon (per ui-string-audit skill). Drops "shifts" in favor
                  of "changes". Callout state (preview unavailable) reads as
                  partial success — Save with quiet status indicator. */}
              {hasCallout
                ? "Save change"
                : totalShifts === 0
                  ? "Save"
                  : includedShifts === 0
                    ? "Save · this change only"
                    : `Save · ${includedShifts + 1} change${(includedShifts + 1) === 1 ? "" : "s"}`}
            </button>
          </div>
        </footer>
        </div>
      </div>
    </>
  );
}

// ─── Section sub-component ──────────────────────────────────────────────────

function Section({
  section,
  excludeIds,
  overrides,
  onToggle,
  onOverride,
  onClearOverride,
  tMin,
  tMax,
}: {
  section: ImpactSection;
  excludeIds: Set<string>;
  overrides: Record<string, string>;
  onToggle: (id: string) => void;
  onOverride: (id: string, newDate: string) => void;
  onClearOverride: (id: string) => void;
  tMin: string;
  tMax: string;
}) {
  // M21-DrawerRewrite — callouts get their own rendering path (no row list).
  if (section.kind === "callout") {
    return <Callout section={section} />;
  }
  if (section.kind === "dependency-workbench") {
    return <DependencyWorkbench section={section} />;
  }

  const sectionStyle =
    section.kind === "warnings"
      ? "border-rose-200 bg-rose-50/40"
      : section.kind === "milestones"
        ? "border-blue-200 bg-blue-50/40"
        : section.kind === "info"
          ? "border-blue-200 bg-blue-50/30"
          : "border-amber-200 bg-amber-50/40";

  const Icon =
    section.kind === "warnings" ? AlertTriangle
    : section.kind === "milestones" ? MilestoneIcon
    : section.kind === "info" ? Info
    : CheckSquare;

  return (
    <section className={cn("rounded-lg border", sectionStyle)}>
      <div className="flex items-center gap-2 border-b border-inherit px-4 py-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
          {section.title}
        </p>
        <span className="ml-auto rounded-full bg-card px-1.5 text-[10px] font-bold tabular-nums text-muted-foreground">
          {section.rows.length}
        </span>
      </div>
      <ul className="divide-y divide-border bg-card">
        {section.kind === "info"
          ? section.rows.map((row) => (
              <li key={row.id} className="flex items-start gap-3 px-4 py-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Info className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">{row.id.toUpperCase()}</span>
                    {row.name && <> · {row.name}</>}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] tabular-nums text-blue-700">
                    <span>{row.oldDate}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{row.newDate}</span>
                    <span className="ml-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] font-bold text-blue-700">
                      +{row.slackDays}d slack
                    </span>
                  </p>
                </div>
              </li>
            ))
          : section.kind === "warnings"
          ? section.rows.map((row) => (
              <li key={row.id} className="flex items-start gap-3 px-4 py-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <AlertTriangle className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">{row.id.toUpperCase()}</span>
                    {row.name && <> · {row.name}</>}
                  </p>
                  <p className="mt-0.5 text-[11px] text-rose-700">{row.message}</p>
                </div>
              </li>
            ))
          : renderShiftRows(section.rows, section.kind, {
              excludeIds, overrides, onToggle, onOverride, onClearOverride, tMin, tMax,
            })}
      </ul>
    </section>
  );
}

// ─── Shift rows renderer — handles grouping (M20.6) ─────────────────────────

interface ShiftRowDeps {
  excludeIds: Set<string>;
  overrides: Record<string, string>;
  onToggle: (id: string) => void;
  onOverride: (id: string, newDate: string) => void;
  onClearOverride: (id: string) => void;
  tMin: string;
  tMax: string;
}

function renderShiftRows(rows: ImpactRow[], kind: "milestones" | "tasks", deps: ShiftRowDeps) {
  // M20.6 — group rows by `row.group` when at least one row has it. Single-
  // group cascades stay flat (no header noise). Groups render as collapsible
  // sub-sections.
  const hasGroups = rows.some((r) => !!r.group);
  if (!hasGroups) {
    return rows.map((row) => renderShiftRow(row, kind, deps));
  }
  const groups: Record<string, ImpactRow[]> = {};
  rows.forEach((r) => {
    const g = r.group ?? "Other";
    (groups[g] ||= []).push(r);
  });
  const orderedNames = Object.keys(groups);
  return orderedNames.map((g) => (
    <GroupBlock key={g} name={g} rows={groups[g]} kind={kind} deps={deps} />
  ));
}

function GroupBlock({
  name, rows, kind, deps,
}: {
  name: string;
  rows: ImpactRow[];
  kind: "milestones" | "tasks";
  deps: ShiftRowDeps;
}) {
  const [open, setOpen] = useState(true);
  const includedHere = rows.filter((r) => !deps.excludeIds.has(r.id)).length;
  return (
    <li className="bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 border-b border-border bg-muted/30 px-4 py-1.5 text-left transition-colors hover:bg-muted/50"
        aria-expanded={open}
      >
        <span className={cn("inline-block h-2 w-2 shrink-0 rounded-sm transition-transform", open ? "rotate-90" : "")}>
          ▸
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {name}
        </span>
        <span className="ml-auto rounded-full bg-card px-1.5 text-[10px] font-bold tabular-nums text-muted-foreground">
          {includedHere}/{rows.length}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-border">
          {rows.map((row) => renderShiftRow(row, kind, deps))}
        </ul>
      )}
    </li>
  );
}

function renderShiftRow(row: ImpactRow, kind: "milestones" | "tasks", deps: ShiftRowDeps) {
  const { excludeIds, overrides, onToggle, onOverride, onClearOverride, tMin, tMax } = deps;
  const excluded = excludeIds.has(row.id);
  const hasOverride = row.id in overrides;
  return (
    <li key={row.id} className={cn("px-4 py-2.5 transition-opacity", excluded && "opacity-50")}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={!excluded}
          onChange={() => onToggle(row.id)}
          className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-border accent-primary"
          title={excluded ? "Include in schedule update" : "Keep this row's date"}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            <span className="font-mono text-[10px] font-bold text-muted-foreground">{row.id.toUpperCase()}</span>
            {row.name && <> · {row.name}</>}
            {row.isCritical && (
              <span
                className="ml-1.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 text-[9px] font-bold text-amber-700"
                title="On the path that determines the go-live date"
              >
                go-live path
              </span>
            )}
          </p>
          {/* M20.6 — ancestry caption (e.g. transitive milestone push driven by task) */}
          {row.ancestry && (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground italic">
              ← driven by {row.ancestry}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2 text-[11px] tabular-nums">
            <span className="text-muted-foreground line-through">{row.oldDate}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            {excluded ? (
              <span className="font-semibold text-muted-foreground italic">unchanged</span>
            ) : (
              <>
                <input
                  type="date"
                  value={row.newDate}
                  onChange={(e) => onOverride(row.id, e.target.value)}
                  className={cn(
                    "rounded border bg-background px-1.5 py-0.5 text-[11px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                    hasOverride ? "border-blue-300" : "border-border"
                  )}
                  title={hasOverride ? "Override (engine would have suggested differently)" : "Suggested by engine — edit to override"}
                />
                {hasOverride && (
                  <button
                    onClick={() => onClearOverride(row.id)}
                    className="text-[10px] font-medium text-blue-700 hover:underline"
                    title="Revert to engine-suggested date"
                  >
                    ↺ revert
                  </button>
                )}
              </>
            )}
          </div>
          {/* M20.6 — mini-timeline (skips invalid date inputs gracefully) */}
          <MiniTimeline
            tMin={tMin} tMax={tMax}
            oldDate={row.oldDate}
            newDate={excluded ? row.oldDate : (overrides[row.id] ?? row.newDate)}
            daysShifted={row.daysShifted}
            excluded={excluded}
          />
        </div>
        {!excluded && (
          <span className={cn(
            "mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums",
            row.daysShifted > 0
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          )}>
            {row.daysShifted > 0 ? `+${row.daysShifted}d` : `${row.daysShifted}d`}
          </span>
        )}
      </div>
    </li>
  );
}

// ─── Callout sub-component (M21-DrawerRewrite) ──────────────────────────────
//
// One info card with title + body + optional collapsible item list + optional
// action button. Used for partial-success states like cycle-blocked preview.
// Tone-matched via section.tone (amber / blue / slate) — never rose.

function Callout({ section }: { section: CalloutSection }) {
  const [expanded, setExpanded] = useState(false);

  const toneStyle =
    section.tone === "amber"
      ? "border-amber-200 bg-amber-50/60"
      : section.tone === "blue"
        ? "border-blue-200 bg-blue-50/60"
        : "border-slate-200 bg-slate-50/60";
  const iconBg =
    section.tone === "amber"
      ? "bg-amber-100 text-amber-700"
      : section.tone === "blue"
        ? "bg-blue-100 text-blue-700"
        : "bg-slate-100 text-slate-600";
  const titleColor =
    section.tone === "amber"
      ? "text-amber-900"
      : section.tone === "blue"
        ? "text-blue-900"
        : "text-foreground";

  const hasItems = !!section.collapsibleItems && section.collapsibleItems.length > 0;
  const hasAction = !!section.actionLabel && !!section.onAction;

  return (
    <section className={cn("rounded-lg border", toneStyle)}>
      <div className="flex items-start gap-3 px-4 py-3">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", iconBg)}>
          <Info className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-semibold", titleColor)}>
            {section.title}
          </p>
          <p className="mt-1 whitespace-pre-line text-xs text-foreground/80">
            {section.body}
          </p>
          {(hasItems || hasAction) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {hasItems && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-[11px] font-medium text-foreground/80 hover:text-foreground hover:underline"
                  aria-expanded={expanded}
                >
                  {expanded ? "Hide" : section.collapsibleLabel ?? `Show ${section.collapsibleItems!.length} items`}
                </button>
              )}
              {hasAction && (
                <button
                  type="button"
                  onClick={section.onAction}
                  className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {section.actionLabel} →
                </button>
              )}
            </div>
          )}
          {hasItems && expanded && (
            <ul className="mt-2.5 space-y-1 rounded-md border border-border bg-card px-3 py-2">
              {section.collapsibleItems!.map((it) => (
                <li key={it.id} className="flex items-baseline gap-2 text-[11px]">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                    {it.id.toUpperCase()}
                  </span>
                  {it.name && <span className="truncate text-foreground">{it.name}</span>}
                  {it.group && <span className="ml-auto text-[10px] text-muted-foreground">{it.group}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function DependencyWorkbench({
  section,
}: {
  section: Extract<ImpactSection, { kind: "dependency-workbench" }>;
}) {
  const { plan } = section;
  const [activeId, setActiveId] = useState(plan.groups[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [workstream, setWorkstream] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const activeGroup = plan.groups.find((group) => group.id === activeId) ?? plan.groups[0];
  if (!activeGroup) return null;

  const workstreams = ["All", ...activeGroup.workstreams];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredEdges = activeGroup.edges.filter((edge) => {
    const matchesWorkstream =
      workstream === "All" ||
      edge.fromWorkstream === workstream ||
      edge.toWorkstream === workstream;
    const haystack = [
      edge.fromId,
      edge.fromName,
      edge.fromWorkstream,
      edge.toId,
      edge.toName,
      edge.toWorkstream,
    ].filter(Boolean).join(" ").toLowerCase();
    return matchesWorkstream && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const visibleEdges = showAll ? filteredEdges : filteredEdges.slice(0, 8);
  const suggested = activeGroup.suggestedEdge;

  function actionLabel(action: DependencyRepairAction) {
    return action === "make-parallel" ? "Make coordination note" : "Remove waiting link";
  }

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50/40">
      <div className="border-b border-amber-200 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-950">{section.title}</p>
            <div className="mt-1 grid gap-1 text-xs text-foreground/80">
              <p><span className="font-semibold">What happened:</span> Some tasks point back to work that is already waiting on them.</p>
              <p><span className="font-semibold">Why it matters:</span> The preview cannot decide which task should move first.</p>
              <p><span className="font-semibold">What to do:</span> Choose one waiting link to turn into a coordination note or remove.</p>
            </div>
          </div>
        </div>

        {plan.groups.length > 1 && (
          <div className="mt-3 flex gap-1 overflow-x-auto">
            {plan.groups.map((group, idx) => (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  setActiveId(group.id);
                  setShowAll(false);
                  setQuery("");
                  setWorkstream("All");
                }}
                className={cn(
                  "shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  group.id === activeGroup.id
                    ? "border-amber-300 bg-card text-foreground shadow-sm"
                    : "border-transparent bg-transparent text-amber-800 hover:bg-amber-100"
                )}
              >
                Area {idx + 1} · {group.taskCount}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 font-semibold">
            {activeGroup.summary}
          </span>
          <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5">
            {plan.complexity.time} check
          </span>
        </div>

        {suggested && (
          <div className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Recommended first repair
            </p>
            <DependencyEdgeText edge={suggested} />
            <p className="mt-1 text-[11px] text-foreground/75">{suggested.plainReason}</p>
            {section.onResolveLink && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => section.onResolveLink?.(suggested.recommendedAction, suggested)}
                  className="rounded-md bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-amber-800"
                >
                  {actionLabel(suggested.recommendedAction)}
                </button>
                <button
                  type="button"
                  onClick={() => section.onResolveLink?.(
                    suggested.recommendedAction === "make-parallel" ? "remove" : "make-parallel",
                    suggested
                  )}
                  className="rounded-md border border-amber-200 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-amber-50"
                >
                  {actionLabel(suggested.recommendedAction === "make-parallel" ? "remove" : "make-parallel")}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks or workstreams"
              className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
          <select
            value={workstream}
            onChange={(e) => setWorkstream(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            {workstreams.map((ws) => (
              <option key={ws} value={ws}>{ws}</option>
            ))}
          </select>
        </div>

        <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
          {visibleEdges.map((edge) => (
            <li key={edge.id} className={cn("px-3 py-2", edge.suggested && "bg-amber-50/50")}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <DependencyEdgeText edge={edge} compact />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{edge.plainReason}</p>
                </div>
                {section.onResolveLink && (
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => section.onResolveLink?.("make-parallel", edge)}
                      className="rounded border border-border px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted"
                    >
                      Note
                    </button>
                    <button
                      type="button"
                      onClick={() => section.onResolveLink?.("remove", edge)}
                      className="rounded border border-border px-2 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {filteredEdges.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[11px] font-medium text-foreground/80 hover:text-foreground hover:underline"
          >
            {showAll ? "Show fewer links" : `Show all ${filteredEdges.length} links`}
          </button>
        )}
      </div>
    </section>
  );
}

function DependencyEdgeText({
  edge,
  compact = false,
}: {
  edge: DependencyRepairEdge;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-w-0", compact ? "text-[11px]" : "mt-1 text-xs")}>
      <p className="truncate font-medium text-foreground">
        <span className="font-mono text-[10px] font-bold text-muted-foreground">{edge.fromId.toUpperCase()}</span>
        {edge.fromName && <> · {edge.fromName}</>}
      </p>
      <p className="mt-0.5 truncate text-muted-foreground">
        waits for{" "}
        <span className="font-mono text-[10px] font-bold">{edge.toId.toUpperCase()}</span>
        {edge.toName && <> · {edge.toName}</>}
      </p>
      {(edge.fromWorkstream || edge.toWorkstream) && (
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {edge.fromWorkstream ?? "Unassigned"} → {edge.toWorkstream ?? "Unassigned"}
        </p>
      )}
    </div>
  );
}
