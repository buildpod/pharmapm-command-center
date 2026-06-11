"use client";

import Link from "next/link";
import { AlertTriangle, CheckSquare, ChevronRight, FileText, UserCheck } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { PROJECT_STATUS_DATE } from "@/lib/hooks/use-project-evm";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

type WorkTone = "rose" | "amber" | "blue" | "emerald";

function focusHref(route: string, id: string) {
  return `${route}?focus=${encodeURIComponent(id)}`;
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(`${iso}T00:00:00`).getTime() - new Date(`${PROJECT_STATUS_DATE}T00:00:00`).getTime()) / 86_400_000);
}

function toneClass(tone: WorkTone) {
  return {
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];
}

function WorkCard({
  title,
  count,
  description,
  href,
  tone,
  icon: Icon,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  tone: WorkTone;
  icon: typeof CheckSquare;
}) {
  return (
    <Link href={href} className={cn("group rounded-lg border p-4 transition-shadow hover:shadow-sm", toneClass(tone))}>
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-4 w-4" />
        <span className="text-2xl font-bold tabular-nums leading-none">{count}</span>
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-foreground/70">{description}</p>
      <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold">
        Open details <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

export default function WorklistPage() {
  const { activeProjectId } = useProject();
  const tasks = useEntityStore((s) => s.tasks).filter((task) => task.projectId === activeProjectId);
  const documents = useEntityStore((s) => s.documents).filter((document) => document.projectId === activeProjectId);
  const milestones = useEntityStore((s) => s.milestones).filter((milestone) => milestone.projectId === activeProjectId);
  const risks = useEntityStore((s) => s.risks).filter((risk) => risk.projectId === activeProjectId);

  const blockedTasks = tasks.filter((task) => task.status === "Blocked" || task.status === "On Hold");
  const dueSoonTasks = tasks
    .filter((task) => task.status !== "Complete" && daysUntil(task.dueDate) <= 14)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const activeTasks = tasks.filter((task) => task.status === "In Progress");
  const pendingDecisions = documents.flatMap((document) =>
    [...document.reviewers, ...document.approvers]
      .filter((person) => person.status === "pending")
      .map((person) => ({ document, person })),
  );
  const openRisks = risks.filter((risk) => risk.status === "open").sort((a, b) => b.score - a.score);
  const nextMilestones = milestones
    .filter((milestone) => milestone.status !== "complete")
    .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate));

  const rows = [
    ...blockedTasks.map((task) => ({
      id: task.id,
      title: task.name,
      meta: `${task.workstream} · ${task.owner} · due ${formatDate(task.dueDate)}`,
      tag: task.status,
      href: focusHref("/tasks", task.id),
      tone: "rose" as WorkTone,
    })),
    ...openRisks.filter((risk) => risk.score >= 15).map((risk) => ({
      id: risk.id,
      title: risk.title,
      meta: `Owner ${risk.owner} · mitigation: ${risk.mitigation}`,
      tag: `Risk ${risk.score}`,
      href: focusHref("/risks", risk.id),
      tone: "rose" as WorkTone,
    })),
    ...dueSoonTasks.map((task) => ({
      id: task.id,
      title: task.name,
      meta: `${task.workstream} · ${task.owner} · due ${formatDate(task.dueDate)}`,
      tag: daysUntil(task.dueDate) < 0 ? "Overdue" : "Due soon",
      href: focusHref("/tasks", task.id),
      tone: daysUntil(task.dueDate) < 0 ? "rose" as WorkTone : "amber" as WorkTone,
    })),
    ...pendingDecisions.map(({ document, person }) => ({
      id: `${document.id}-${person.initials}`,
      title: `${person.person} to review ${document.name}`,
      meta: `${document.phase} · ${document.owner} owns document · due ${formatDate(document.dueDate)}`,
      tag: "Approval",
      href: focusHref("/documents", document.id),
      tone: "blue" as WorkTone,
    })),
    ...nextMilestones.slice(0, 4).map((milestone) => ({
      id: milestone.id,
      title: milestone.name,
      meta: `${milestone.phase} · ${milestone.owner} · forecast ${formatDate(milestone.forecastDate)}`,
      tag: "Gate",
      href: focusHref("/milestones", milestone.id),
      tone: milestone.status === "at-risk" ? "amber" as WorkTone : "blue" as WorkTone,
    })),
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Worklist</h1>
        <p className="text-sm text-muted-foreground">
          What work is active now: blockers first, then due work, approvals, risks, and the next delivery gates.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <WorkCard title="Blocked" count={blockedTasks.length} description="Work that cannot move without intervention." href="/tasks" tone={blockedTasks.length ? "rose" : "emerald"} icon={AlertTriangle} />
        <WorkCard title="Due soon" count={dueSoonTasks.length} description="Open tasks due within the next 14 days." href="/tasks" tone={dueSoonTasks.length ? "amber" : "emerald"} icon={CheckSquare} />
        <WorkCard title="In progress" count={activeTasks.length} description="Execution work currently moving across streams." href="/tasks" tone="blue" icon={CheckSquare} />
        <WorkCard title="Approvals" count={pendingDecisions.length} description="Document reviews and sign-offs waiting for people." href="/documents" tone={pendingDecisions.length ? "amber" : "emerald"} icon={FileText} />
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Next Best Actions</p>
            <p className="text-[11px] text-muted-foreground">Each row opens the exact task, risk, document, or milestone that needs attention.</p>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {rows.slice(0, 14).map((row) => (
            <li key={`${row.tag}-${row.id}`}>
              <Link href={row.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", toneClass(row.tone))}>
                  {row.tag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{row.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
              </Link>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="px-5 py-6 text-sm text-muted-foreground">No active blockers, approvals, or near-term work for this project.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
