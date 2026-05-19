"use client";

import Link from "next/link";
import { AlertTriangle, CheckSquare, ChevronRight, FileText, UserCheck } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

const TODAY = "2026-05-18";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - new Date(TODAY).getTime()) / 86_400_000);
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
  tone: "rose" | "amber" | "blue" | "emerald";
  icon: typeof CheckSquare;
}) {
  const toneClass = {
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];

  return (
    <Link href={href} className={cn("group rounded-lg border p-4 transition-shadow hover:shadow-sm", toneClass)}>
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-4 w-4" />
        <span className="text-2xl font-bold tabular-nums leading-none">{count}</span>
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-foreground/70">{description}</p>
      <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold">
        Open worklist <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

export default function WorklistPage() {
  const { activeProjectId } = useProject();
  const tasks = useEntityStore((s) => s.tasks).filter((t) => t.projectId === activeProjectId);
  const documents = useEntityStore((s) => s.documents).filter((d) => d.projectId === activeProjectId);

  const blocked = tasks.filter((t) => t.status === "Blocked");
  const dueSoon = tasks
    .filter((t) => t.status !== "Complete" && daysUntil(t.dueDate) <= 14)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const inFlight = tasks.filter((t) => t.status === "In Progress");
  const pendingDocs = documents
    .filter((d) => d.status === "in-review")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const rows = [
    ...blocked.map((t) => ({
      id: t.id,
      title: t.name,
      meta: `${t.workstream} · ${t.owner} · due ${formatDate(t.dueDate)}`,
      tag: "Blocked",
      href: "/tasks",
      tone: "rose" as const,
    })),
    ...dueSoon.slice(0, 6).map((t) => ({
      id: t.id,
      title: t.name,
      meta: `${t.workstream} · ${t.owner} · due ${formatDate(t.dueDate)}`,
      tag: daysUntil(t.dueDate) < 0 ? "Overdue" : "Due soon",
      href: "/tasks",
      tone: daysUntil(t.dueDate) < 0 ? "rose" as const : "amber" as const,
    })),
    ...pendingDocs.slice(0, 4).map((d) => ({
      id: d.id,
      title: d.name,
      meta: `${d.type} · owner ${d.owner} · due ${formatDate(d.dueDate)}`,
      tag: "Decision",
      href: "/documents",
      tone: "blue" as const,
    })),
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Worklist</h1>
        <p className="text-sm text-muted-foreground">
          A simple action queue for tasks, approvals, blockers, and due-soon work.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <WorkCard title="Blocked" count={blocked.length} description="Needs PM attention or escalation." href="/tasks" tone={blocked.length ? "rose" : "emerald"} icon={AlertTriangle} />
        <WorkCard title="Due soon" count={dueSoon.length} description="Upcoming tasks to confirm with owners." href="/tasks" tone={dueSoon.length ? "amber" : "emerald"} icon={CheckSquare} />
        <WorkCard title="In progress" count={inFlight.length} description="Active execution work across streams." href="/tasks" tone="blue" icon={CheckSquare} />
        <WorkCard title="Decisions" count={pendingDocs.length} description="Documents waiting for review or approval." href="/documents" tone={pendingDocs.length ? "amber" : "emerald"} icon={FileText} />
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Next Best Actions</p>
            <p className="text-[11px] text-muted-foreground">Start here before opening the detailed task or document views.</p>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {rows.slice(0, 10).map((row) => (
            <li key={`${row.tag}-${row.id}`}>
              <Link href={row.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  row.tone === "rose" ? "border-rose-200 bg-rose-50 text-rose-700"
                  : row.tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
                )}>
                  {row.tag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{row.title}</p>
                  <p className="text-xs text-muted-foreground">{row.meta}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
