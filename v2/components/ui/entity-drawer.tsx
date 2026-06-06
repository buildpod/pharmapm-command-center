"use client";

import { useEffect } from "react";
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
        "z-50 flex w-full flex-col border-border bg-card shadow-2xl",
        isModal
          ? "pointer-events-auto max-h-[calc(100vh-2rem)] max-w-5xl overflow-hidden rounded-lg border animate-in fade-in-0 zoom-in-95 duration-200"
          : "fixed right-0 top-0 h-full max-w-md border-l animate-in slide-in-from-right duration-200"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

      <footer className="border-t border-border bg-muted/30 px-5 py-3">{footer}</footer>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {isModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
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
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
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
    <aside className={cn("rounded-md border border-border bg-muted/40 px-3 py-2.5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Recommendation
      </p>
      <p className="mt-1 text-xs font-medium leading-5 text-foreground">{title}</p>
      {children && <div className="mt-1 text-xs leading-5 text-muted-foreground">{children}</div>}
    </aside>
  );
}

export const inputCls =
  "rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
