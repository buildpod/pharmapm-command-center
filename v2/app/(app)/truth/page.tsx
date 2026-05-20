"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  FileText,
  Gauge,
  GitBranch,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useMemo } from "react";
import { useProject } from "@/components/projects/project-provider";
import { Badge } from "@/components/ui/badge";
import { calculateDeliveryTruth, type DeliveryTruthSignal, type DeliveryTruthTone } from "@/lib/domain/delivery-truth";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toneClasses(tone: DeliveryTruthTone) {
  return {
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-border bg-card text-foreground",
  }[tone];
}

function bandTone(score: number) {
  if (score >= 75) return "emerald";
  if (score >= 55) return "amber";
  return "rose";
}

function signalIcon(signal: DeliveryTruthSignal) {
  switch (signal.kind) {
    case "schedule-drift":
      return CalendarClock;
    case "cost-pressure":
      return DollarSign;
    case "decision-debt":
      return FileText;
    case "readiness-compression":
      return ShieldCheck;
    case "blocked-work":
      return GitBranch;
    case "risk-pressure":
      return AlertTriangle;
  }
}

function sourceHref(kind: DeliveryTruthSignal["sources"][number]["kind"]) {
  return {
    milestone: "/milestones",
    task: "/tasks",
    risk: "/risks",
    document: "/documents",
    cost: "/costs",
  }[kind];
}

export default function DeliveryTruthPage() {
  const { activeProject } = useProject();
  const milestones = useEntityStore((s) => s.milestones);
  const tasks = useEntityStore((s) => s.tasks);
  const risks = useEntityStore((s) => s.risks);
  const documents = useEntityStore((s) => s.documents);
  const costLines = useEntityStore((s) => s.costLines);

  const truth = useMemo(() => calculateDeliveryTruth({
    project: activeProject,
    milestones,
    tasks,
    risks,
    documents,
    costLines,
  }), [activeProject, milestones, tasks, risks, documents, costLines]);

  const confidenceTone = bandTone(truth.confidenceScore);
  const topSignal = truth.signals[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Delivery Truth</h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            The project promise in one view: target date, forecast pressure, budget pressure, delivery blockers, and the next decision that needs leadership attention.
          </p>
        </div>
        <Link
          href="/governance"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Open governance view <ChevronRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={cn("rounded-xl border p-5 shadow-sm", toneClasses(confidenceTone))}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-75">Is the promise still credible?</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-6xl font-bold tabular-nums leading-none">{truth.confidenceScore}</span>
                <span className="pb-2 text-sm font-semibold uppercase tracking-wide">{truth.confidenceBand.replace("-", " ")}</span>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/75">
                {topSignal
                  ? `${topSignal.title}. ${topSignal.nextAction}`
                  : "No major pressure signal is active. Keep the next status cycle focused on preserving the current path."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm md:w-80">
              <div className="rounded-lg border border-current/15 bg-white/45 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Target</p>
                <p className="mt-1 font-semibold">{formatDate(truth.targetDate)}</p>
              </div>
              <div className="rounded-lg border border-current/15 bg-white/45 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Forecast</p>
                <p className="mt-1 font-semibold">{formatDate(truth.forecastDate)}</p>
              </div>
              <div className="rounded-lg border border-current/15 bg-white/45 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Schedule delta</p>
                <p className="mt-1 font-semibold">
                  {truth.scheduleDeltaDays > 0 ? `+${truth.scheduleDeltaDays} days` : truth.scheduleDeltaDays === 0 ? "On target" : `${truth.scheduleDeltaDays} days`}
                </p>
              </div>
              <div className="rounded-lg border border-current/15 bg-white/45 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Budget used</p>
                <p className="mt-1 font-semibold">{truth.budget.burnPct}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Decision Options</p>
          </div>
          <div className="mt-4 space-y-3">
            {truth.decisionOptions.map((option) => (
              <div key={option.id} className={cn("rounded-lg border p-3", toneClasses(option.tone))}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{option.title}</p>
                  <Badge variant="outline" className="shrink-0 border-current/20 bg-white/40 text-[10px]">
                    {option.ownerHint}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-foreground/75">{option.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget</p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">${truth.budget.actualK}k</p>
          <p className="mt-1 text-xs text-muted-foreground">against ${truth.budget.budgetK}k approved</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected Progress</p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{truth.budget.expectedElapsedPct}%</p>
          <p className="mt-1 text-xs text-muted-foreground">of calendar window elapsed</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Signals</p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{truth.signals.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">delivery conditions changing the promise</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence</p>
          <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
            {truth.signals.reduce((sum, signal) => sum + signal.sources.length, 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">traceable source records</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">What Is Changing The Promise</p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            deterministic signals
          </Badge>
        </div>

        {truth.signals.length === 0 ? (
          <div className="flex items-start gap-3 px-5 py-6">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-foreground">No major pressure signal is active.</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The current project data does not show material drift, blocked work, cost pressure, or decision debt.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {truth.signals.map((signal) => {
              const Icon = signalIcon(signal);
              return (
                <article key={signal.id} className="px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-3">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", toneClasses(signal.tone))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold text-foreground">{signal.title}</h2>
                          <Badge variant="outline" className="text-[10px] capitalize">{signal.severity}</Badge>
                          {signal.metric && (
                            <Badge variant="secondary" className="text-[10px]">
                              {signal.metric.label}: {signal.metric.value}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{signal.summary}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          <span className="font-semibold text-foreground">Why it matters:</span> {signal.whyItMatters}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          <span className="font-semibold text-foreground">Next:</span> {signal.nextAction}
                        </p>
                      </div>
                    </div>
                    <div className="lg:w-72">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Trace</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {signal.sources.length ? signal.sources.map((item) => (
                          <Link
                            key={`${item.kind}-${item.id}`}
                            href={sourceHref(item.kind)}
                            className="rounded-full border border-border bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            title={item.label}
                          >
                            {item.kind} · {item.id}
                          </Link>
                        )) : (
                          <span className="text-xs text-muted-foreground">No linked source</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
