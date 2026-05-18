"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, Clock, Milestone,
  FileText, CheckCircle2, Circle, AlertCircle, ArrowUpRight, ChevronRight,
  ListChecks, ShieldCheck, UsersRound, UserCheck, ClipboardCheck, Database,
} from "lucide-react";
import {
  getKpis, budgetTrend, riskTrend,
  type Document, type Milestone as ProjectMilestone, type Risk, type Task,
} from "@/lib/mockData";
import { PhaseProgress } from "@/components/dashboard/phase-progress";
import { Sparkline } from "@/components/dashboard/sparkline";
import { ProjectHealth } from "@/components/dashboard/project-health";
import { CharterCard } from "@/components/dashboard/charter-card";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Per-person avatar color (Linear/Notion pattern)
const AVATAR_COLORS = [
  "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-fuchsia-500", "bg-pink-500",
];
function avatarColor(initials: string) {
  const hash = initials.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const statusIcon = {
  "complete":    { icon: CheckCircle2, cls: "text-emerald-600" },
  "in-progress": { icon: Circle,       cls: "text-blue-600"    },
  "at-risk":     { icon: AlertCircle,  cls: "text-rose-600"    },
  "pending":     { icon: Circle,       cls: "text-muted-foreground" },
} as const;

type RoleId = "junior-pm" | "senior-pm" | "workstream" | "qa" | "data" | "sponsor";

const roleGuides: Record<RoleId, {
  label: string;
  eyebrow: string;
  summary: string;
  focus: string[];
  workstream?: string;
  Icon: typeof ListChecks;
}> = {
  "junior-pm": {
    label: "Junior PM",
    eyebrow: "guided run mode",
    summary: "Start with the safest next actions, then escalate anything that needs senior judgement.",
    focus: ["Today’s actions", "Blocked tasks", "Decision follow-up", "Escalation notes"],
    Icon: ListChecks,
  },
  "senior-pm": {
    label: "Senior PM",
    eyebrow: "control mode",
    summary: "Watch schedule risk, governance readiness, cross-workstream dependency pressure, and budget signal.",
    focus: ["Schedule risk", "Critical path", "High risks", "SteerCo readiness"],
    Icon: ShieldCheck,
  },
  workstream: {
    label: "Workstream Lead",
    eyebrow: "execution mode",
    summary: "Keep your stream unblocked and make upcoming handoffs visible before they threaten the plan.",
    focus: ["My workstream", "Upcoming due dates", "Blocked handoffs", "Dependency notes"],
    workstream: "Configuration",
    Icon: UsersRound,
  },
  qa: {
    label: "QA / Validation",
    eyebrow: "evidence mode",
    summary: "Track validation work, review pressure, and any task that could affect CSV evidence readiness.",
    focus: ["Validation tasks", "Review items", "Protocol readiness", "UAT blockers"],
    workstream: "Validation",
    Icon: ClipboardCheck,
  },
  data: {
    label: "Data Migration",
    eyebrow: "migration mode",
    summary: "Focus on extraction, cleansing, dry-run, reconciliation, and migration risks.",
    focus: ["Migration tasks", "Data risks", "Dry-run readiness", "Reconciliation"],
    workstream: "Data Migration",
    Icon: Database,
  },
  sponsor: {
    label: "Sponsor / SteerCo",
    eyebrow: "decision mode",
    summary: "See the project health story, decisions required, escalations, and go-live confidence.",
    focus: ["Decisions", "Escalations", "Go-live confidence", "Budget and risk"],
    Icon: UserCheck,
  },
};

interface TodayAction {
  id: string;
  title: string;
  detail: string;
  next: string;
  href: string;
  tone: "rose" | "amber" | "blue" | "emerald" | "slate";
  tag: string;
  Icon: typeof AlertTriangle;
}

const actionTone: Record<TodayAction["tone"], string> = {
  rose: "border-rose-200 bg-rose-50/70 text-rose-800",
  amber: "border-amber-200 bg-amber-50/70 text-amber-800",
  blue: "border-blue-200 bg-blue-50/70 text-blue-800",
  emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
  slate: "border-slate-200 bg-slate-50/70 text-slate-700",
};

const TODAY = "2026-05-18";

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - new Date(TODAY).getTime()) / 86_400_000);
}

function buildTodayActions(
  role: RoleId,
  data: {
    tasks: Task[];
    milestones: ProjectMilestone[];
    risks: Risk[];
    documents: Document[];
    scheduleVariance: number;
    openRisksCount: number;
    daysToGoLive: number;
  }
): TodayAction[] {
  const guide = roleGuides[role];
  const roleWorkstream = guide.workstream;
  const roleTasks = roleWorkstream
    ? data.tasks.filter((task) => task.workstream === roleWorkstream)
    : data.tasks;
  const blockedTasks = roleTasks.filter((task) => task.status === "Blocked");
  const dueSoonTasks = roleTasks
    .filter((task) => task.status !== "Complete" && daysUntil(task.dueDate) <= 14)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const waitingMilestones = data.milestones
    .filter((milestone) => milestone.status === "at-risk" || milestone.forecastDate > milestone.plannedDate)
    .sort((a, b) => b.forecastDate.localeCompare(a.forecastDate));
  const highRisks = data.risks
    .filter((risk) => risk.status === "open" && risk.score >= 15)
    .sort((a, b) => b.score - a.score);
  const roleRisks = roleWorkstream
    ? data.risks.filter((risk) => risk.status === "open" && risk.owner === roleOwnerForWorkstream(roleWorkstream))
    : data.risks.filter((risk) => risk.status === "open");
  const pendingDocs = data.documents
    .filter((doc) => doc.status === "in-review")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const validationDocs = data.documents
    .filter((doc) => doc.phase === "Validation" && doc.status !== "approved")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const actions: TodayAction[] = [];

  if (role === "sponsor") {
    actions.push({
      id: "sponsor-decision",
      title: `${pendingDocs.length} decision pack${pendingDocs.length === 1 ? "" : "s"} need attention`,
      detail: pendingDocs[0]
        ? `${pendingDocs[0].name} is the next document waiting for review or sign-off.`
        : "No decision pack is waiting right now. Review the latest weekly status instead.",
      next: pendingDocs[0] ? "Review decisions" : "Open reports",
      href: pendingDocs[0] ? "/documents" : "/reports",
      tone: pendingDocs[0] ? "amber" : "emerald",
      tag: "governance",
      Icon: FileText,
    });
    actions.push({
      id: "sponsor-risk",
      title: highRisks[0] ? `${highRisks[0].title}` : "No high risk is open",
      detail: highRisks[0]
        ? `Score ${highRisks[0].score}. PM should confirm mitigation: ${highRisks[0].mitigation}.`
        : `${data.openRisksCount} lower-priority risk${data.openRisksCount === 1 ? "" : "s"} remain open.`,
      next: highRisks[0] ? "Open risk" : "Review risks",
      href: "/risks",
      tone: highRisks[0] ? "rose" : "blue",
      tag: "escalation",
      Icon: AlertTriangle,
    });
    actions.push({
      id: "sponsor-golive",
      title: `${data.daysToGoLive} days to go-live`,
      detail: data.scheduleVariance > 0
        ? `Schedule is showing +${data.scheduleVariance} days variance. Ask for recovery options.`
        : "Schedule is not showing a forward variance on the next milestone.",
      next: "Check milestones",
      href: "/milestones",
      tone: data.scheduleVariance > 0 ? "amber" : "emerald",
      tag: "go-live",
      Icon: Clock,
    });
    return actions;
  }

  if (role === "qa") {
    actions.push({
      id: "qa-validation",
      title: validationDocs[0] ? `${validationDocs.length} validation document${validationDocs.length === 1 ? "" : "s"} open` : "Validation documents are calm",
      detail: validationDocs[0]
        ? `${validationDocs[0].name} is due ${formatDate(validationDocs[0].dueDate)}.`
        : "No validation document needs immediate attention.",
      next: "Open validation docs",
      href: "/documents",
      tone: validationDocs[0] ? "amber" : "emerald",
      tag: "evidence",
      Icon: ClipboardCheck,
    });
  }

  if (blockedTasks.length > 0) {
    actions.push({
      id: "blocked-task",
      title: `${blockedTasks.length} blocked task${blockedTasks.length === 1 ? "" : "s"}`,
      detail: `${blockedTasks[0].name} is blocked. Check owner, upstream work, and whether escalation is needed.`,
      next: "Open tasks",
      href: "/tasks",
      tone: "rose",
      tag: "blocker",
      Icon: AlertTriangle,
    });
  } else if (dueSoonTasks.length > 0) {
    actions.push({
      id: "due-soon",
      title: `${dueSoonTasks.length} task${dueSoonTasks.length === 1 ? "" : "s"} due soon`,
      detail: `${dueSoonTasks[0].name} is due ${formatDate(dueSoonTasks[0].dueDate)}.`,
      next: "Review tasks",
      href: "/tasks",
      tone: "amber",
      tag: "execution",
      Icon: ListChecks,
    });
  }

  if (waitingMilestones.length > 0) {
    actions.push({
      id: "schedule-risk",
      title: `${waitingMilestones.length} milestone${waitingMilestones.length === 1 ? "" : "s"} need schedule review`,
      detail: `${waitingMilestones[0].name} has shifted from ${formatDate(waitingMilestones[0].plannedDate)} to ${formatDate(waitingMilestones[0].forecastDate)}.`,
      next: "Review schedule",
      href: "/milestones",
      tone: data.scheduleVariance > 0 ? "amber" : "blue",
      tag: "schedule",
      Icon: Milestone,
    });
  }

  if (role === "data" || role === "senior-pm" || role === "junior-pm") {
    const risk = role === "data" ? roleRisks[0] : highRisks[0];
    actions.push({
      id: "risk-focus",
      title: risk ? risk.title : "Risk log is ready for review",
      detail: risk
        ? `Owner ${risk.owner}. Next check: confirm mitigation is still enough.`
        : "No high-priority risk is open for this role.",
      next: "Open risks",
      href: "/risks",
      tone: risk?.score && risk.score >= 15 ? "rose" : risk ? "amber" : "emerald",
      tag: "risk",
      Icon: AlertTriangle,
    });
  }

  if (pendingDocs.length > 0 && role !== "data") {
    actions.push({
      id: "decision-follow-up",
      title: `${pendingDocs.length} document${pendingDocs.length === 1 ? "" : "s"} waiting for decisions`,
      detail: `${pendingDocs[0].name} has pending reviewers or approvers.`,
      next: "Follow up",
      href: "/documents",
      tone: "amber",
      tag: "decision",
      Icon: FileText,
    });
  }

  if (actions.length < 3) {
    actions.push({
      id: "report-ready",
      title: "Prepare the next status story",
      detail: "Generate the weekly or SteerCo view so stakeholders see the same plan, risks, and decisions.",
      next: "Open reports",
      href: "/reports",
      tone: "blue",
      tag: "reporting",
      Icon: FileText,
    });
  }

  return actions.slice(0, 3);
}

function roleOwnerForWorkstream(workstream: string) {
  if (workstream === "Validation") return "QA";
  if (workstream === "Data Migration") return "AR";
  if (workstream === "Configuration") return "KM";
  if (workstream === "Training") return "HR";
  return "VP";
}

// ─── KPI card ───────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, Icon, tone = "neutral", trend,
}: {
  label: string;
  value: string | number;
  sub: string;
  Icon: typeof TrendingUp;
  tone?: "neutral" | "good" | "warn" | "bad";
  trend?: "up" | "down" | "flat";
}) {
  const toneStyles = {
    neutral: { value: "text-foreground",     icon: "text-muted-foreground", chipBg: "bg-muted text-muted-foreground" },
    good:    { value: "text-emerald-600",    icon: "text-emerald-500",      chipBg: "bg-emerald-50 text-emerald-700" },
    warn:    { value: "text-amber-600",      icon: "text-amber-500",        chipBg: "bg-amber-50 text-amber-700"     },
    bad:     { value: "text-rose-600",       icon: "text-rose-500",         chipBg: "bg-rose-50 text-rose-700"       },
  };
  const t = toneStyles[tone];

  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t.chipBg)}>
          <Icon className={cn("h-4 w-4", t.icon)} />
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className={cn("text-3xl font-bold tabular-nums leading-none", t.value)}>{value}</p>
        {trend && (
          <span className={cn("flex items-center text-xs font-semibold",
            trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground"
          )}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { activeProjectId, activeProject } = useProject();
  const tasks = useEntityStore((s) => s.tasks).filter((t) => t.projectId === activeProjectId);
  const milestones = useEntityStore((s) => s.milestones).filter((m) => m.projectId === activeProjectId);
  const risks = useEntityStore((s) => s.risks).filter((r) => r.projectId === activeProjectId);
  const documents = useEntityStore((s) => s.documents).filter((d) => d.projectId === activeProjectId);
  const kpis = getKpis(activeProjectId);
  const [role, setRole] = useState<RoleId>("junior-pm");
  const roleGuide = roleGuides[role];
  const scheduleOnTrack = kpis.scheduleVariance <= 0;
  const varianceLabel = kpis.scheduleVariance === 0
    ? "On schedule"
    : kpis.scheduleVariance > 0
    ? `+${kpis.scheduleVariance} day variance`
    : `${kpis.scheduleVariance} day ahead`;
  const actions = buildTodayActions(role, {
    tasks,
    milestones,
    risks,
    documents,
    scheduleVariance: kpis.scheduleVariance,
    openRisksCount: kpis.openRisksCount,
    daysToGoLive: kpis.daysToGoLive,
  });

  return (
    <div className="space-y-8">
      {/* Header — context from the active project */}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Project Command Center</h1>
          <p className="text-sm text-muted-foreground">
            {activeProject.name} · {activeProject.phase} · Go-Live target {activeProject.goLiveDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(roleGuides) as RoleId[]).map((id) => {
            const guide = roleGuides[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  role === id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {guide.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Role-guided command layer */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.6fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <roleGuide.Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{roleGuide.eyebrow}</p>
              <h2 className="mt-0.5 text-lg font-semibold text-foreground">{roleGuide.label}</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{roleGuide.summary}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {roleGuide.focus.map((item) => (
              <span key={item} className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Today’s Actions</p>
              <p className="text-[11px] text-muted-foreground">Recommended next steps for the selected role.</p>
            </div>
          </div>
          <div className="grid gap-2 p-3 md:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className={cn(
                  "group flex min-h-[148px] flex-col rounded-lg border p-3 transition-shadow hover:shadow-sm",
                  actionTone[action.tone]
                )}
              >
                <div className="flex items-start gap-2">
                  <action.Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{action.tag}</p>
                    <p className="mt-0.5 text-sm font-semibold leading-5">{action.title}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-foreground/75">{action.detail}</p>
                <p className="mt-auto flex items-center gap-1 pt-3 text-[11px] font-semibold">
                  {action.next}
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Schedule Health"
          value={scheduleOnTrack ? "On Track" : "At Risk"}
          sub={varianceLabel}
          Icon={scheduleOnTrack ? TrendingUp : TrendingDown}
          tone={scheduleOnTrack ? "good" : "bad"}
        />
        <KpiCard
          label="Open Risks"
          value={kpis.openRisksCount}
          sub={`${kpis.highRisks} high · ${kpis.medRisks} medium`}
          Icon={AlertTriangle}
          tone={kpis.highRisks > 0 ? "bad" : kpis.medRisks > 0 ? "warn" : "good"}
        />
        <KpiCard
          label="Budget Utilised"
          value={`${kpis.budgetPct}%`}
          sub={`$${(kpis.latestActualK / 1000).toFixed(2)}M of $${(kpis.totalBudgetK / 1000).toFixed(1)}M`}
          Icon={DollarSign}
          tone={kpis.budgetPct >= 85 ? "bad" : kpis.budgetPct >= 60 ? "warn" : "neutral"}
        />
        <KpiCard
          label="Days to Go-Live"
          value={kpis.daysToGoLive}
          sub={`Target ${activeProject.goLiveDate}`}
          Icon={Clock}
          tone="neutral"
        />
      </div>

      {/* Phase progress + Project health + Charter card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <PhaseProgress />
        <div className="space-y-4">
          <ProjectHealth />
          <CharterCard />
        </div>
      </div>

      {/* Sparkline cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Risk Profile</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Open risks per month</p>
            </div>
            <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
              {riskTrend.at(-1)?.open ?? 0} open
            </span>
          </div>
          <Sparkline data={riskTrend} dataKey="open" color="#f59e0b" gradientId="riskGrad" label="Open risks" />
          <div className="mt-1 flex gap-2">
            {riskTrend.map((d) => (
              <div key={d.month} className="flex-1 text-center">
                <p className="text-[10px] font-medium text-muted-foreground">{d.month}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Budget Burn</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Cumulative $k spent</p>
            </div>
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              ${budgetTrend.filter((d) => d.actual > 0).at(-1)?.actual ?? 0}k
            </span>
          </div>
          <Sparkline data={budgetTrend.filter((d) => d.actual > 0)} dataKey="actual" color="#3b82f6" gradientId="budgetGrad" label="Actual $k" />
          <div className="mt-1 flex gap-2">
            {budgetTrend.filter((d) => d.actual > 0).map((d) => (
              <div key={d.month} className="flex-1 text-center">
                <p className="text-[10px] font-medium text-muted-foreground">{d.month}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming milestones + decisions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upcoming milestones */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <Milestone className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Upcoming Milestones</p>
            <Link href="/milestones" className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {kpis.upcomingMilestones.map((m) => {
              const { icon: Icon, cls } = statusIcon[m.status];
              const variance = Math.ceil(
                (new Date(m.forecastDate).getTime() - new Date(m.plannedDate).getTime()) / 86_400_000
              );
              return (
                <li key={m.id}>
                  <Link
                    href="/milestones"
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", cls)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.phase}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium text-foreground tabular-nums">{formatDate(m.forecastDate)}</p>
                      {variance !== 0 && (
                        <p className={cn(
                          "mt-0.5 text-[11px] font-semibold tabular-nums",
                          variance > 0 ? "text-rose-600" : "text-emerald-600",
                        )}>
                          {variance > 0 ? `+${variance}d` : `${variance}d`}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Decisions */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Decisions Needed</p>
            <Link href="/documents" className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {kpis.pendingDocs.map((doc) => {
              const all = [...doc.reviewers, ...doc.approvers];
              const pendingCount = all.filter((d) => d.status === "pending").length;
              return (
                <li key={doc.id}>
                  <Link
                    href="/documents"
                    className="group block px-5 py-3.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{doc.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {doc.type} · v{doc.version} · due {formatDate(doc.dueDate)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {pendingCount} pending
                      </span>
                    </div>
                    {/* Decision avatars */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {all.map((d, i) => (
                        <div key={i} className="relative" title={`${d.person} (${d.role}): ${d.status}`}>
                          <span className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white",
                            d.status === "pending" ? "bg-slate-300" : avatarColor(d.initials),
                          )}>
                            {d.initials}
                          </span>
                          <span className={cn(
                            "absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-card text-[8px] font-black",
                            d.status === "approved" ? "bg-emerald-500 text-white"
                            : d.status === "rejected" ? "bg-rose-500 text-white"
                            : "bg-slate-200 text-slate-600",
                          )}>
                            {d.status === "approved" ? "✓" : d.status === "rejected" ? "✗" : "·"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border bg-muted/20 px-5 py-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              Open the Documents page to cycle decisions per person
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
