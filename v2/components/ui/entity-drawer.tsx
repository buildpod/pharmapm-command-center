"use client";

import { cloneElement, Fragment, isValidElement, useEffect, useId, type ReactElement } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Right-anchored slide-over drawer with backdrop. Used for entity add/edit forms.
// ESC closes; clicking backdrop closes. Form lives in `children`, action buttons
// in `footer` (split so the footer doesn't scroll with the body).

export function EntityDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = "drawer",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  variant?: "drawer" | "modal";
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll behind drawer
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  const isModal = variant === "modal";
  const panel = (
    <div
      className={cn(
        isModal ? "entity-modal-panel" : "drawer-panel"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className={isModal ? "entity-modal-header" : "drawer-header"}>
        <div className="min-w-0">
          <h2 className={isModal ? "entity-modal-header__title" : "drawer-header__title"}>{title}</h2>
          {subtitle && <p className={isModal ? "entity-modal-header__subtitle" : "drawer-header__subtitle"}>{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="drawer-close"
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className={isModal ? "entity-modal-body" : "drawer-body"}>{children}</div>

      <footer className={isModal ? "entity-modal-footer" : "drawer-footer"}>{footer}</footer>
    </div>
  );

  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden
      />
      {isModal ? (
        <div className="entity-modal-wrap">
          {panel}
        </div>
      ) : panel}
    </>
  );
}

// Small confirm-delete prompt rendered inline (no extra modal). Use inside an
// EntityDrawer's body or as a controlled section the form toggles to.
export function ConfirmDelete({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 p-3 dark:bg-rose-950/30">
      <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
        Delete {label}?
      </p>
      <p className="mt-0.5 text-xs text-rose-600/80 dark:text-rose-400/80">
        This cannot be undone.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Standard form field wrapper for consistent labels + spacing across forms.
export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  // Associate the label with its control explicitly. A single form element gets
  // an injected id + matching htmlFor; composite children (e.g. a checkbox
  // group rendered as a <div>) keep their own structure with no broken
  // association. Outer element is a <div>, not a <label>, so nested control
  // labels inside composite fields stay valid.
  const generatedId = useId();
  const control =
    isValidElement(children) && children.type !== Fragment
      ? (children as ReactElement<{ id?: string }>)
      : null;
  const fieldId = control?.props.id ?? generatedId;
  return (
    <div className={cn("field", className)}>
      <label htmlFor={control ? fieldId : undefined} className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      {control ? cloneElement(control, { id: fieldId }) : children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function DrawerGuidance({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={cn("form-guidance", className)}>
      <p className="form-guidance__eyebrow">Recommendation</p>
      <p className="form-guidance__title">{title}</p>
      {children && <div className="form-guidance__body">{children}</div>}
    </aside>
  );
}

export const inputCls = "field-input";
