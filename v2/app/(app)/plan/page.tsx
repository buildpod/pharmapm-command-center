"use client";

import Link from "next/link";
import { CalendarClock, CheckSquare, ChevronRight, GitBranch, Milestone, ScrollText } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function PlanCard({
  title,
  value,
  description,
  href,
  icon: Icon,
  tone = "slate",
}: {
  title: string;
  value: string | number;
  description: string;
  href: string;
  icon: typeof Milestone;
  tone?: "slate" | "amber" | "blue" | "emerald";
}) {
  const toneClass = {
    slate: "border-border bg-card text-foreground",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];

  return (
    <Link href={href} className={cn("group rounded-lg border p-4 transition-shadow hover:shadow-sm", toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4" />
        <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-foreground/70">{description}</p>
      <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold">
        Open <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

export default function PlanPage() {
  const { activeProject } = useProject();
  const { activeProjectId } = useProject();
  const milestones = useEntityStore((s) => s.milestones).filter((m) => m.projectId === activeProjectId);
  const tasks = useEntityStore((s) => s.tasks).filter((t) => t.projectId === activeProjectId);

  const incompleteMilestones = milestones.filter((m) => m.status !== "complete");
  const shiftedMilestones = incompleteMilestones.filter((m) => m.forecastDate > m.plannedDate);
  const taskLinks = tasks.reduce((sum, task) => sum + (task.dependsOn?.length ?? 0), 0);
  const nextMilestone = incompleteMilestones.slice().sort((a, b) => a.forecastDate.localeCompare(b.forecastDate))[0];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Plan</h1>
        <p className="text-sm text-muted-foreground">
          Charter, schedule, task structure, and dependency shape for {activeProject.name}.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <PlanCard title="Charter" value="1" description="Scope, objectives, assumptions, and success criteria." href="/charter" icon={ScrollText} tone="blue" />
        <PlanCard title="Milestones" value={milestones.length} description="Plan, forecast, RAG, and schedule movement." href="/milestones" icon={Milestone} tone={shiftedMilestones.length ? "amber" : "emerald"} />
        <PlanCard title="Tasks" value={tasks.length} description="Execution work grouped by stream and owner." href="/tasks" icon={CheckSquare} />
        <PlanCard title="Waiting links" value={taskLinks} description="Task relationships that shape downstream changes." href="/tasks" icon={GitBranch} tone="blue" />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Schedule Focus</p>
              <p className="text-[11px] text-muted-foreground">The next gate and any visible movement.</p>
            </div>
          </div>
          <div className="p-5">
            {nextMilestone ? (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next milestone</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{nextMilestone.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Planned {formatDate(nextMilestone.plannedDate)} · forecast {formatDate(nextMilestone.forecastDate)} · owner {nextMilestone.owner}
                </p>
                <Link href="/milestones" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  Review milestone plan <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All milestones are complete.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">How to use this view</p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">1. Confirm scope.</span> Start with the charter before changing the plan.</p>
            <p><span className="font-semibold text-foreground">2. Review schedule movement.</span> Milestones show planned versus forecast dates.</p>
            <p><span className="font-semibold text-foreground">3. Inspect execution detail.</span> Tasks hold owners, due dates, and waiting links.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
