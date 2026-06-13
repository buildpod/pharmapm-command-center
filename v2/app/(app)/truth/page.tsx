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
import { StatusPill, statusToneClasses } from "@/components/ui/status-pill";
import { calculateDeliveryTruth, severityDeduction, type DeliveryTruthSignal, type DeliveryTruthTone } from "@/lib/domain/delivery-truth";
import { useProjectEvm } from "@/lib/hooks/use-project-evm";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function bandTone(score: number, ready: boolean): DeliveryTruthTone {
  if (!ready) return "blue";
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

// Short labels for the score arithmetic line (CX-2 D3) — the long signal
// titles don't fit an equation.
const signalShortLabel: Record<DeliveryTruthSignal["kind"], string> = {
  "schedule-drift": "schedule",
  "cost-pressure": "cost",
  "decision-debt": "approvals",
  "readiness-compression": "readiness",
  "blocked-work": "blocked work",
  "risk-pressure": "risk",
};

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

  // Phase-2: same EVM computation as the dashboard verdict (shared hook) —
  // the confidence shown here IS the dashboard number, explained by signals.
  const { evm } = useProjectEvm();
  const truth = useMemo(() => calculateDeliveryTruth({
    project: activeProject,
    milestones,
    tasks,
    risks,
    documents,
    costLines,
    evm: evm?.snapshot,
  }), [activeProject, milestones, tasks, risks, documents, costLines, evm]);

  const confidenceTone = bandTone(truth.confidenceScore, truth.coverage.isReady);
  const topSignal = truth.signals[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Delivery Signals</h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Delivery Signals is the evidence layer behind the SteerCo brief: it checks whether the project promise is credible by looking at schedule drift, budget pressure, blocked work, decision debt, readiness compression, and open risks.
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
        <div className={cn("rounded-xl border p-5 shadow-sm", statusToneClasses[confidenceTone].panel)} data-tour-id="truth-score">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-75">Is the promise still credible?</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-6xl font-bold tabular-nums leading-none">{truth.coverage.isReady ? truth.confidenceScore : "—"}</span>
                <span className="pb-2 text-sm font-semibold uppercase tracking-wide">{truth.confidenceBand.replace("-", " ")}</span>
              </div>
              {truth.coverage.isReady && truth.evmGrounded && evm && (
                <p className="mt-2 text-xs tabular-nums opacity-75">
                  {`40 × cost efficiency (${Math.min(evm.snapshot.cpi, 1).toFixed(2)}) + 40 × schedule pace (${Math.min(evm.snapshot.spit, 1).toFixed(2)}) + 20 × forecast headroom (${(1 - Math.min(Math.max(0, evm.snapshot.bac > 0 ? evm.snapshot.eac2 / evm.snapshot.bac - 1 : 0), 1)).toFixed(2)}) = ${truth.confidenceScore}`}
                </p>
              )}
              {truth.coverage.isReady && !truth.evmGrounded && truth.signals.length > 0 && (
                <p className="mt-2 text-xs tabular-nums opacity-75">
                  {`100 ${truth.signals
                    .map((signal) => `− ${severityDeduction[signal.severity]} (${signalShortLabel[signal.kind]})`)
                    .join(" ")} = ${truth.confidenceScore}`}
                </p>
              )}
              <p className="mt-3 max-w-xl text-sm leading-6 opacity-90">
                {!truth.coverage.isReady
                  ? "Delivery Signals needs a basic plan before it can judge the promise. Finish setup or import a plan first."
                  : topSignal
                  ? `${topSignal.title}. ${topSignal.nextAction}`
                  : "No major pressure signal is active. Keep the next status cycle focused on preserving the current path."}
              </p>
              {!truth.coverage.isReady && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/setup" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                    Finish setup
                  </Link>
                  <Link href="/plan" className="rounded-md border border-current/20 px-3 py-1.5 text-xs font-semibold hover:bg-background/50">
                    Review plan
                  </Link>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm md:w-80">
              <div className={cn("rounded-lg border p-3", statusToneClasses[confidenceTone].metric)}>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Target</p>
                <p className="mt-1 font-semibold">{formatDate(truth.targetDate)}</p>
              </div>
              <div className={cn("rounded-lg border p-3", statusToneClasses[confidenceTone].metric)}>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Forecast</p>
                <p className="mt-1 font-semibold">{truth.coverage.isReady ? formatDate(truth.forecastDate) : "Needs plan"}</p>
              </div>
              <div className={cn("rounded-lg border p-3", statusToneClasses[confidenceTone].metric)}>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Schedule delta</p>
                <p className="mt-1 font-semibold">
                  {!truth.coverage.isReady ? "Needs milestones" : truth.scheduleDeltaDays > 0 ? `+${truth.scheduleDeltaDays} days` : truth.scheduleDeltaDays === 0 ? "On target" : `${truth.scheduleDeltaDays} days`}
                </p>
              </div>
              <div className={cn("rounded-lg border p-3", statusToneClasses[confidenceTone].metric)}>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Budget used</p>
                <p className="mt-1 font-semibold">{truth.coverage.isReady ? `${truth.budget.burnPct}%` : "Needs budget"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm" data-tour-id="truth-actions">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Decision Options</p>
          </div>
          <div className="mt-4 space-y-3">
            {truth.decisionOptions.map((option) => (
              <div key={option.id} className={cn("rounded-lg border p-3", statusToneClasses[option.tone].pill)}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{option.title}</p>
                  <Badge variant="outline" className="shrink-0 border-current/25 bg-background/70 text-[10px]">
                    {option.ownerHint}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-5 opacity-85">{option.summary}</p>
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

      <section className="rounded-xl border border-border bg-card shadow-sm" data-tour-id="truth-trace">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">What Is Changing The Promise</p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            deterministic signals
          </Badge>
        </div>

        {!truth.coverage.isReady ? (
          <div className="flex items-start gap-3 px-5 py-6">
            <Target className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-foreground">Delivery Signals is not ready yet.</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add enough project structure before trusting delivery confidence.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {truth.coverage.reasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : truth.signals.length === 0 ? (
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
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", statusToneClasses[signal.tone].pill)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold text-foreground">{signal.title}</h2>
                          <StatusPill tone={signal.tone}>{signal.severity}</StatusPill>
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
                            href={`${sourceHref(item.kind)}?focus=${encodeURIComponent(item.id)}`}
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
