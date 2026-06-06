"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import type { Milestone, MilestoneStatus } from "@/lib/mockData";
import { EntityDrawer, ConfirmDelete, DrawerGuidance, Field, inputCls } from "@/components/ui/entity-drawer";
import { isIsoDate, inProjectRange, addCalendarDays, PROJECT_DATE_MIN, PROJECT_DATE_MAX } from "@/lib/validation";

const PHASES = ["Initiation", "Design", "Config", "Testing", "Training", "Go-Live"] as const;
const STATUSES: MilestoneStatus[] = ["pending", "in-progress", "at-risk", "complete"];

function nextMilestoneId(all: Milestone[]): string {
  const nums = all
    .map((m) => parseInt(m.id.replace(/^m/, ""), 10))
    .filter((n) => !Number.isNaN(n));
  return `m${(nums.length > 0 ? Math.max(...nums) : 0) + 1}`;
}

// Self-contained drawer + form. Parent passes the entity (or null for "new")
// and the save/delete callbacks. Form state is internal and resets on each open.

export function MilestoneFormDrawer({
  open,
  initial,
  allMilestones,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean;
  initial: Milestone | null; // null = creating new
  allMilestones: Milestone[];
  onSave: (m: Milestone) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const isNew = initial === null;

  const [name,         setName]         = useState("");
  const [phase,        setPhase]        = useState<string>("Config");
  const [owner,        setOwner]        = useState("VP");
  const [predecessor,  setPredecessor]  = useState("");
  const [duration,     setDuration]     = useState<number>(5);
  const [lag,          setLag]          = useState<number>(0);
  const [plannedDate,  setPlannedDate]  = useState("");
  const [forecastDate, setForecastDate] = useState("");
  const [status,       setStatus]       = useState<MilestoneStatus>("pending");
  const [locked,       setLocked]       = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Reset form whenever the drawer opens with a different entity
  useEffect(() => {
    if (!open) return;
    setName(initial?.name             ?? "");
    setPhase(initial?.phase           ?? "Config");
    setOwner(initial?.owner           ?? "VP");
    setPredecessor(initial?.predecessor ?? "");
    setDuration(initial?.duration     ?? 5);
    setLag(initial?.lag               ?? 0);
    setPlannedDate(initial?.plannedDate  ?? "");
    setForecastDate(initial?.forecastDate ?? "");
    setStatus(initial?.status         ?? "pending");
    setLocked(initial?.locked         ?? false);
    setConfirming(false);
    setError(null);
  }, [open, initial]);

  function handleSave() {
    if (!name.trim())             { setError("Name is required"); return; }
    if (!plannedDate)             { setError("Planned date is required"); return; }
    if (!isIsoDate(plannedDate))   { setError("Planned date must be yyyy-mm-dd"); return; }
    if (!isIsoDate(forecastDate))  { setError("Forecast date must be yyyy-mm-dd"); return; }
    if (!inProjectRange(plannedDate))  { setError(`Planned date must be between ${PROJECT_DATE_MIN} and ${PROJECT_DATE_MAX}`); return; }
    if (!inProjectRange(forecastDate)) { setError(`Forecast date must be between ${PROJECT_DATE_MIN} and ${PROJECT_DATE_MAX}`); return; }
    if (predecessor) {
      const pred = allMilestones.find((m) => m.id === predecessor);
      if (pred && plannedDate < pred.plannedDate) {
        setError(`Planned date can't be before predecessor (${pred.name}: ${pred.plannedDate})`);
        return;
      }
    }
    if (predecessor && predecessor === initial?.id) {
      setError("A milestone can't depend on itself"); return;
    }
    setError(null);

    const id = initial?.id ?? nextMilestoneId(allMilestones);
    const built: Milestone = {
      id,
      name: name.trim(),
      phase,
      owner: owner.trim() || "VP",
      plannedDate,
      forecastDate: forecastDate || plannedDate,
      status,
      locked,
      duration,
      lag,
      ...(predecessor ? { predecessor } : {}),
      projectId: initial?.projectId ?? "", // parent grid overwrites with activeProjectId
    };
    onSave(built);
  }

  function handleDelete() {
    if (initial) onDelete(initial.id);
  }

  const title    = isNew ? "Add milestone" : `Edit · ${initial?.name ?? ""}`;
  const subtitle = isNew
    ? "Add a new milestone to the schedule. Predecessor, duration, and lag drive schedule impact review."
    : `${initial?.id?.toUpperCase()} · ${initial?.phase}`;

  // Predecessors exclude self
  const predOptions = allMilestones.filter((m) => m.id !== initial?.id);

  return (
    <EntityDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <div className="flex items-center justify-between gap-2">
          {!isNew ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={confirming}
              className="flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
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
              {isNew ? "Add milestone" : "Save changes"}
            </button>
          </div>
        </div>
      }
      variant="modal"
    >
      {confirming && initial ? (
        <ConfirmDelete
          label={`milestone "${initial.name}"`}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      ) : (
        <form
          className="milestone-editor"
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        >
          <aside className="milestone-editor__rail">
            <DrawerGuidance title="Use milestones for decision gates or delivery proof points, not every activity.">
              Connect predecessors only when timing truly depends on another milestone.
            </DrawerGuidance>
            <div className="milestone-summary">
              <div className="milestone-summary__label">Schedule impact</div>
              <div className="milestone-summary__value">{duration + lag} days</div>
              <div className="milestone-summary__meta">
                {predecessor ? "After selected predecessor" : "No predecessor selected"}
              </div>
            </div>
            <div className="milestone-summary">
              <div className="milestone-summary__label">Governance note</div>
              <div className="milestone-summary__meta">
                Lock only board-approved dates or external commitments.
              </div>
            </div>
          </aside>

          <div className="milestone-editor__main">
            <section className="form-section">
              <div className="form-section__head">
                <h3 className="form-section__title">Milestone identity</h3>
                <span className="form-section__meta">Name the proof point and owner</span>
              </div>
              <div className="form-grid-2">
                <Field label="Name" required className="form-span-all">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vault Configuration — Sprint 3"
                    className={inputCls}
                    autoFocus
                  />
                </Field>

                <Field label="Phase" required>
                  <select value={phase} onChange={(e) => setPhase(e.target.value)} className={inputCls}>
                    {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>

                <Field label="Owner" hint="Accountable initials">
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value.toUpperCase().slice(0, 4))}
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section__head">
                <h3 className="form-section__title">Schedule logic</h3>
                <span className="form-section__meta">Dependency and effort assumptions</span>
              </div>
              <div className="form-grid-2">
                <Field label="Predecessor" hint="Choose one only when this milestone cannot finish before it." className="form-span-all">
                  <select
                    value={predecessor}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPredecessor(next);
                      if (next && !plannedDate) {
                        const pred = allMilestones.find((m) => m.id === next);
                        if (pred?.plannedDate) {
                          const suggest = addCalendarDays(pred.plannedDate, lag + 1);
                          setPlannedDate(suggest);
                        }
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">— none —</option>
                    {predOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id.toUpperCase()} · {m.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Duration" hint="Working days to complete the milestone.">
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
                    className={inputCls}
                  />
                </Field>

                <Field label="Lag" hint="Waiting time after the predecessor.">
                  <input
                    type="number"
                    min={0}
                    value={lag}
                    onChange={(e) => setLag(Math.max(0, Number(e.target.value) || 0))}
                    className={inputCls}
                  />
                </Field>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section__head">
                <h3 className="form-section__title">Dates and control</h3>
                <span className="form-section__meta">Target, forecast, and governance state</span>
              </div>
              <div className="form-grid-4">
                <Field label="Planned date" required hint="Committed target date.">
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="Forecast date" hint="Update when reality changes.">
                  <input
                    type="date"
                    value={forecastDate}
                    onChange={(e) => setForecastDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
                    className={inputCls}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>

                <Field label="Locked" hint="Protect approved dates.">
                  <label className="milestone-lock">
                    <input
                      type="checkbox"
                      checked={locked}
                      onChange={(e) => setLocked(e.target.checked)}
                    />
                    <span>{locked ? "Locked" : "Unlocked"}</span>
                  </label>
                </Field>
              </div>
            </section>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}
          </div>
        </form>
      )}
    </EntityDrawer>
  );
}
