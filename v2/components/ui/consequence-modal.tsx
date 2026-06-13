"use client";

import { X } from "lucide-react";
import { ConsequenceStory, type ImpactAssumptions } from "@/components/ui/impact-drawer";
import type { ConsequenceProjection } from "@/lib/domain/consequence";

// A lightweight, reusable modal for perturbations that don't need the schedule
// cascade table (cost-overcharge, and later absence). It renders the same
// ConsequenceStory used in the schedule-impact drawer — one truth, two surfaces.
// The parent owns the editable state and recomputes `projection`; this is
// presentational so any grid can reuse it.
export function ConsequenceModal({
  open,
  title,
  subtitle,
  projection,
  assumptions,
  onAssumptionsChange,
  primaryControl,
  recordLabel = "Record this",
  onRecord,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  projection: ConsequenceProjection | null;
  assumptions: ImpactAssumptions;
  onAssumptionsChange: (next: ImpactAssumptions) => void;
  primaryControl?: React.ReactNode;   // e.g. the over-charge amount input
  recordLabel?: string;
  onRecord?: () => void;
  onClose: () => void;
}) {
  if (!open || !projection) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden />
      <div className="impact-modal-wrap">
        <div className="impact-modal-panel" role="dialog" aria-modal="true" aria-label={title}>
          <header className="impact-modal-header">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="impact-modal-header__title">{title}</h2>
                {subtitle && <p className="impact-modal-header__subtitle">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="drawer-close" title="Close (Esc)">
                <X className="h-4 w-4" />
              </button>
            </div>
            {primaryControl && <div className="mt-3">{primaryControl}</div>}
          </header>

          <div className="impact-modal-body">
            <ConsequenceStory c={projection} assumptions={assumptions} onAssumptionsChange={onAssumptionsChange} />
          </div>

          <footer className="impact-modal-footer">
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                Close
              </button>
              {onRecord && (
                <button
                  onClick={onRecord}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {recordLabel}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
