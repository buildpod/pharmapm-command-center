"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, ClipboardCheck, Database, GraduationCap, Rocket } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

type ReadinessTone = "rose" | "amber" | "blue" | "emerald";

function readinessTone(pct: number): ReadinessTone {
  if (pct >= 75) return "emerald";
  if (pct >= 45) return "blue";
  if (pct >= 20) return "amber";
  return "rose";
}

function ReadinessCard({
  title,
  pct,
  detail,
  href,
  icon: Icon,
}: {
  title: string;
  pct: number;
  detail: string;
  href: string;
  icon: typeof ClipboardCheck;
}) {
  const tone = readinessTone(pct);
  const toneClass = {
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone];

  return (
    <Link href={href} className={cn("group rounded-lg border p-4 transition-shadow hover:shadow-sm", toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4" />
        <span className="text-2xl font-bold tabular-nums leading-none">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
        <div className="h-full rounded-full bg-current" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-foreground/70">{detail}</p>
      <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold">
        Open detail <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

export default function ReadinessPage() {
  const { activeProjectId } = useProject();
  const tasks = useEntityStore((s) => s.tasks).filter((t) => t.projectId === activeProjectId);
  const documents = useEntityStore((s) => s.documents).filter((d) => d.projectId === activeProjectId);
  const milestones = useEntityStore((s) => s.milestones).filter((m) => m.projectId === activeProjectId);

  function taskProgress(workstream: string) {
    const scoped = tasks.filter((t) => t.workstream === workstream);
    if (scoped.length === 0) return 0;
    return Math.round(scoped.reduce((sum, task) => sum + task.progress, 0) / scoped.length);
  }

  const validationDocs = documents.filter((d) => d.phase === "Validation");
  const approvedValidation = validationDocs.filter((d) => d.status === "approved").length;
  const validationDocPct = validationDocs.length ? Math.round((approvedValidation / validationDocs.length) * 100) : 0;
  const validationPct = Math.round((taskProgress("Validation") + validationDocPct) / 2);
  const dataPct = taskProgress("Data Migration");
  const trainingPct = taskProgress("Training");
  const goLiveMilestone = milestones.find((m) => m.phase === "Go-Live");
  const cutoverDocs = documents.filter((d) => d.phase === "Go-Live");
  const cutoverPct = Math.round(((goLiveMilestone?.status === "complete" ? 100 : goLiveMilestone?.status === "in-progress" ? 50 : 20) + (cutoverDocs.some((d) => d.status === "approved") ? 100 : 20)) / 2);

  const checks = [
    { label: "Validation evidence", ready: validationPct >= 75, href: "/documents" },
    { label: "Data migration dry-run", ready: dataPct >= 50, href: "/tasks" },
    { label: "Training plan", ready: trainingPct >= 40, href: "/tasks" },
    { label: "Go-live checklist", ready: cutoverPct >= 50, href: "/documents" },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Readiness</h1>
        <p className="text-sm text-muted-foreground">
          Gate readiness across validation, data migration, training, and go-live preparation.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <ReadinessCard title="Validation" pct={validationPct} detail="Tasks plus validation document approval progress." href="/documents" icon={ClipboardCheck} />
        <ReadinessCard title="Data Migration" pct={dataPct} detail="Extraction, mapping, cleansing, and dry-run execution." href="/tasks" icon={Database} />
        <ReadinessCard title="Training" pct={trainingPct} detail="Materials, walkthroughs, and training scheduling." href="/tasks" icon={GraduationCap} />
        <ReadinessCard title="Go-Live" pct={cutoverPct} detail="Checklist, cutover criteria, and final gate readiness." href="/documents" icon={Rocket} />
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Readiness Checklist</p>
            <p className="text-[11px] text-muted-foreground">Use this as the simple gate conversation before SteerCo.</p>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {checks.map((check) => (
            <li key={check.label}>
              <Link href={check.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                <span className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border",
                  check.ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                )}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary">{check.label}</p>
                  <p className="text-xs text-muted-foreground">{check.ready ? "Ready enough for next review" : "Needs review before the next gate"}</p>
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
