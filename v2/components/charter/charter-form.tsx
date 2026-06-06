"use client";

import { useState, useEffect } from "react";
import { EntityDrawer, Field, inputCls } from "@/components/ui/entity-drawer";
import { type Charter, type CharterStatus } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

const STATUSES: CharterStatus[] = ["draft", "submitted", "approved"];

const STATUS_LABEL: Record<CharterStatus, string> = {
  draft:     "Draft",
  submitted: "Submitted for approval",
  approved:  "Approved",
};

export function CharterFormDrawer({
  open,
  initial,
  projectId,
  templateMode = false,
  onSave,
  onClose,
}: {
  open: boolean;
  initial: Charter | null;
  projectId: string;
  templateMode?: boolean;
  onSave: (c: Charter) => void;
  onClose: () => void;
}) {
  const isNew = initial === null || templateMode;

  const [purpose,            setPurpose]            = useState("");
  const [objectives,         setObjectives]         = useState<string[]>([]);
  const [inScope,            setInScope]            = useState<string[]>([]);
  const [outOfScope,         setOutOfScope]         = useState<string[]>([]);
  const [successCriteria,    setSuccessCriteria]    = useState<string[]>([]);
  const [assumptions,        setAssumptions]        = useState<string[]>([]);
  const [constraints,        setConstraints]        = useState<string[]>([]);
  const [sponsor,            setSponsor]            = useState("");
  const [projectManager,     setProjectManager]     = useState("");
  const [budgetSummary,      setBudgetSummary]      = useState("");
  const [status,             setStatus]             = useState<CharterStatus>("draft");
  const [approvedBy,         setApprovedBy]         = useState("");
  const [approvedDate,       setApprovedDate]       = useState("");
  const [error,              setError]              = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPurpose(initial?.purpose ?? "");
    setObjectives(initial?.objectives ?? []);
    setInScope(initial?.inScope ?? []);
    setOutOfScope(initial?.outOfScope ?? []);
    setSuccessCriteria(initial?.successCriteria ?? []);
    setAssumptions(initial?.assumptions ?? []);
    setConstraints(initial?.constraints ?? []);
    setSponsor(initial?.sponsor ?? "");
    setProjectManager(initial?.projectManager ?? "");
    setBudgetSummary(initial?.budgetSummary ?? "");
    setStatus(initial?.status ?? "draft");
    setApprovedBy(initial?.approvedBy ?? "");
    setApprovedDate(initial?.approvedDate ?? "");
    setError(null);
  }, [open, initial]);

  function handleSave() {
    // Required-field validation. Per error-message-pattern skill:
    // what / why / next — each error names the missing field and tells the
    // user what to do.
    if (!purpose.trim())          { setError("Add a purpose statement before saving."); return; }
    if (!sponsor.trim())          { setError("Sponsor is required — every charter needs an executive owner."); return; }
    if (!projectManager.trim())   { setError("Project manager is required."); return; }
    if (status === "approved" && (!approvedBy.trim() || !approvedDate)) {
      setError("Approved charters need both an approver name and the approval date.");
      return;
    }
    setError(null);

    const built: Charter = {
      id: initial?.id ?? `charter-${projectId}`,
      projectId,
      purpose: purpose.trim(),
      objectives: objectives.map((s) => s.trim()).filter(Boolean),
      inScope: inScope.map((s) => s.trim()).filter(Boolean),
      outOfScope: outOfScope.map((s) => s.trim()).filter(Boolean),
      successCriteria: successCriteria.map((s) => s.trim()).filter(Boolean),
      assumptions: assumptions.map((s) => s.trim()).filter(Boolean),
      constraints: constraints.map((s) => s.trim()).filter(Boolean),
      sponsor: sponsor.trim(),
      projectManager: projectManager.trim(),
      budgetSummary: budgetSummary.trim(),
      status,
      ...(status === "approved" ? {
        approvedBy: approvedBy.trim(),
        approvedDate,
      } : {}),
      lastUpdated: initial?.lastUpdated ?? new Date().toISOString().slice(0, 10),
    };
    onSave(built);
  }

  const title    = isNew ? "Create charter" : "Edit charter";
  const subtitle = templateMode
    ? "Standard template loaded. Adjust the text before saving."
    : isNew
    ? "The authorising document for this project. Required fields are marked."
    : `Last updated ${initial?.lastUpdated ?? "—"}`;
  const readiness = [
    { label: "Purpose", done: Boolean(purpose.trim()) },
    { label: "Outcomes", done: objectives.some(Boolean) && successCriteria.some(Boolean) },
    { label: "Scope", done: inScope.some(Boolean) || outOfScope.some(Boolean) },
    { label: "Governance", done: Boolean(sponsor.trim()) && Boolean(projectManager.trim()) },
  ];

  return (
    <EntityDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {isNew ? "Create charter" : "Save changes"}
          </button>
        </div>
      }
      variant="modal"
    >
      <form className="charter-editor" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <aside className="charter-editor__rail">
          <div className="form-guidance">
            <p className="form-guidance__eyebrow">Charter focus</p>
            <p className="form-guidance__title">Make the project easy to approve and audit.</p>
            <p className="form-guidance__body">
              Capture the promise, boundaries, success proof, and accountable owners before the team starts detailed delivery.
            </p>
          </div>

          <div className="charter-readiness">
            <p className="charter-readiness__title">Readiness checklist</p>
            <ul className="charter-readiness__list">
              {readiness.map((item) => (
                <li key={item.label} className="charter-readiness__item">
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      "charter-readiness__state",
                      item.done && "charter-readiness__state--done"
                    )}
                    aria-label={item.done ? "Complete" : "Needs input"}
                  />
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="charter-editor__main">
          <section className="form-section">
            <div className="form-section__head">
              <h3 className="form-section__title">Project intent</h3>
              <span className="form-section__meta">Why this exists</span>
            </div>
            <Field label="Purpose" required hint="One to three short paragraphs framing why this project exists.">
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={4}
                className={cn(inputCls, "min-h-[96px]")}
                placeholder="What problem does this project solve, and why now?"
              />
            </Field>
            <ListField label="Objectives" hint="Measurable outcomes. One per line." items={objectives} onChange={setObjectives} placeholder="e.g. Migrate 14,200 dossiers by 2026-08-15" />
          </section>

          <section className="form-section">
            <div className="form-section__head">
              <h3 className="form-section__title">Scope boundaries</h3>
              <span className="form-section__meta">What is included</span>
            </div>
            <div className="form-grid-2">
              <ListField label="In scope" items={inScope} onChange={setInScope} placeholder="e.g. Document workflows" />
              <ListField label="Out of scope" items={outOfScope} onChange={setOutOfScope} placeholder="e.g. QMS integration" />
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__head">
              <h3 className="form-section__title">Success proof</h3>
              <span className="form-section__meta">How SteerCo will judge it</span>
            </div>
            <ListField label="Success criteria" hint="How will you know it worked?" items={successCriteria} onChange={setSuccessCriteria} placeholder="e.g. Migration completeness >= 99.5%" />
            <div className="form-grid-2">
              <ListField label="Assumptions" items={assumptions} onChange={setAssumptions} placeholder="e.g. Vendor provides 2 consultants" />
              <ListField label="Constraints" items={constraints} onChange={setConstraints} placeholder="e.g. Go-live locked at 2026-09-02" />
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__head">
              <h3 className="form-section__title">Governance</h3>
              <span className="form-section__meta">Who owns approval</span>
            </div>
            <div className="form-grid-2">
              <Field label="Sponsor" required>
                <input
                  type="text"
                  value={sponsor}
                  onChange={(e) => setSponsor(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Dr Margaret Chen, VP Regulatory Affairs"
                />
              </Field>
              <Field label="Project manager" required>
                <input
                  type="text"
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Vineet Pathak"
                />
              </Field>
            </div>

            <Field label="Budget summary" hint="One line: total, breakdown, contingency.">
              <input
                type="text"
                value={budgetSummary}
                onChange={(e) => setBudgetSummary(e.target.value)}
                className={inputCls}
                placeholder="e.g. $1.85M total; $1.20M vendor; $0.45M internal; $0.20M contingency"
              />
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CharterStatus)}
                className={inputCls}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </Field>

            {status === "approved" && (
              <div className="form-grid-2">
                <Field label="Approved by" required>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className={inputCls}
                    placeholder="Sponsor name as it appears on the signoff"
                  />
                </Field>
                <Field label="Approval date" required>
                  <input
                    type="date"
                    value={approvedDate}
                    onChange={(e) => setApprovedDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
          </section>

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}
        </div>
      </form>
    </EntityDrawer>
  );
}

// ─── List-of-strings field with add / remove ─────────────────────────────────

function ListField({
  label, hint, items, onChange, placeholder, className,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  function updateAt(i: number, value: string) {
    onChange(items.map((x, idx) => (idx === i ? value : x)));
  }
  function removeAt(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function addOne() {
    onChange([...items, ""]);
  }
  const recommendation = charterListRecommendation(label);
  return (
    <Field label={label} hint={hint} className={className}>
      <div className="space-y-1.5">
        {items.length === 0 && (
          <div className="empty-guidance">
            <p className="empty-guidance__title">{recommendation.title}</p>
            <p className="empty-guidance__body">{recommendation.body}</p>
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <input
              type="text"
              value={item}
              onChange={(e) => updateAt(i, e.target.value)}
              className={cn(inputCls, "text-xs")}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Remove this entry"
              aria-label="Remove entry"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOne}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          Add {label.toLowerCase().replace(/s$/, "")}
        </button>
      </div>
    </Field>
  );
}

function charterListRecommendation(label: string) {
  switch (label) {
    case "Objectives":
      return {
        title: "Recommended: add 2-4 measurable outcomes.",
        body: "Use numbers, dates, or acceptance criteria so SteerCo can see what success means.",
      };
    case "In scope":
      return {
        title: "Recommended: name the work the team is accountable for.",
        body: "Include systems, workstreams, regions, integrations, data, validation, and go-live responsibilities.",
      };
    case "Out of scope":
      return {
        title: "Recommended: name what this project will not cover.",
        body: "Clear exclusions prevent late surprises, sponsor confusion, and hidden delivery risk.",
      };
    case "Success criteria":
      return {
        title: "Recommended: define the proof of success.",
        body: "Use test, migration, approval, adoption, and hypercare outcomes that can be evidenced later.",
      };
    case "Assumptions":
      return {
        title: "Recommended: record what must stay true.",
        body: "Capture vendor availability, source-data quality, business SME time, and environment readiness.",
      };
    case "Constraints":
      return {
        title: "Recommended: record hard limits early.",
        body: "Include fixed go-live dates, audit windows, budget caps, blackout periods, or resourcing limits.",
      };
    default:
      return {
        title: "Recommended: add the key entries before approval.",
        body: "Short, concrete entries make the charter easier to govern and audit.",
      };
  }
}
