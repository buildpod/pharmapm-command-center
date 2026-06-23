"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Calendar,
  RotateCcw,
  Plus,
} from "lucide-react";
import { type Milestone, type MilestoneStatus } from "@/lib/mockData";
import {
  computeRAG,
  computeDependencyStatus,
  cascade,
  scheduleBackward,
  previewCascade,
  previewMilestoneToTaskImpact,
  computeCriticalPath,
  type ScheduleMilestone,
  type TaskScheduleEntry,
} from "@/lib/domain/scheduling";
import { addWorkingDays, workingDaysBetween } from "@/lib/domain/dates";
import { tasks as initialTasks, type Task } from "@/lib/mockData";
import { ImpactDrawer, type ImpactSummary, type ImpactSection, type ImpactAssumptions } from "@/components/ui/impact-drawer";
import { ConsequenceModal } from "@/components/ui/consequence-modal";
import { projectConsequence, resolveGoLiveMilestone } from "@/lib/domain/consequence";
import { SAMPLE_HARD_WINDOWS } from "@/lib/domain/hard-windows";
import { useProjectEvm } from "@/lib/hooks/use-project-evm";
import { appendAudit, buildAction } from "@/lib/stores/audit";
import { ensureCommitment } from "@/lib/stores/baseline-store";
import { CommitmentBanner } from "./commitment-banner";
import { addDays } from "@/lib/domain/dates";
import { useSettings } from "@/lib/settingsStore";
import { useEntityStore } from "@/lib/stores/entity-store";
import { useProject } from "@/components/projects/project-provider";
// (Dialog imports removed in M18 — CascadePreviewDialog replaced by ImpactDrawer)
import { MilestoneFormDrawer } from "./milestone-form";
import { GanttView } from "./gantt-view";
import { LayoutGrid, GanttChartSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusRow } from "@/lib/hooks/use-focus-row";

const TODAY = "2026-05-11";

// ─── Domain conversion helpers ────────────────────────────────────────────────

function toId(id: string) {
  return parseInt(id.replace("m", ""));
}

function toScheduleMs(m: Milestone): ScheduleMilestone {
  const dur = m.duration ?? 1;
  // plannedDate is the completion date (= plannedEnd); derive start from it
  const plannedStart = addWorkingDays(m.plannedDate, -(dur - 1)) ?? m.plannedDate;
  return {
    id: toId(m.id),
    predecessor: m.predecessor ? toId(m.predecessor) : undefined,
    lag: m.lag ?? 0,
    duration: dur,
    plannedStart,
    plannedEnd: m.plannedDate,
    status:
      m.status === "complete"
        ? "Complete"
        : m.status === "in-progress"
        ? "In Progress"
        : m.status === "at-risk"
        ? "Blocked"
        : "Not Started",
    lockDate: m.locked,
  };
}

function applyDomainResult(
  originals: Milestone[],
  domainResults: ScheduleMilestone[]
): Milestone[] {
  const byId: Record<number, ScheduleMilestone> = {};
  domainResults.forEach((sm) => { byId[sm.id] = sm; });
  return originals.map((m) => {
    const sm = byId[toId(m.id)];
    if (!sm) return m;
    return { ...m, plannedDate: sm.plannedEnd ?? m.plannedDate };
  });
}

// ─── Badge styles ─────────────────────────────────────────────────────────────

const ragBadge = {
  Green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Amber: "bg-amber-50 text-amber-700 border-amber-200",
  Red:   "bg-rose-50 text-rose-700 border-rose-200",
};

const depBadge = {
  Clear:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  Waiting: "bg-amber-50 text-amber-700 border-amber-200",
  Blocked: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusIcon = {
  complete:    { icon: CheckCircle2, cls: "text-emerald-600" },
  "in-progress": { icon: Circle,    cls: "text-blue-600"   },
  "at-risk":   { icon: AlertCircle, cls: "text-rose-600" },
  pending:     { icon: Clock,       cls: "text-muted-foreground" },
} as const;

const statusOptions: MilestoneStatus[] = ["pending", "in-progress", "at-risk", "complete"];

const phaseOptions = ["All", "Initiation", "Design", "Config", "Testing", "Training", "Go-Live"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Cascade preview state (M20 — selective) ──────────────────────────────────

interface CascadePreviewState {
  editedId: string;          // milestone id ("m6")
  newPlannedDate: string;    // the user's edit
  summary: ImpactSummary;
  taskWarnings: { taskId: string; taskName?: string; taskDue: string; milestoneNewDate: string }[];
  slackInfo:    { taskId: string; taskName?: string; taskDue: string; milestoneNewDate: string; slackDays: number }[]; // M20.3
  criticalIds: Set<number>;
}

// Read persisted tasks (M16.1) — same fallback pattern as the search index.
function readPersistedTasks(): Task[] {
  if (typeof window === "undefined") return initialTasks;
  try {
    const raw = localStorage.getItem("aivello_tasks_v1");
    if (!raw) return initialTasks;
    return JSON.parse(raw) as Task[];
  } catch {
    return initialTasks;
  }
}

// (CascadePreviewDialog removed in M18 — replaced by the universal
//  <ImpactDrawer> rendered at the bottom of the grid.)

// ─── Inline date cell ─────────────────────────────────────────────────────────

function DateCell({
  value,
  editable,
  onCommit,
  coachmarkAnchor,
}: {
  value: string;
  editable: boolean;
  onCommit: (newVal: string) => void;
  coachmarkAnchor?: string;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editable) {
    return <span className="text-foreground text-xs">{formatDate(value)}</span>;
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1 text-xs text-foreground hover:text-primary"
        title="Click to edit"
        data-coachmark-anchor={coachmarkAnchor}
      >
        {formatDate(value)}
        <Calendar className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 shrink-0" />
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="date"
      defaultValue={value}
      className="w-28 rounded border border-primary px-1 py-0.5 text-xs text-foreground bg-card focus:outline-none focus:ring-1 focus:ring-primary"
      data-coachmark-anchor={coachmarkAnchor}
      onBlur={(e) => {
        setEditing(false);
        if (e.target.value && e.target.value !== value) onCommit(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const val = (e.target as HTMLInputElement).value;
          setEditing(false);
          if (val && val !== value) onCommit(val);
        }
        if (e.key === "Escape") setEditing(false);
      }}
    />
  );
}

// ─── Status cell — click icon to cycle status ────────────────────────────────

const nextMilestoneStatus: Record<MilestoneStatus, MilestoneStatus> = {
  pending:      "in-progress",
  "in-progress": "at-risk",
  "at-risk":    "complete",
  complete:     "pending",
};

function StatusCell({
  value,
  editable,
  onChange,
}: {
  value: MilestoneStatus;
  editable: boolean;
  onChange: (s: MilestoneStatus) => void;
}) {
  const { icon: Icon, cls } = statusIcon[value];
  if (!editable) {
    return (
      <span title={value}>
        <Icon className={cn("h-3.5 w-3.5", cls)} />
      </span>
    );
  }
  return (
    <button
      onClick={() => onChange(nextMilestoneStatus[value])}
      title={`${value} — click to mark ${nextMilestoneStatus[value]}`}
      className="hover:opacity-70 transition-opacity"
    >
      <Icon className={cn("h-3.5 w-3.5", cls)} />
    </button>
  );
}

// ─── Main grid ───────────────────────────────────────────────────────────────

type DrawerState = { mode: "closed" } | { mode: "new" } | { mode: "edit"; milestone: Milestone };

export function MilestonesGrid() {
  const { activeProjectId, activeProject } = useProject();
  useFocusRow();
  const milestones        = useEntityStore((s) => s.milestones);
  const addMilestone      = useEntityStore((s) => s.addMilestone);
  const updateMilestone   = useEntityStore((s) => s.updateMilestone);
  const deleteMilestoneAction = useEntityStore((s) => s.deleteMilestone);
  const replaceAllMilestones  = useEntityStore((s) => s.replaceAllMilestones);
  const [filterPhase, setFilterPhase] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterMine, setFilterMine] = useState(false);
  const [cascadePreview, setCascadePreview] = useState<CascadePreviewState | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>({ mode: "closed" });
  const [viewMode, setViewMode] = useState<"grid" | "gantt">("grid");

  // Impact Engine — absence trigger: a gate's owner is unavailable until a date,
  // so the gate can't complete before then. We force the gate to that date and
  // project the consequence (schedule arm → go-live / cost / confidence).
  const costLines = useEntityStore((s) => s.costLines);
  const { evm } = useProjectEvm();
  const [absMs, setAbsMs] = useState<Milestone | null>(null);
  const [absUntil, setAbsUntil] = useState("");
  const [absAssumptions, setAbsAssumptions] = useState<ImpactAssumptions>({ freezeApplies: true });

  function openAbsence(m: Milestone) {
    setAbsMs(m);
    setAbsUntil(addDays(m.plannedDate, 21) ?? m.plannedDate); // default: back in ~3 weeks
    setAbsAssumptions({ freezeApplies: true });
  }

  // Live settings from M8 — pass through to every domain call so working days,
  // holidays, and RAG thresholds actually drive the schedule.
  const { settings } = useSettings();
  const { workingDays, holidays, ragThresholds } = settings;

  // Scope to current project for cascade + dependency engine
  const projectMilestones = milestones.filter((m) => m.projectId === activeProjectId);
  const domainMilestones = projectMilestones.map(toScheduleMs);
  // F2 — frozen committed go-live (see baseline-store); impact measures against it.
  const committedGoLive = ensureCommitment(activeProjectId, activeProject.goLiveDate).committedGoLive;

  // Impact Engine — project the consequence of the modelled absence. Force the
  // owner's gate to the return date, cascade (go-live unlocked) to learn where
  // go-live lands, then run the consequence (absence perturbation).
  const goLiveId = resolveGoLiveMilestone(
    projectMilestones.map((m) => ({ id: m.id, name: m.name, phase: m.phase, plannedDate: m.plannedDate })),
    activeProject.goLiveDate,
  );
  const goLiveMs = projectMilestones.find((m) => m.id === goLiveId);
  const absConsequence = absMs && absUntil && goLiveId
    ? (() => {
        const forcedNum = toId(absMs.id);
        const glNum = toId(goLiveId);
        // Hold the absent owner's gate AT the return date (lockDate so the
        // cascade can't pull it back to its earliest-allowed slot), and unlock
        // go-live so it's free to move off the forced gate.
        const forced = domainMilestones.map((m) => {
          if (m.id === forcedNum) return { ...m, plannedEnd: absUntil, lockDate: true };
          if (m.id === glNum) return { ...m, lockDate: false };
          return m;
        });
        const r = previewCascade(forced, { id: forcedNum, field: "plannedEnd", value: absUntil }, workingDays, holidays);
        // Only the go-live shift drives the consequence; the chain reads
        // "<gate> → Go-Live" (cosmetic compression of other gates is ignored).
        const goLiveAfter = r.affected.find((a) => `m${a.id}` === goLiveId && (a.newEnd ?? "") > (a.oldEnd ?? ""));
        const pushes = goLiveAfter
          ? [{
              milestoneId: goLiveId,
              milestoneName: goLiveMs?.name,
              oldPlannedDate: goLiveAfter.oldEnd ?? "",
              proposedNewDate: goLiveAfter.newEnd ?? "",
              drivenByTaskId: absMs.id,
              drivenByTaskName: absMs.name,
              daysShifted: goLiveAfter.daysShifted,
            }]
          : [];
        const goLiveProjectedUnlocked = goLiveAfter?.newEnd ?? null;
        return projectConsequence({
          perturbation: { kind: "absence", who: `Owner ${absMs.owner}`, until: absUntil, gateName: absMs.name },
          schedule: { affected: [], milestonePushes: pushes, goLiveProjectedUnlocked },
          baseline: {
            committedGoLive,
            projectStart: activeProject.startDate,
            goLiveMilestoneId: goLiveId,
            goLiveName: goLiveMs?.name,
            goLiveLocked: goLiveMs?.locked ?? false,
          },
          costLines: costLines
            .filter((c) => c.projectId === activeProjectId)
            .map((c) => ({ budgetK: c.budgetK, contractType: c.contractType })),
          snapshot: evm?.snapshot ?? null,
          hardWindows: activeProject.isSample && absAssumptions.freezeApplies !== false ? SAMPLE_HARD_WINDOWS : [],
          tmDayRateOverride: absAssumptions.tmDayRateOverride,
        });
      })()
    : null;

  function recordAbsence() {
    if (!absMs || !absConsequence) return;
    const cq = absConsequence;
    const parts = [`${absMs.owner} away until ${absUntil} (${absMs.name})`];
    if (cq.commitmentBreach) parts.push(cq.goLive.lockedBreach ? `go-live breached +${cq.goLive.workingDaysSlip}d` : `go-live → ${cq.goLive.projected}`);
    if (cq.confidence.moves && cq.confidence.before != null) parts.push(`confidence ${cq.confidence.before}→${cq.confidence.after}`);
    appendAudit(buildAction({
      type: "update", entityKind: "milestone", entityId: absMs.id,
      source: "user-edit", projectId: activeProjectId,
      note: `Modelled owner absence — ${parts.join(" · ")}`,
    }));
    toast.success("Absence impact recorded", { description: absMs.name });
    setAbsMs(null);
  }

  // Apply a planned-date change: M20 selective cascade flow.
  // Drawer's recompute() does the live re-cascade with PM's exclusions/overrides.
  function handlePlannedDateChange(id: string, newDate: string) {
    const numId = toId(id);
    const original = milestones.find((m) => m.id === id);
    if (!original) return;

    // Quick probe: does the edit have any impact at all?
    const probe = previewCascade(
      domainMilestones,
      { id: numId, field: "plannedEnd", value: newDate },
      workingDays,
      holidays
    );

    const projectTasksForCheck = readPersistedTasks()
      .filter((t) => t.projectId === activeProjectId)
      .map<TaskScheduleEntry>((t) => ({
        id: t.id, name: t.name, dueDate: t.dueDate,
        dependsOn: t.dependsOn, milestoneId: t.milestoneId,
      }));
    // M20.3: cross-entity returns both conflicts (rose, action) AND slack (blue, info).
    const taskImpact = previewMilestoneToTaskImpact(
      projectTasksForCheck, id, newDate, workingDays, holidays
    );
    const taskWarnings = taskImpact.conflicts;
    const slackInfo = taskImpact.slack;

    // M20.5 PL-3 — working days, not calendar days
    const daysShifted = workingDaysBetween(
      original.plannedDate, newDate, workingDays, holidays
    );

    if (probe.affected.length === 0 && taskWarnings.length === 0 && slackInfo.length === 0) {
      // No downstream impact — apply directly
      const result = cascade(
        domainMilestones.map((sm) => sm.id === numId ? { ...sm, plannedEnd: newDate } : sm),
        workingDays, holidays
      );
      replaceAllMilestones(applyDomainResult(milestones, result.milestones), { source: "cascade", note: "date edit, no downstream impact" });
      // M20.3: emit info toast about slack gained, if any (positive nudge, not alarm)
      if (slackInfo.length > 0) {
        const total = slackInfo.reduce((s, x) => s + x.slackDays, 0);
        toast.info(`${slackInfo.length} task${(slackInfo.length as number) === 1 ? "" : "s"} gained slack`, {
          description: `${total} working day${total === 1 ? "" : "s"} of headroom — reallocate if useful`,
        });
      } else {
        toast.success("Date updated", { description: original.name });
      }
      return;
    }

    const cp = computeCriticalPath(domainMilestones, workingDays, holidays);
    setCascadePreview({
      editedId: id,
      newPlannedDate: newDate,
      taskWarnings,
      slackInfo,
      criticalIds: cp.criticalIds,
      summary: {
        originatorKind: "milestone",
        originatorId: original.id,
        originatorName: original.name,
        oldDate: original.plannedDate,
        newDate,
        daysShifted,
      },
    });
  }

  // Apply a forecast-date change directly (no cascade — forecast is a projection).
  // M22.1 — when the forecast slips meaningfully past planned, surface a
  // working-day variance nudge so silent saves don't hide schedule drift.
  function handleForecastDateChange(id: string, newDate: string) {
    const target = milestones.find((m) => m.id === id);
    if (!target) return;
    updateMilestone({ ...target, forecastDate: newDate }, { source: "user-inline", note: "forecast edit" });
    const variance = workingDaysBetween(target.plannedDate, newDate, workingDays, holidays);
    if (Math.abs(variance) >= 14) {
      toast.info(
        `Forecast variance ${variance > 0 ? "+" : ""}${variance} working days`,
        { description: `${target.name} now forecasts ${variance > 0 ? "later" : "earlier"} than planned. Review or promote forecast to planned.` }
      );
    }
  }

  function handleLockToggle(id: string) {
    const target = milestones.find((m) => m.id === id);
    if (target) updateMilestone({ ...target, locked: !target.locked }, { source: "user-inline", note: "lock toggle" });
  }

  function handleStatusChange(id: string, status: MilestoneStatus) {
    const target = milestones.find((m) => m.id === id);
    if (target) updateMilestone({ ...target, status }, { source: "user-inline", note: "status cycle" });
  }

  function handleScheduleFromGoLive() {
    const result = scheduleBackward(domainMilestones, activeProject.goLiveDate, workingDays, holidays);
    if (result.error) return;
    const updatedById = new Map(result.milestones.map((sm) => [sm.id, sm]));
    const next = milestones.map((m) => {
      const sm = updatedById.get(toId(m.id));
      return sm ? { ...m, plannedDate: sm.plannedEnd ?? m.plannedDate } : m;
    });
    replaceAllMilestones(next, { source: "system", note: "scheduleBackward from go-live" });
  }

  // Reset is now a no-op pending a proper "reset to seed" feature
  function handleReset() {
    toast.info("Reset disabled — use undo per change instead (coming after M20.2)");
  }

  function handleDrawerSave(m: Milestone) {
    const withProj: Milestone = { ...m, projectId: m.projectId || activeProjectId };
    const existing = milestones.find((x) => x.id === withProj.id);
    const isNew = !existing;

    // M22.1 — new milestones save straight; nothing to cascade from yet
    if (isNew) {
      addMilestone(withProj);
      toast.success("Milestone added", { description: withProj.name });
      setDrawer({ mode: "closed" });
      return;
    }

    // M22.1 — planned-date change from the form drawer must route through the
    // cascade preview just like an inline date edit would. Save non-cascade
    // field changes (name, owner, phase, forecast, etc.) immediately; if the
    // planned date moved, hand off to the cascade preview flow.
    const plannedChanged = existing!.plannedDate !== withProj.plannedDate;
    const forecastChanged = existing!.forecastDate !== withProj.forecastDate;

    if (plannedChanged) {
      // Persist the non-planned-date field updates first so the cascade
      // preview operates on the up-to-date milestone metadata.
      const intermediate: Milestone = { ...withProj, plannedDate: existing!.plannedDate };
      updateMilestone(intermediate, { source: "user-edit", note: "form save (pre-cascade fields)" });
      setDrawer({ mode: "closed" });
      // Trigger the same preview path the inline date edit uses.
      handlePlannedDateChange(withProj.id, withProj.plannedDate);
      return;
    }

    // M22.1 — forecast variance nudge when the slip is large
    updateMilestone(withProj);
    if (forecastChanged) {
      const variance = workingDaysBetween(
        withProj.plannedDate, withProj.forecastDate, workingDays, holidays
      );
      if (Math.abs(variance) >= 14) {
        toast.info(
          `Forecast variance ${variance > 0 ? "+" : ""}${variance} working days`,
          { description: `${withProj.name} now forecasts ${variance > 0 ? "later" : "earlier"} than planned. Review or promote forecast to planned.` }
        );
      } else {
        toast.success("Milestone updated", { description: withProj.name });
      }
    } else {
      toast.success("Milestone updated", { description: withProj.name });
    }
    setDrawer({ mode: "closed" });
  }

  function handleDrawerDelete(id: string) {
    const target = milestones.find((m) => m.id === id);
    deleteMilestoneAction(id);
    toast.success("Milestone deleted", { description: target?.name });
    setDrawer({ mode: "closed" });
  }

  const filtered = milestones
    .filter((m) => m.projectId === activeProjectId)
    .filter((m) => {
      if (filterPhase !== "All" && m.phase !== filterPhase) return false;
      if (filterStatus !== "All" && m.status !== filterStatus) return false;
      if (filterMine && m.owner !== settings.identity.initials) return false;
      return true;
    })
    .slice()
    .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));

  return (
    <div className="space-y-4">
      {/* O8.4 — committed-baseline drift + re-baseline history (visible, governed). */}
      <CommitmentBanner projectId={activeProjectId} currentGoLive={activeProject.goLiveDate} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
        {/* View toggle */}
        <div className="flex rounded-md border border-border bg-background p-0.5">
          {([
            { id: "grid",  label: "Grid",  Icon: LayoutGrid },
            { id: "gantt", label: "Gantt", Icon: GanttChartSquare },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-pressed={viewMode === id}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {phaseOptions.map((p) => <option key={p} value={p}>{p === "All" ? "All phases" : p}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="All">All statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex-1" />

        <button
          onClick={() => setFilterMine((v) => !v)}
          title={filterMine ? "Showing only items owned by you" : "Show only items owned by you"}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
            filterMine
              ? "bg-primary/10 text-primary"
              : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Mine
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <button
          onClick={handleScheduleFromGoLive}
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Calendar className="h-3.5 w-3.5" />
          Schedule from Go-Live
        </button>

        <button
          onClick={() => setDrawer({ mode: "new" })}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Milestone
        </button>
      </div>

      {/* Gantt view (toggle) */}
      {viewMode === "gantt" && (
        <GanttView
          milestones={filtered}
          onEditMilestone={(m) => setDrawer({ mode: "edit", milestone: m })}
        />
      )}

      {/* Grid */}
      {viewMode === "grid" && (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <div className="grid grid-cols-[24px_2fr_1fr_1fr_1fr_64px_80px_80px_32px] gap-0 border-b border-border bg-muted/40 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div />
          <div>Milestone</div>
          <div>Phase</div>
          <div>Planned</div>
          <div>Forecast</div>
          <div className="text-center">Dur</div>
          <div className="text-center">RAG</div>
          <div className="text-center">Dep</div>
          <div />
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No milestones match the current filters.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Milestones turn the project promise into dates leadership can inspect and trust.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Try clearing phase or status filters.</p>
          </div>
        )}

        <ul className="divide-y divide-border">
          {filtered.map((m) => {
            const dm = toScheduleMs(m);
            const rag = computeRAG(dm, TODAY, ragThresholds);
            const dep = computeDependencyStatus(dm, domainMilestones, TODAY);
            const variance = Math.ceil(
              (new Date(m.forecastDate).getTime() - new Date(m.plannedDate).getTime()) / 86_400_000
            );
            const canEdit = m.status !== "complete";

            return (
              <li
                key={m.id}
                data-focus-id={m.id}
                className={cn(
                  "grid grid-cols-[24px_2fr_1fr_1fr_1fr_64px_80px_80px_32px] gap-0 items-center px-5 py-3.5",
                  "hover:bg-muted/20 transition-colors"
                )}
              >
                {/* Status (editable dropdown for non-complete) */}
                <div>
                  <StatusCell
                    value={m.status}
                    editable={!m.locked}
                    onChange={(s) => handleStatusChange(m.id, s)}
                  />
                </div>

                {/* Name + owner — clicking name opens edit drawer */}
                <div className="min-w-0 pl-2">
                  <button
                    onClick={() => setDrawer({ mode: "edit", milestone: m })}
                    className="truncate text-left text-sm font-medium text-foreground hover:text-primary hover:underline"
                    title="Click to edit"
                  >
                    {m.name}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Owner: {m.owner}
                    {m.status !== "complete" && m.id !== goLiveId && (
                      <button
                        onClick={() => openAbsence(m)}
                        className="ml-2 text-[11px] font-medium text-amber-700 hover:underline"
                        title="Model this gate's owner being unavailable and see the delivery impact"
                      >
                        Owner away…
                      </button>
                    )}
                  </p>
                </div>

                {/* Phase */}
                <div className="truncate text-xs text-muted-foreground">{m.phase}</div>

                {/* Planned date (editable) */}
                <div>
                  <DateCell
                    value={m.plannedDate}
                    editable={canEdit && !m.locked}
                    onCommit={(v) => handlePlannedDateChange(m.id, v)}
                    coachmarkAnchor="milestone-planned-date"
                  />
                  {variance !== 0 && (
                    <p className={cn(
                      "mt-0.5 text-[11px] font-semibold tabular-nums",
                      variance > 0 ? "text-rose-600" : "text-emerald-600",
                    )}>
                      {variance > 0 ? `+${variance}d` : `${variance}d`}
                    </p>
                  )}
                </div>

                {/* Forecast date (editable, no cascade) */}
                <div>
                  <DateCell
                    value={m.forecastDate}
                    editable={canEdit && !m.locked}
                    onCommit={(v) => handleForecastDateChange(m.id, v)}
                    coachmarkAnchor="milestone-forecast-date"
                  />
                </div>

                {/* Duration */}
                <div className="text-center text-xs tabular-nums text-muted-foreground">
                  {m.duration ?? 1}d
                </div>

                {/* RAG */}
                <div className="flex justify-center">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", ragBadge[rag])}>
                    {rag}
                  </span>
                </div>

                {/* Dep */}
                <div className="flex justify-center">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", depBadge[dep])}>
                    {dep}
                  </span>
                </div>

                {/* Lock toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleLockToggle(m.id)}
                    title={m.locked ? "Unlock date" : "Lock date"}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {m.locked
                      ? <Lock className="h-3 w-3" />
                      : <Unlock className="h-3 w-3 opacity-30 hover:opacity-80" />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border bg-muted/20 px-5 py-3 text-[11px]">
          <span className="font-semibold text-muted-foreground">RAG:</span>
          {(["Green", "Amber", "Red"] as const).map((r) => (
            <span key={r} className={cn("rounded-full border px-2 py-0.5 font-semibold", ragBadge[r])}>{r}</span>
          ))}
          <span className="mx-1 text-border">·</span>
          <span className="font-semibold text-muted-foreground">Dep:</span>
          {(["Clear", "Waiting", "Blocked"] as const).map((d) => (
            <span key={d} className={cn("rounded-full border px-2 py-0.5 font-semibold", depBadge[d])}>{d}</span>
          ))}
          <span className="mx-1 text-border">·</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Lock className="h-3 w-3" /> Click to toggle lock · click dates to edit
          </span>
        </div>
      </div>
      )}

      {/* M20 — Selective cascade impact drawer */}
      {cascadePreview && (() => {
        const editedNumId = toId(cascadePreview.editedId);

        function runMilestoneCascade(excludeStrings: Set<string>, overridesByString: Record<string, string>) {
          // Convert string IDs ("m6") back to numeric for the engine
          const excludeNums = new Set<number>();
          excludeStrings.forEach((s) => excludeNums.add(toId(s)));
          const overridesNum: Record<number, string> = {};
          Object.entries(overridesByString).forEach(([k, v]) => { overridesNum[toId(k)] = v; });

          return previewCascade(
            domainMilestones,
            { id: editedNumId, field: "plannedEnd", value: cascadePreview!.newPlannedDate },
            { excludeIds: excludeNums, overrides: overridesNum, workingDays, holidays }
          );
        }

        return (
          <ImpactDrawer
            open
            summary={cascadePreview.summary}
            recompute={(excludeIds, overrides) => {
              const r = runMilestoneCascade(excludeIds, overrides);
              // M20.6 — pass phase as `group` for collapsible drawer sub-sections
              const msById = new Map(projectMilestones.map((m) => [toId(m.id), m]));
              const milestonesSection: ImpactSection = {
                kind: "milestones",
                title: "Milestones that will shift",
                rows: r.affected
                  .map((a) => ({
                    id: `m${a.id}`,
                    name: a.name,
                    oldDate: a.oldEnd ?? "—",
                    newDate: a.newEnd ?? "—",
                    daysShifted: a.daysShifted,
                    isCritical: cascadePreview!.criticalIds.has(a.id),
                    group: msById.get(a.id)?.phase,
                  }))
                  .sort((a, b) => (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0)),
              };
              const warningsSection: ImpactSection = {
                kind: "warnings",
                title: "Tasks linked to this milestone now end after its new date",
                rows: cascadePreview!.taskWarnings.map((w) => ({
                  id: w.taskId, name: w.taskName,
                  message: `Task due ${w.taskDue} is after milestone's new ${w.milestoneNewDate}. Review the task's due date.`,
                })),
              };
              // M20.3 — slack created for linked tasks (info-only, blue tone)
              const infoSection: ImpactSection = {
                kind: "info",
                title: "Linked tasks gain slack",
                rows: cascadePreview!.slackInfo.map((s) => ({
                  id: s.taskId, name: s.taskName,
                  oldDate: s.taskDue, newDate: s.milestoneNewDate,
                  slackDays: s.slackDays,
                })),
              };
              return { sections: [milestonesSection, warningsSection, infoSection] };
            }}
            onApply={(excludeIds, overrides) => {
              const r = runMilestoneCascade(excludeIds, overrides);
              // Build the final cascaded milestone list by reusing cascade()
              // with the chosen exclusions/overrides applied to a clone.
              const excludeNums = new Set<number>();
              excludeIds.forEach((s) => excludeNums.add(toId(s)));
              const overridesNum: Record<number, string> = {};
              Object.entries(overrides).forEach(([k, v]) => { overridesNum[toId(k)] = v; });

              const hypothetical = domainMilestones.map((sm) => {
                if (sm.id === editedNumId) {
                  return { ...sm, plannedEnd: cascadePreview!.newPlannedDate };
                }
                if (overridesNum[sm.id] !== undefined) {
                  return { ...sm, plannedEnd: overridesNum[sm.id], lockDate: true };
                }
                if (excludeNums.has(sm.id)) {
                  return { ...sm, lockDate: true };
                }
                return { ...sm };
              });
              const cascadeResult = cascade(hypothetical, workingDays, holidays);
              replaceAllMilestones(applyDomainResult(milestones, cascadeResult.milestones), { source: "cascade", note: "milestone cascade apply" });
              const count = r.affected.length;
              toast.success(
                `${count} milestone${count === 1 ? "" : "s"} shifted`,
                { description: cascadePreview!.summary.originatorName }
              );
              // M20.3 — positive info nudge if linked tasks gained slack
              if (cascadePreview!.slackInfo.length > 0) {
                const total = cascadePreview!.slackInfo.reduce((s, x) => s + x.slackDays, 0);
                toast.info(
                  `${cascadePreview!.slackInfo.length} task${(cascadePreview!.slackInfo.length as number) === 1 ? "" : "s"} gained slack`,
                  { description: `${total} working day${total === 1 ? "" : "s"} of headroom — reallocate if useful` }
                );
              }
              setCascadePreview(null);
            }}
            onCancel={() => setCascadePreview(null)}
          />
        );
      })()}

      {/* Add / Edit drawer — predecessor picker scoped to current project */}
      <MilestoneFormDrawer
        open={drawer.mode !== "closed"}
        initial={drawer.mode === "edit" ? drawer.milestone : null}
        allMilestones={projectMilestones}
        onSave={handleDrawerSave}
        onDelete={handleDrawerDelete}
        onClose={() => setDrawer({ mode: "closed" })}
      />

      <ConsequenceModal
        open={!!absMs}
        title="Owner unavailable — impact"
        subtitle={absMs ? `If ${absMs.owner} can't sign off "${absMs.name}" until they return:` : undefined}
        projection={absConsequence}
        assumptions={absAssumptions}
        onAssumptionsChange={setAbsAssumptions}
        primaryControl={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
            <span className="font-medium text-foreground">Owner back on</span>
            <input
              type="date"
              value={absUntil}
              onChange={(e) => setAbsUntil(e.target.value)}
              className="rounded border border-border bg-background px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        }
        recordLabel="Record this absence"
        onRecord={recordAbsence}
        onClose={() => setAbsMs(null)}
      />
    </div>
  );
}
