"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Shield, CheckCircle2, ArrowUpRight, Plus } from "lucide-react";
import { type Risk, type RiskStatus } from "@/lib/mockData";
import { RiskFormDrawer } from "./risk-form";
import { useProject } from "@/components/projects/project-provider";
import { StatusPill, statusToneClasses, type StatusTone } from "@/components/ui/status-pill";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";
import { avatarColor } from "@/lib/ui/avatar-color";
import { useFocusRow } from "@/lib/hooks/use-focus-row";
import { useCurrentUser } from "@/lib/settingsStore";

// ─── Score bands (from v1 config/rules.js) ───────────────────────────────────

type Band = "high" | "medium" | "low";

function scoreBand(score: number): Band {
  if (score >= 15) return "high";
  if (score >= 8)  return "medium";
  return "low";
}

const bandTone: Record<Band, StatusTone> = {
  high: "rose",
  medium: "amber",
  low: "emerald",
};

const bandLabel: Record<Band, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const statusTone: Record<RiskStatus, StatusTone> = {
  open: "rose",
  mitigated: "blue",
  closed: "slate",
};

const statusIcon: Record<RiskStatus, typeof AlertTriangle> = {
  open:      AlertTriangle,
  mitigated: Shield,
  closed:    CheckCircle2,
};

const nextStatus: Record<RiskStatus, RiskStatus> = {
  open: "mitigated",
  mitigated: "closed",
  closed: "open",
};

// ─── Cell gradient by score band ─────────────────────────────────────────────

function cellShade(p: number, i: number) {
  const s = p * i;
  if (s >= 15) return "bg-gradient-to-br from-rose-50    to-rose-100    border-rose-200";
  if (s >= 8)  return "bg-gradient-to-br from-amber-50   to-amber-100   border-amber-200";
  if (s >= 4)  return "bg-gradient-to-br from-yellow-50  to-yellow-100  border-yellow-200";
  return         "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200";
}

// ─── Risk Exposure Matrix ────────────────────────────────────────────────────

function RiskMatrix({
  risks,
  selectedId,
  onSelect,
}: {
  risks: Risk[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const cells: Record<string, Risk[]> = {};
  risks.forEach((r) => {
    const key = `${r.probability}-${r.impact}`;
    (cells[key] ||= []).push(r);
  });

  const bandCounts = {
    high:   risks.filter((r) => scoreBand(r.score) === "high").length,
    medium: risks.filter((r) => scoreBand(r.score) === "medium").length,
    low:    risks.filter((r) => scoreBand(r.score) === "low").length,
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Risk Exposure</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Probability × impact heatmap. Cells show exposure count; dots jump to the risk detail.
        </p>
      </div>

      {/* Band summary */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {(["high", "medium", "low"] as const).map((b) => (
          <div key={b} className={cn("rounded-lg border px-3 py-2", statusToneClasses[bandTone[b]].pill)}>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{bandLabel[b]}</p>
            <p className="text-xl font-bold tabular-nums leading-tight">{bandCounts[b]}</p>
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="flex items-start gap-2">
        {/* Y-axis */}
        <div className="flex flex-col gap-1">
          {[5, 4, 3, 2, 1].map((i) => (
            <div key={i} className="flex h-14 w-4 items-center justify-end sm:h-16">
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{i}</span>
            </div>
          ))}
        </div>

        {/* Grid + X-axis */}
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-5 gap-1">
            {[5, 4, 3, 2, 1].flatMap((impact) =>
              [1, 2, 3, 4, 5].map((prob) => {
                const key = `${prob}-${impact}`;
                const cellRisks = cells[key] ?? [];
                const visibleRisks = cellRisks.slice(0, 5);
                const hiddenCount = Math.max(0, cellRisks.length - visibleRisks.length);
                return (
                  <div
                    key={key}
                    title={`Probability ${prob} × impact ${impact} = score ${prob * impact}`}
                    className={cn(
                      "relative flex h-14 items-center justify-center overflow-hidden rounded-md border p-1 sm:h-16",
                      cellShade(prob, impact),
                    )}
                  >
                    <span className="absolute left-1.5 top-1 text-[10px] font-semibold tabular-nums text-muted-foreground/45">
                      {prob * impact}
                    </span>
                    {cellRisks.length > 0 ? (
                      <span className="absolute right-1 top-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-foreground shadow-sm">
                        {cellRisks.length}
                      </span>
                    ) : null}
                    <div className="flex max-w-[3.25rem] flex-wrap items-center justify-center gap-1">
                      {visibleRisks.map((r) => {
                        const band = scoreBand(r.score);
                        const sel = r.id === selectedId;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => onSelect(r.id)}
                            title={`${r.title} · P${r.probability} × I${r.impact}`}
                            className={cn(
                              "h-2.5 w-2.5 rounded-full shadow-sm transition-transform hover:scale-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                              statusToneClasses[bandTone[band]].dot,
                              sel && cn("scale-125 ring-2 ring-offset-1", statusToneClasses[bandTone[band]].ring),
                            )}
                            aria-label={`Open risk: ${r.title}`}
                          />
                        );
                      })}
                      {hiddenCount > 0 ? (
                        <span className="rounded-full bg-background/90 px-1 text-[9px] font-bold tabular-nums text-muted-foreground shadow-sm">
                          +{hiddenCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* X-axis */}
          <div className="mt-1 grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((p) => (
              <div key={p} className="text-center text-[10px] font-semibold tabular-nums text-muted-foreground">{p}</div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>↑ Impact</span>
            <span>Probability →</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 space-y-1.5 border-t border-border pt-4">
        {(["high", "medium", "low"] as const).map((b) => (
          <div key={b} className="flex items-center gap-2 text-xs">
            <span className={cn("h-2.5 w-2.5 rounded-full", statusToneClasses[bandTone[b]].dot)} />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{bandLabel[b]}</span>
              {b === "high" ? " — score ≥ 15"
                : b === "medium" ? " — score 8–14"
                : " — score < 8"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk card ───────────────────────────────────────────────────────────────

function RiskCard({
  risk,
  selected,
  onSelect,
  onStatusToggle,
  onEdit,
}: {
  risk: Risk;
  selected: boolean;
  onSelect: () => void;
  onStatusToggle: () => void;
  onEdit: () => void;
}) {
  const band = scoreBand(risk.score);
  const StatusIcon = statusIcon[risk.status];

  return (
    <article
      id={`risk-${risk.id}`}
      data-focus-id={risk.id}
      onClick={onSelect}
      className={cn(
        "group cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        selected
          ? cn("ring-2 ring-offset-2", statusToneClasses[bandTone[band]].ring, "border-transparent")
          : "border-border",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Score block */}
        <div className={cn(
          "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border",
          statusToneClasses[bandTone[band]].pill,
        )}>
          <span className="text-xl font-bold leading-none tabular-nums">{risk.score}</span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider opacity-70">
            {bandLabel[band]}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-left text-sm font-semibold leading-snug text-foreground hover:text-primary hover:underline"
              title="Click to edit"
            >
              {risk.title}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onStatusToggle(); }}
              title={`Click to mark ${nextStatus[risk.status]}`}
              className="flex shrink-0 transition-opacity hover:opacity-80"
            >
              <StatusPill tone={statusTone[risk.status]}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
              </StatusPill>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>
              P<span className="font-semibold text-foreground tabular-nums">{risk.probability}</span>
              <span className="mx-0.5">×</span>
              I<span className="font-semibold text-foreground tabular-nums">{risk.impact}</span>
            </span>
            <span className="text-border">·</span>
            <span>{risk.category}</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1.5">
              Owner
              <span className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
                avatarColor(risk.owner),
              )}>
                {risk.owner}
              </span>
            </span>
          </div>

          <div className="rounded-md border-l-2 border-blue-300 bg-blue-50/40 dark:bg-blue-950/20 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Mitigation</p>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground">{risk.mitigation}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Main grid ───────────────────────────────────────────────────────────────

type SortKey = "score" | "probability" | "impact";
type RiskDrawerState = { mode: "closed" } | { mode: "new" } | { mode: "edit"; risk: Risk };

export function RisksGrid() {
  const { activeProjectId } = useProject();
  useFocusRow();
  const me = useCurrentUser();
  const risks            = useEntityStore((s) => s.risks);
  const addRisk          = useEntityStore((s) => s.addRisk);
  const updateRisk       = useEntityStore((s) => s.updateRisk);
  const deleteRiskAction = useEntityStore((s) => s.deleteRisk);
  const [filterStatus, setFilterStatus] = useState<RiskStatus | "All">("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMine, setFilterMine] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<RiskDrawerState>({ mode: "closed" });

  const projectRisks  = risks.filter((r) => r.projectId === activeProjectId);
  const allCategories = Array.from(new Set(projectRisks.map((r) => r.category)));

  function handleStatusToggle(id: string) {
    const target = risks.find((r) => r.id === id);
    if (target) updateRisk({ ...target, status: nextStatus[target.status] }, { source: "user-inline", note: "status cycle" });
  }

  function handleSelectFromMatrix(id: string) {
    setSelectedId(id);
    setTimeout(() => {
      document.getElementById(`risk-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function handleDrawerSave(r: Risk) {
    const withProj: Risk = { ...r, projectId: r.projectId || activeProjectId };
    const exists = risks.some((x) => x.id === withProj.id);
    if (exists) {
      updateRisk(withProj);
      toast.success("Risk updated", { description: withProj.title });
    } else {
      addRisk(withProj);
      toast.success("Risk added", { description: withProj.title });
    }
    setDrawer({ mode: "closed" });
  }
  function handleDrawerDelete(id: string) {
    const target = risks.find((r) => r.id === id);
    deleteRiskAction(id);
    toast.success("Risk deleted", { description: target?.title });
    setDrawer({ mode: "closed" });
  }

  const filtered = projectRisks
    .filter((r) => filterStatus === "All" || r.status === filterStatus)
    .filter((r) => filterCategory === "All" || r.category === filterCategory)
    .filter((r) => !filterMine || r.owner === me.initials)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const counts = {
    All:       projectRisks.length,
    open:      projectRisks.filter((r) => r.status === "open").length,
    mitigated: projectRisks.filter((r) => r.status === "mitigated").length,
    closed:    projectRisks.filter((r) => r.status === "closed").length,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
      {/* Matrix — sticky on desktop, scoped to active project */}
      <div className="self-start lg:sticky lg:top-4">
        <RiskMatrix risks={projectRisks} selectedId={selectedId} onSelect={handleSelectFromMatrix} />
      </div>

      {/* Right column */}
      <div className="min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
          {(["All", "open", "mitigated", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                filterStatus === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1 opacity-70 tabular-nums">{counts[s]}</span>
            </button>
          ))}

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

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="All">All categories</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="score">Sort by Score</option>
            <option value="probability">Sort by Probability</option>
            <option value="impact">Sort by Impact</option>
          </select>

          <button
            onClick={() => setDrawer({ mode: "new" })}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Risk
          </button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No risks match the current filters.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A clean risk view helps the PM focus leadership attention on the exceptions that matter.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Try selecting &ldquo;All&rdquo; or a different category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <RiskCard
                key={r.id}
                risk={r}
                selected={r.id === selectedId}
                onSelect={() => setSelectedId(r.id)}
                onStatusToggle={() => handleStatusToggle(r.id)}
                onEdit={() => setDrawer({ mode: "edit", risk: r })}
              />
            ))}
          </div>
        )}

        <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          <ArrowUpRight className="h-3 w-3" />
          Click a risk dot in the matrix to highlight its card · click a status badge to cycle · click title to edit
        </p>
      </div>

      <RiskFormDrawer
        open={drawer.mode !== "closed"}
        initial={drawer.mode === "edit" ? drawer.risk : null}
        allRisks={projectRisks}
        knownCategories={allCategories}
        onSave={handleDrawerSave}
        onDelete={handleDrawerDelete}
        onClose={() => setDrawer({ mode: "closed" })}
      />
    </div>
  );
}
