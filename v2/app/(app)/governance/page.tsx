"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, DollarSign, FileText, Scale, ScrollText } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function GovernanceCard({
  title,
  value,
  detail,
  href,
  tone,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  href: string;
  tone: "rose" | "amber" | "blue" | "emerald" | "slate";
  icon: typeof Scale;
}) {
  const toneClass = {
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-border bg-card text-foreground",
  }[tone];

  return (
    <Link href={href} className={cn("group rounded-lg border p-4 transition-shadow hover:shadow-sm", toneClass)}>
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-4 w-4" />
        <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-foreground/70">{detail}</p>
      <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold">
        Open <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

export default function GovernancePage() {
  const { activeProjectId } = useProject();
  const risks = useEntityStore((s) => s.risks).filter((r) => r.projectId === activeProjectId);
  const documents = useEntityStore((s) => s.documents).filter((d) => d.projectId === activeProjectId);
  const costLines = useEntityStore((s) => s.costLines).filter((c) => c.projectId === activeProjectId);

  const openRisks = risks.filter((r) => r.status === "open");
  const highRisks = openRisks.filter((r) => r.score >= 15);
  const pendingDocs = documents.filter((d) => d.status === "in-review");
  const totalBudget = costLines.reduce((sum, c) => sum + c.budgetK, 0);
  const totalActual = costLines.reduce((sum, c) => sum + c.actualK, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Governance</h1>
        <p className="text-sm text-muted-foreground">
          Risks, controlled documents, decisions, charter, and budget control in one place.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <GovernanceCard title="Open risks" value={openRisks.length} detail={`${highRisks.length} high-priority risk${highRisks.length === 1 ? "" : "s"} ${highRisks.length === 1 ? "needs" : "need"} escalation discipline.`} href="/risks" tone={highRisks.length ? "rose" : openRisks.length ? "amber" : "emerald"} icon={AlertTriangle} />
        <GovernanceCard title="Decision packs" value={pendingDocs.length} detail="Documents currently waiting for review or approval." href="/documents" tone={pendingDocs.length ? "amber" : "emerald"} icon={FileText} />
        <GovernanceCard title="Budget used" value={`${budgetPct}%`} detail={`$${totalActual}k actual against $${totalBudget}k budget.`} href="/costs" tone={budgetPct >= 85 ? "rose" : budgetPct >= 60 ? "amber" : "blue"} icon={DollarSign} />
        <GovernanceCard title="Charter" value="Live" detail="Scope, assumptions, constraints, and success criteria." href="/charter" tone="blue" icon={ScrollText} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Top Governance Risks</p>
          </div>
          <ul className="divide-y divide-border">
            {openRisks.slice().sort((a, b) => b.score - a.score).slice(0, 5).map((risk) => (
              <li key={risk.id}>
                <Link href="/risks" className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    risk.score >= 15 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"
                  )}>
                    {risk.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{risk.title}</p>
                    <p className="text-xs text-muted-foreground">Owner {risk.owner} · {risk.mitigation}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Decision Follow-Up</p>
          </div>
          <ul className="divide-y divide-border">
            {pendingDocs.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5).map((doc) => (
              <li key={doc.id}>
                <Link href="/documents" className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {doc.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">Owner {doc.owner} · due {formatDate(doc.dueDate)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
