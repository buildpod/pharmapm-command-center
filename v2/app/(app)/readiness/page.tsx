"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, ClipboardCheck, FileText, Milestone, Rocket } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

type EvidenceKind = "document" | "milestone";

interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  title: string;
  status: string;
  href: string;
}

interface ReadinessGate {
  title: string;
  description: string;
  pct: number;
  passed: number;
  total: number;
  missing: EvidenceItem[];
}

function focusHref(route: string, id: string) {
  return `${route}?focus=${encodeURIComponent(id)}`;
}

function readinessTone(pct: number) {
  if (pct >= 80) return "emerald";
  if (pct >= 50) return "blue";
  if (pct >= 25) return "amber";
  return "rose";
}

function toneClass(tone: string) {
  return {
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[tone] ?? "border-border bg-card text-foreground";
}

function GateCard({ gate }: { gate: ReadinessGate }) {
  const tone = readinessTone(gate.pct);
  const href = gate.missing[0]?.href ?? "/documents";

  return (
    <Link href={href} className={cn("group rounded-lg border p-4 transition-shadow hover:shadow-sm", toneClass(tone))}>
      <div className="flex items-center justify-between gap-3">
        <ClipboardCheck className="h-4 w-4" />
        <span className="text-2xl font-bold tabular-nums leading-none">{gate.pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
        <div className="h-full rounded-full bg-current" style={{ width: `${gate.pct}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold">{gate.title}</p>
      <p className="mt-1 text-xs leading-5 text-foreground/70">{gate.description}</p>
      <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold">
        {gate.passed} of {gate.total} evidence items ready <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

export default function ReadinessPage() {
  const { activeProjectId } = useProject();
  const documents = useEntityStore((s) => s.documents).filter((document) => document.projectId === activeProjectId);
  const milestones = useEntityStore((s) => s.milestones).filter((milestone) => milestone.projectId === activeProjectId);

  const buildGate = (title: string, description: string, phases: string[]): ReadinessGate => {
    const gateDocuments = documents.filter((document) => phases.includes(document.phase));
    const gateMilestones = milestones.filter((milestone) => phases.includes(milestone.phase));
    const docEvidence: EvidenceItem[] = gateDocuments.map((document) => ({
      id: document.id,
      kind: "document",
      title: document.name,
      status: document.status,
      href: focusHref("/documents", document.id),
    }));
    const milestoneEvidence: EvidenceItem[] = gateMilestones.map((milestone) => ({
      id: milestone.id,
      kind: "milestone",
      title: milestone.name,
      status: milestone.status,
      href: focusHref("/milestones", milestone.id),
    }));
    const evidence = [...docEvidence, ...milestoneEvidence];
    const passed = evidence.filter((item) =>
      item.kind === "document"
        ? item.status === "approved"
        : item.status === "complete",
    ).length;
    const total = Math.max(evidence.length, phases.length);
    const missing = evidence.filter((item) =>
      item.kind === "document"
        ? item.status !== "approved"
        : item.status !== "complete",
    );

    return {
      title,
      description,
      pct: total ? Math.round((passed / total) * 100) : 0,
      passed,
      total,
      missing,
    };
  };

  const gates = [
    buildGate("Planning baseline", "Charter, requirements, and planning evidence approved before delivery accelerates.", ["Planning", "Design"]),
    buildGate("Configuration evidence", "Configuration artefacts and build gates ready for validation hand-off.", ["Configuration", "Config"]),
    buildGate("Validation readiness", "Validation protocols, test evidence, and sign-off gates ready for go-live confidence.", ["Validation", "Testing"]),
    buildGate("Training and adoption", "Training material, rollout readiness, and user adoption evidence prepared.", ["Training"]),
    buildGate("Go-live control", "Cutover, release decision, and final approval evidence ready before production move.", ["Go-Live"]),
  ];

  const missingEvidence = gates.flatMap((gate) =>
    gate.missing.map((item) => ({
      ...item,
      gate: gate.title,
    })),
  );
  const overallPct = gates.length ? Math.round(gates.reduce((sum, gate) => sum + gate.pct, 0) / gates.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Readiness Gates"
        subtitle="Are gates ready for go-live? This is computed from live document approvals and milestone completion."
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {gates.map((gate) => (
          <GateCard key={gate.title} gate={gate} />
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Go-Live Readiness</p>
              <p className="text-[11px] text-muted-foreground">Overall gate readiness is {overallPct}% based on current evidence.</p>
            </div>
          </div>
          <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold", toneClass(readinessTone(overallPct)))}>
            {overallPct >= 80 ? "Ready to defend" : "Evidence needed"}
          </span>
        </div>
        <ul className="divide-y divide-border">
          {missingEvidence.slice(0, 12).map((item) => (
            <li key={`${item.gate}-${item.id}`}>
              <Link href={item.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30">
                {item.kind === "document" ? <FileText className="h-4 w-4 text-muted-foreground" /> : <Milestone className="h-4 w-4 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.gate} · current status: {item.status}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
              </Link>
            </li>
          ))}
          {missingEvidence.length === 0 ? (
            <li className="flex items-center gap-3 px-5 py-6 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              Every visible document and milestone gate is ready.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
