"use client";

// O8.4 — re-baseline visibility. A re-baseline (moving the committed go-live)
// must be a governed, visible event — who/when/why — never a silent date edit.
// This banner appears when the live go-live has drifted from the frozen
// commitment (F2), lets the PM record an explicit re-baseline with a reason,
// and always shows the re-baseline history so it's never hidden.

import { useState } from "react";
import { toast } from "sonner";
import { History, AlertTriangle } from "lucide-react";
import { commitmentStatus } from "@/lib/domain/baseline-commitment";
import { getCommitment, getRebaselineHistory, recordRebaseline } from "@/lib/stores/baseline-store";
import { appendAudit, buildAction } from "@/lib/stores/audit";
import { useCurrentUser } from "@/lib/settingsStore";

function fmt(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function CommitmentBanner({ projectId, currentGoLive }: { projectId: string; currentGoLive: string }) {
  const me = useCurrentUser();
  const [tick, setTick] = useState(0); // bump to re-read the store after a re-baseline
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  // tick is referenced so the re-reads below recompute after recordRebaseline.
  void tick;
  const committed = getCommitment(projectId)?.committedGoLive ?? currentGoLive;
  const status = commitmentStatus(committed, currentGoLive);
  const history = getRebaselineHistory(projectId);

  // Nothing to surface: no drift and no past re-baselines.
  if (!status.rebaselined && history.length === 0) return null;

  function doRebaseline() {
    recordRebaseline(projectId, currentGoLive, me.initials, reason);
    appendAudit(buildAction({
      type: "update",
      entityKind: "milestone",
      entityId: "go-live",
      source: "user-edit",
      projectId,
      note: `Re-baselined committed go-live ${fmt(status.committed)} → ${fmt(currentGoLive)} by ${me.initials} — ${reason.trim() || "no reason given"}`,
    }));
    toast.success("Re-baseline recorded", { description: `Committed go-live is now ${fmt(currentGoLive)}.` });
    setReason("");
    setShowForm(false);
    setTick((t) => t + 1);
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
      {status.rebaselined && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">The live go-live has drifted from the committed baseline.</p>
              <p className="mt-0.5">
                Committed: <strong>{fmt(status.committed)}</strong> · now planned: <strong>{fmt(status.current)}</strong>{" "}
                ({status.driftDays > 0 ? `+${status.driftDays}` : status.driftDays} days). Impact is still measured against the
                committed date until you re-baseline.
              </p>
            </div>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="shrink-0 rounded-full border border-amber-400 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-100"
            >
              Re-baseline to {fmt(status.current)}…
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex-1 space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-200/80">
              Why is the commitment changing? (recorded as who/when/why)
            </span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. SteerCo approved a 3-week extension for scope addition"
              className="w-full rounded border border-amber-300 bg-white px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-400 dark:bg-background"
            />
          </label>
          <button
            type="button"
            onClick={doRebaseline}
            className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Record re-baseline
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setReason(""); }}
            className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:text-amber-200"
          >
            Cancel
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-3 border-t border-amber-200 pt-2 dark:border-amber-500/30">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-200/80">
            <History className="h-3.5 w-3.5" /> Re-baseline history
          </p>
          <ul className="mt-1.5 space-y-1">
            {history.map((e) => (
              <li key={e.at} className="text-xs text-amber-900 dark:text-amber-200">
                <span className="tabular-nums">{fmt(e.from)} → {fmt(e.to)}</span>
                {" · "}<span className="text-amber-900/70 dark:text-amber-200/70">{fmt(e.at.slice(0, 10))} by {e.by}</span>
                {" — "}{e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
