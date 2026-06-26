"use client";

import Link from "next/link";
import { CalendarClock, CheckSquare, ChevronRight, GitBranch, Milestone, ScrollText } from "lucide-react";
import { GuidedWorkPanel } from "@/components/guidance/guided-work-panel";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

function focusHref(route: string, id: string) {
  return `${route}?focus=${encodeURIComponent(id)}`;
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
  const { activeProject, activeProjectId } = useProject();
  const charters = useEntityStore((s) => s.charters).filter((charter) => charter.projectId === activeProjectId);
  const milestones = useEntityStore((s) => s.milestones).filter((milestone) => milestone.projectId === activeProjectId);
  const tasks = useEntityStore((s) => s.tasks).filter((task) => task.projectId === activeProjectId);

  const charter = charters[0];
  const incompleteMilestones = milestones.filter((milestone) => milestone.status !== "complete");
  const shiftedMilestones = incompleteMilestones.filter((milestone) => milestone.forecastDate > milestone.plannedDate);
  const linkedTasks = tasks.filter((task) => task.milestoneId);
  const unlinkedTasks = tasks.filter((task) => !task.milestoneId);
  const taskLinks = tasks.reduce((sum, task) => sum + (task.dependsOn?.length ?? 0), 0);
  const milestonesByDate = milestones.slice().sort((a, b) => a.forecastDate.localeCompare(b.forecastDate));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan"
        subtitle={`What is the project shape? Charter, milestone gates, task counts, and dependency links for ${activeProject.name}.`}
      />

      <GuidedWorkPanel route="/plan" compact />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <PlanCard title="Charter" value={charter ? charter.status : "Missing"} description="Purpose, scope, objectives, assumptions, and sponsor approval." href="/charter" icon={ScrollText} tone={charter?.status === "approved" ? "emerald" : "amber"} />
        <PlanCard title="Milestones" value={milestones.length} description={`${shiftedMilestones.length} forecast movement${shiftedMilestones.length === 1 ? "" : "s"} visible.`} href="/milestones" icon={Milestone} tone={shiftedMilestones.length ? "amber" : "emerald"} />
        <PlanCard title="Tasks" value={tasks.length} description={`${linkedTasks.length} linked to milestones, ${unlinkedTasks.length} unlinked.`} href="/tasks" icon={CheckSquare} />
        <PlanCard title="Waiting links" value={taskLinks} description="Task dependencies that shape downstream schedule movement." href="/tasks" icon={GitBranch} tone="blue" />
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Charter → Milestones → Tasks</p>
            <p className="text-[11px] text-muted-foreground">Rows open the exact milestone or task so the plan can be checked without hunting.</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          <Link href="/charter" className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/30">
            <ScrollText className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary">Project Charter</p>
              <p className="text-xs text-muted-foreground">
                {charter ? `${charter.status} · sponsor ${charter.sponsor} · last updated ${formatDate(charter.lastUpdated)}` : "No charter is available for this project yet."}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
          </Link>

          {milestonesByDate.map((milestone) => {
            const milestoneTasks = tasks
              .filter((task) => task.milestoneId === milestone.id)
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
            const completeTasks = milestoneTasks.filter((task) => task.status === "Complete").length;

            return (
              <div key={milestone.id} className="px-5 py-4">
                <Link href={focusHref("/milestones", milestone.id)} className="group flex items-start gap-3">
                  <Milestone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{milestone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.phase} · {milestone.status} · forecast {formatDate(milestone.forecastDate)} · {completeTasks}/{milestoneTasks.length} tasks complete
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
                </Link>
                {milestoneTasks.length ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {milestoneTasks.slice(0, 4).map((task) => (
                      <Link key={task.id} href={focusHref("/tasks", task.id)} className="group rounded-lg border border-border bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40">
                        <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">{task.name}</p>
                        <p className="text-[11px] text-muted-foreground">{task.status} · {task.owner} · due {formatDate(task.dueDate)}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No tasks linked to this milestone yet.</p>
                )}
              </div>
            );
          })}

          {unlinkedTasks.length ? (
            <div className="px-5 py-4">
              <p className="text-sm font-semibold text-foreground">Tasks not linked to a milestone</p>
              <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
                {unlinkedTasks.slice(0, 6).map((task) => (
                  <Link key={task.id} href={focusHref("/tasks", task.id)} className="group rounded-lg border border-border bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40">
                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">{task.name}</p>
                    <p className="text-[11px] text-muted-foreground">{task.workstream} · {task.owner} · due {formatDate(task.dueDate)}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
