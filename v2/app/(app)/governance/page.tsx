"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, DollarSign, FileText, Scale, ScrollText } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { useProjectEvm } from "@/lib/hooks/use-project-evm";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

function focusHref(route: string, id: string) {
  return `${route}?focus=${encodeURIComponent(id)}`;
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function fmtMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
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
  const { coverage, evm } = useProjectEvm();
  const risks = useEntityStore((s) => s.risks).filter((risk) => risk.projectId === activeProjectId);
  const documents = useEntityStore((s) => s.documents).filter((document) => document.projectId === activeProjectId);
  const charters = useEntityStore((s) => s.charters).filter((charter) => charter.projectId === activeProjectId);

  const openRisks = risks.filter((risk) => risk.status === "open");
  const highRisks = openRisks.filter((risk) => risk.score >= 15);
  const charter = charters[0];
  const pendingApprovals = documents.flatMap((document) =>
    [...document.reviewers, ...document.approvers]
      .filter((person) => person.status === "pending")
      .map((person) => ({ document, person })),
  );
  const pendingDocuments = new Set(pendingApprovals.map(({ document }) => document.id));
  const budgetPct = evm ? Math.round((evm.snapshot.ac / Math.max(evm.snapshot.bac, 1)) * 100) : 0;
  const budgetDetail = evm
    ? `${fmtMoney(evm.snapshot.ac)} actual against ${fmtMoney(evm.snapshot.bac)} budget.`
    : `Add ${coverage.missing.join(" and ") || "project data"} before budget truth is available.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance"
        subtitle="What decisions and controls matter: top risks, pending approvals, budget truth, and charter status."
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <GovernanceCard title="Open risks" value={openRisks.length} detail={`${highRisks.length} high-priority risk${highRisks.length === 1 ? "" : "s"} ${highRisks.length === 1 ? "needs" : "need"} escalation discipline.`} href="/risks" tone={highRisks.length ? "rose" : openRisks.length ? "amber" : "emerald"} icon={AlertTriangle} />
        <GovernanceCard title="Decision packs" value={pendingDocuments.size} detail={`${pendingApprovals.length} person-level review or approval follow-up${pendingApprovals.length === 1 ? "" : "s"}.`} href="/documents" tone={pendingApprovals.length ? "amber" : "emerald"} icon={FileText} />
        <GovernanceCard title="Budget used" value={evm ? `${budgetPct}%` : "Pending"} detail={budgetDetail} href="/costs" tone={evm && budgetPct >= 85 ? "rose" : evm && budgetPct >= 60 ? "amber" : "blue"} icon={DollarSign} />
        <GovernanceCard title="Charter" value={charter?.status ?? "Missing"} detail="Scope, assumptions, constraints, success criteria, and sponsor approval." href="/charter" tone={charter?.status === "approved" ? "emerald" : "blue"} icon={ScrollText} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Top Governance Risks</p>
          </div>
          <ul className="divide-y divide-border">
            {openRisks.slice().sort((a, b) => b.score - a.score).slice(0, 6).map((risk) => (
              <li key={risk.id}>
                <Link href={focusHref("/risks", risk.id)} className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    risk.score >= 15 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700",
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
            {openRisks.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">No open risks need governance follow-up.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Decision Follow-Up</p>
          </div>
          <ul className="divide-y divide-border">
            {pendingApprovals.slice().sort((a, b) => a.document.dueDate.localeCompare(b.document.dueDate)).slice(0, 8).map(({ document, person }) => (
              <li key={`${document.id}-${person.initials}-${person.role}`}>
                <Link href={focusHref("/documents", document.id)} className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {person.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{person.person} decision on {document.name}</p>
                    <p className="text-xs text-muted-foreground">{person.role} · owner {document.owner} · due {formatDate(document.dueDate)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
                </Link>
              </li>
            ))}
            {pendingApprovals.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">No document reviews or approvals are waiting right now.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
