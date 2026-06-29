"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Inbox, CheckSquare, AlertTriangle, FileText, Milestone as MilestoneIcon, ArrowUpRight,
} from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import {
  milestones as initialMilestones,
  tasks as initialTasks,
  risks as initialRisks,
  documents as initialDocuments,
  type Milestone, type Task, type Risk, type Document,
} from "@/lib/mockData";
import { useCurrentUser } from "@/lib/settingsStore";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

const TODAY = "2026-05-13";

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function daysFromToday(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - new Date(TODAY).getTime()) / 86_400_000);
}

export default function MyItemsPage() {
  const { activeProjectId, activeProject } = useProject();
  const ME = useCurrentUser().initials;

  const { ownedTasks, ownedRisks, ownedMilestones, ownedDocuments } = useMemo(() => {
    const ms = readStored<Milestone[]>("aivello_milestones_v1", initialMilestones)
      .filter((m) => m.projectId === activeProjectId && m.owner === ME);
    const ts = readStored<Task[]>("aivello_tasks_v1", initialTasks)
      .filter((t) => t.projectId === activeProjectId && t.owner === ME);
    const rs = readStored<Risk[]>("aivello_risks_v1", initialRisks)
      .filter((r) => r.projectId === activeProjectId && r.owner === ME && r.status === "open");
    const ds = readStored<Document[]>("aivello_documents_v1", initialDocuments)
      .filter((d) => d.projectId === activeProjectId && d.owner === ME);
    return { ownedTasks: ts, ownedRisks: rs, ownedMilestones: ms, ownedDocuments: ds };
  }, [activeProjectId, ME]);

  // Task buckets
  const overdueTasks  = ownedTasks.filter((t) => t.status !== "Complete" && t.dueDate < TODAY);
  const dueSoonTasks  = ownedTasks.filter((t) => t.status !== "Complete" && t.dueDate >= TODAY && daysFromToday(t.dueDate) <= 7);
  const blockedTasks  = ownedTasks.filter((t) => t.status === "Blocked");
  const onTrackTasks  = ownedTasks.filter((t) =>
    t.status !== "Complete" && t.status !== "Blocked" &&
    (t.dueDate >= TODAY && daysFromToday(t.dueDate) > 7)
  );

  // Doc buckets
  const overdueDocs   = ownedDocuments.filter((d) => d.status !== "approved" && d.dueDate < TODAY);
  const inFlightDocs  = ownedDocuments.filter((d) => d.status === "in-review" || d.status === "reviewed");
  const draftDocs     = ownedDocuments.filter((d) => d.status === "draft");

  const totalOwned = ownedTasks.length + ownedRisks.length + ownedMilestones.length + ownedDocuments.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Items"
        icon={Inbox}
        subtitle={
          <>
            Everything assigned to <span className="font-medium text-foreground">{ME}</span> in {activeProject.name}.
            {totalOwned > 0
              ? <> <span className="font-medium text-foreground">{totalOwned}</span> open item{totalOwned === 1 ? "" : "s"}.</>
              : " You're all clear."}
          </>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Tasks"      value={ownedTasks.length}      sub={`${overdueTasks.length} overdue · ${blockedTasks.length} blocked`} Icon={CheckSquare} tone={overdueTasks.length > 0 ? "bad" : blockedTasks.length > 0 ? "warn" : "neutral"} />
        <SummaryCard label="Documents"  value={ownedDocuments.length}  sub={`${overdueDocs.length} overdue · ${inFlightDocs.length} in flight`} Icon={FileText}    tone={overdueDocs.length > 0 ? "bad" : "neutral"} />
        <SummaryCard label="Risks"      value={ownedRisks.length}      sub={`${ownedRisks.filter((r) => r.score >= 12).length} escalated`}     Icon={AlertTriangle} tone={ownedRisks.filter((r) => r.score >= 12).length > 0 ? "bad" : "neutral"} />
        <SummaryCard label="Milestones" value={ownedMilestones.length} sub={`${ownedMilestones.filter((m) => m.status === "at-risk").length} at-risk`} Icon={MilestoneIcon} tone={ownedMilestones.some((m) => m.status === "at-risk") ? "warn" : "neutral"} />
      </div>

      {/* Tasks */}
      {ownedTasks.length > 0 && (
        <Section title="Tasks" href="/tasks" count={ownedTasks.length}>
          {overdueTasks.length > 0  && <Group label="Overdue"          tone="rose"    >{overdueTasks.map((t) => <TaskRow key={t.id} t={t} />)}</Group>}
          {blockedTasks.length > 0  && <Group label="Blocked"          tone="amber"   >{blockedTasks.map((t) => <TaskRow key={t.id} t={t} />)}</Group>}
          {dueSoonTasks.length > 0  && <Group label="Due this week"    tone="amber"   >{dueSoonTasks.map((t) => <TaskRow key={t.id} t={t} />)}</Group>}
          {onTrackTasks.length > 0  && <Group label="On track"         tone="emerald" >{onTrackTasks.map((t) => <TaskRow key={t.id} t={t} />)}</Group>}
        </Section>
      )}

      {/* Documents */}
      {ownedDocuments.length > 0 && (
        <Section title="Documents (as Responsible)" href="/documents" count={ownedDocuments.length}>
          {overdueDocs.length > 0  && <Group label="Overdue"          tone="rose"    >{overdueDocs.map((d) => <DocRow key={d.id} d={d} />)}</Group>}
          {inFlightDocs.length > 0 && <Group label="In review"        tone="blue"    >{inFlightDocs.map((d) => <DocRow key={d.id} d={d} />)}</Group>}
          {draftDocs.length > 0    && <Group label="Drafts"           tone="slate"   >{draftDocs.map((d) => <DocRow key={d.id} d={d} />)}</Group>}
        </Section>
      )}

      {/* Risks */}
      {ownedRisks.length > 0 && (
        <Section title="Risks" href="/risks" count={ownedRisks.length}>
          <Group label="Open" tone="rose">
            {ownedRisks.sort((a, b) => b.score - a.score).map((r) => <RiskRow key={r.id} r={r} />)}
          </Group>
        </Section>
      )}

      {/* Milestones */}
      {ownedMilestones.length > 0 && (
        <Section title="Milestones" href="/milestones" count={ownedMilestones.length}>
          <Group label="Owned" tone="blue">
            {ownedMilestones.sort((a, b) => a.plannedDate.localeCompare(b.plannedDate)).map((m) => <MilestoneRow key={m.id} m={m} />)}
          </Group>
        </Section>
      )}

      {totalOwned === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Nothing assigned to you yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            My Items gives each person a single action list across tasks, risks, milestones, and approvals.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, sub, Icon, tone,
}: {
  label: string; value: number; sub: string; Icon: typeof CheckSquare; tone: "neutral" | "warn" | "bad";
}) {
  const toneCls = tone === "bad"  ? "text-[var(--color-status-risk-fg)] bg-[var(--color-status-risk-bg)]"
                : tone === "warn" ? "text-[var(--color-status-warn-fg)] bg-[var(--color-status-warn-bg)]"
                : "text-[var(--color-ink-500)] bg-[var(--color-surface-sunk)]";
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", toneCls)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Section({
  title, href, count, children,
}: {
  title: string; href: string; count: number; children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          {title} <span className="text-muted-foreground tabular-nums">· {count}</span>
        </h2>
        <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

const toneToHeader: Record<string, string> = {
  rose:    "text-[var(--color-status-risk-fg)] border-[var(--color-line-soft)] bg-[var(--color-status-risk-bg)]",
  amber:   "text-[var(--color-status-warn-fg)] border-[var(--color-line-soft)] bg-[var(--color-status-warn-bg)]",
  blue:    "text-[var(--color-status-info-fg)] border-[var(--color-line-soft)] bg-[var(--color-status-info-bg)]",
  emerald: "text-[var(--color-status-ok-fg)] border-[var(--color-line-soft)] bg-[var(--color-status-ok-bg)]",
  slate:   "text-[var(--color-ink-500)] border-[var(--color-line-soft)] bg-[var(--color-surface-sunk)]",
};

function Group({
  label, tone, children,
}: {
  label: string; tone: keyof typeof toneToHeader; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={cn("flex items-center gap-2 border-b px-4 py-2 text-[11px] font-semibold uppercase tracking-wider", toneToHeader[tone])}>
        {label}
      </div>
      <ul className="divide-y divide-border">{children}</ul>
    </div>
  );
}

function TaskRow({ t }: { t: Task }) {
  const isOverdue = t.dueDate < TODAY && t.status !== "Complete";
  return (
    <li>
      <Link href="/tasks" className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
        <CheckSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{t.name}</p>
          <p className="text-[11px] text-muted-foreground">{t.workstream} · {t.status} · {t.priority}</p>
        </div>
        <span className={cn("shrink-0 text-xs tabular-nums", isOverdue ? "font-semibold text-[var(--color-status-risk-fg)]" : "text-muted-foreground")}>
          {t.dueDate}
        </span>
      </Link>
    </li>
  );
}

function DocRow({ d }: { d: Document }) {
  const isOverdue = d.dueDate < TODAY && d.status !== "approved";
  return (
    <li>
      <Link href="/documents" className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {d.abbreviation ?? d.id.toUpperCase()} · {d.phase} · v{d.version} · {d.status}
          </p>
        </div>
        <span className={cn("shrink-0 text-xs tabular-nums", isOverdue ? "font-semibold text-[var(--color-status-risk-fg)]" : "text-muted-foreground")}>
          {d.dueDate}
        </span>
      </Link>
    </li>
  );
}

function RiskRow({ r }: { r: Risk }) {
  const band = r.score >= 15 ? "rose" : r.score >= 8 ? "amber" : "emerald";
  return (
    <li>
      <Link href="/risks" className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
        <span className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold tabular-nums",
          band === "rose"  ? "border-transparent bg-[var(--color-status-risk-bg)] text-[var(--color-status-risk-fg)]"
          : band === "amber" ? "border-transparent bg-[var(--color-status-warn-bg)] text-[var(--color-status-warn-fg)]"
          : "border-transparent bg-[var(--color-status-ok-bg)] text-[var(--color-status-ok-fg)]"
        )}>
          {r.score}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
          <p className="text-[11px] text-muted-foreground">P{r.probability}×I{r.impact} · {r.category}</p>
        </div>
      </Link>
    </li>
  );
}

function MilestoneRow({ m }: { m: Milestone }) {
  const slip = m.forecastDate > m.plannedDate
    ? Math.ceil((new Date(m.forecastDate).getTime() - new Date(m.plannedDate).getTime()) / 86_400_000)
    : 0;
  return (
    <li>
      <Link href="/milestones" className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
        <MilestoneIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
          <p className="text-[11px] text-muted-foreground">{m.phase} · {m.status}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs tabular-nums text-muted-foreground">{m.plannedDate}</p>
          {slip > 0 && <p className="text-[10px] font-semibold tabular-nums text-[var(--color-status-risk-fg)]">+{slip}d</p>}
        </div>
      </Link>
    </li>
  );
}
