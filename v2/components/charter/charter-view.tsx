"use client";

// M22 — Charter view + edit drawer.
// 1:1 with Project. Read view is the primary surface; clicking Edit opens
// the form drawer to change fields. Tone discipline applied throughout per
// §5.3 — status pill colors match charter lifecycle (slate draft / amber
// submitted / emerald approved).

import { useState } from "react";
import { toast } from "sonner";
import {
  Pencil, Scroll, Check, FileText, Calendar, User, Wallet, Target,
  CircleDot, ShieldCheck, AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntityStore } from "@/lib/stores/entity-store";
import { useProject } from "@/components/projects/project-provider";
import { type Charter, type CharterStatus } from "@/lib/mockData";
import { CharterFormDrawer } from "./charter-form";

const statusPill: Record<CharterStatus, { label: string; cls: string }> = {
  draft:     { label: "Draft",     cls: "border-slate-200 bg-slate-50 text-slate-700" },
  submitted: { label: "Submitted", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  approved:  { label: "Approved",  cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function CharterView() {
  const { activeProjectId, activeProject } = useProject();
  const charters       = useEntityStore((s) => s.charters);
  const addCharter     = useEntityStore((s) => s.addCharter);
  const updateCharter  = useEntityStore((s) => s.updateCharter);

  const charter = charters.find((c) => c.projectId === activeProjectId);
  const [editing, setEditing] = useState(false);
  const [templateMode, setTemplateMode] = useState(false);

  const templateCharter: Charter = {
    id: `charter-${activeProjectId}`,
    projectId: activeProjectId,
    purpose: `${activeProject.name} will establish a controlled delivery path for the agreed scope, business outcomes, validation needs, and go-live readiness. The charter gives SteerCo one approved reference for why the project exists, what it covers, and how success will be evidenced.`,
    objectives: [
      "Confirm scope, governance, workstream ownership, and delivery cadence before execution starts.",
      "Deliver approved milestones, controlled documents, testing evidence, and readiness gates for go-live.",
      "Maintain a traceable delivery story for SteerCo, audit, and project closure.",
    ],
    inScope: [
      "Project governance, milestone control, task ownership, risk management, and decision tracking.",
      "Core implementation workstreams, readiness gates, controlled documents, training, and go-live preparation.",
      "Weekly status reporting with evidence linked to source project records.",
    ],
    outOfScope: [
      "Unapproved system changes, business-as-usual support, and enhancements outside the agreed project scope.",
      "Integrations, regions, or process areas not confirmed during project discovery.",
    ],
    successCriteria: [
      "SteerCo can review project status, risks, decisions, and readiness from one trusted source.",
      "Critical milestones and controlled documents are approved before go-live.",
      "Open risks, blockers, and decision debt are visible with accountable owners.",
    ],
    assumptions: [
      "Business SMEs, vendor leads, and QA reviewers are available when required.",
      "Source data, environments, and approval forums are ready according to the project plan.",
    ],
    constraints: [
      "Go-live, audit, validation, and budget constraints must be escalated through governance.",
      "Scope changes require sponsor review before they are added to the delivery baseline.",
    ],
    sponsor: "",
    projectManager: "Vineet Pathak",
    budgetSummary: "",
    status: "draft",
    lastUpdated: new Date().toISOString().slice(0, 10),
  };

  function openBlankForm() {
    setTemplateMode(false);
    setEditing(true);
  }

  function openTemplateForm() {
    setTemplateMode(true);
    setEditing(true);
  }

  function handleSave(c: Charter) {
    const exists = charters.some((x) => x.id === c.id);
    const withTimestamp: Charter = { ...c, lastUpdated: new Date().toISOString().slice(0, 10) };
    if (exists) {
      updateCharter(withTimestamp);
      toast.success("Charter updated", { description: activeProject.name });
    } else {
      addCharter(withTimestamp);
      toast.success("Charter created", { description: activeProject.name });
    }
    setEditing(false);
    setTemplateMode(false);
  }

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (!charter) {
    return (
      <>
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <Scroll className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-base font-medium text-foreground">No charter for this project yet</p>
          <p className="mt-1 max-w-md mx-auto text-sm text-muted-foreground">
            Charters keep your SteerCo aligned and auditor-ready.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={openBlankForm}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Scroll className="h-3.5 w-3.5" />
              Create charter
            </button>
            <button
              type="button"
              onClick={openTemplateForm}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <FileText className="h-3.5 w-3.5" />
              Load standard template
            </button>
          </div>
        </div>

        <CharterFormDrawer
          open={editing}
          initial={templateMode ? templateCharter : null}
          projectId={activeProjectId}
          templateMode={templateMode}
          onSave={handleSave}
          onClose={() => { setEditing(false); setTemplateMode(false); }}
        />
      </>
    );
  }

  // ─── Read view ────────────────────────────────────────────────────────────
  const pill = statusPill[charter.status];

  return (
    <>
      {/* Header card — status, sponsor, key dates */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", pill.cls)}>
                {pill.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Last updated {formatDate(charter.lastUpdated)}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{activeProject.name}</h2>
            <p className="text-xs text-muted-foreground">{activeProject.client} · {activeProject.methodology}</p>
          </div>
          <button
            onClick={openBlankForm}
            className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>

        {/* Key facts row */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <FactCell icon={User} label="Sponsor" value={charter.sponsor} />
          <FactCell icon={User} label="Project manager" value={charter.projectManager} />
          <FactCell icon={Calendar} label="Target go-live" value={formatDate(activeProject.goLiveDate)} />
          <FactCell icon={Wallet} label="Budget" value={charter.budgetSummary} />
        </div>

        {charter.status === "approved" && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
            <p className="text-xs text-emerald-900">
              Approved {formatDate(charter.approvedDate ?? "")} by {charter.approvedBy}
            </p>
          </div>
        )}
      </div>

      {/* Purpose */}
      <Section icon={Target} title="Purpose">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{charter.purpose}</p>
      </Section>

      {/* Objectives */}
      <Section icon={CircleDot} title="Objectives">
        <BulletList items={charter.objectives} emptyHint="No objectives set yet." />
      </Section>

      {/* Scope */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={Check} title="In scope">
          <BulletList items={charter.inScope} tone="emerald" emptyHint="Nothing listed." />
        </Section>
        <Section icon={AlertOctagon} title="Out of scope">
          <BulletList items={charter.outOfScope} tone="slate" emptyHint="Nothing listed." />
        </Section>
      </div>

      {/* Success criteria */}
      <Section icon={ShieldCheck} title="Success criteria">
        <BulletList items={charter.successCriteria} emptyHint="No success criteria defined yet." />
      </Section>

      {/* Assumptions + Constraints */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={FileText} title="Assumptions">
          <BulletList items={charter.assumptions} tone="blue" emptyHint="Nothing recorded." />
        </Section>
        <Section icon={FileText} title="Constraints">
          <BulletList items={charter.constraints} tone="amber" emptyHint="Nothing recorded." />
        </Section>
      </div>

      <CharterFormDrawer
        open={editing}
        initial={charter}
        projectId={activeProjectId}
        onSave={handleSave}
        onClose={() => setEditing(false)}
      />
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FactCell({
  icon: Icon, label, value,
}: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-foreground" title={value}>{value || "—"}</p>
      </div>
    </div>
  );
}

function Section({
  icon: Icon, title, children,
}: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function BulletList({
  items, tone = "primary", emptyHint,
}: { items: string[]; tone?: "primary" | "emerald" | "slate" | "blue" | "amber"; emptyHint: string }) {
  if (items.length === 0) {
    return <p className="text-xs italic text-muted-foreground">{emptyHint}</p>;
  }
  const dotColor =
    tone === "emerald" ? "bg-emerald-500"
    : tone === "slate" ? "bg-slate-400"
    : tone === "blue" ? "bg-blue-500"
    : tone === "amber" ? "bg-amber-500"
    : "bg-primary";
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
          <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dotColor)} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
