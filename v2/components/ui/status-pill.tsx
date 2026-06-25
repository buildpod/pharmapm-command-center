import { createElement, type ReactNode } from "react";

export type StatusTone = "rose" | "amber" | "blue" | "emerald" | "slate";

// Single source of truth for status colour, mapped to the bespoke muted
// regulatory palette (design-tokens.css) so StatusPill and its consumers match
// the dashboard's .pill instead of the brighter Tailwind scales. Tone → meaning:
// rose=risk, amber=warn, blue=info, emerald=ok, slate=neutral (§5.3 tone table).
// Dark variants intentionally omitted — dark mode is deferred (light is default).
export const statusToneClasses: Record<StatusTone, {
  pill: string;
  panel: string;
  metric: string;
  dot: string;
  ring: string;
}> = {
  rose: {
    pill: "border-transparent bg-[var(--color-status-risk-bg)] text-[var(--color-status-risk-fg)]",
    panel: "border-[var(--color-status-risk-bg)] bg-[var(--color-status-risk-bg)] text-[var(--color-status-risk-fg)]",
    metric: "border-[var(--color-line-soft)] bg-white/70",
    dot: "bg-[var(--color-status-risk-dot)]",
    ring: "ring-[var(--color-status-risk-dot)]",
  },
  amber: {
    pill: "border-transparent bg-[var(--color-status-warn-bg)] text-[var(--color-status-warn-fg)]",
    panel: "border-[var(--color-status-warn-bg)] bg-[var(--color-status-warn-bg)] text-[var(--color-status-warn-fg)]",
    metric: "border-[var(--color-line-soft)] bg-white/70",
    dot: "bg-[var(--color-status-warn-dot)]",
    ring: "ring-[var(--color-status-warn-dot)]",
  },
  blue: {
    pill: "border-transparent bg-[var(--color-status-info-bg)] text-[var(--color-status-info-fg)]",
    panel: "border-[var(--color-status-info-bg)] bg-[var(--color-status-info-bg)] text-[var(--color-status-info-fg)]",
    metric: "border-[var(--color-line-soft)] bg-white/70",
    dot: "bg-[var(--color-status-info-dot)]",
    ring: "ring-[var(--color-status-info-dot)]",
  },
  emerald: {
    pill: "border-transparent bg-[var(--color-status-ok-bg)] text-[var(--color-status-ok-fg)]",
    panel: "border-[var(--color-status-ok-bg)] bg-[var(--color-status-ok-bg)] text-[var(--color-status-ok-fg)]",
    metric: "border-[var(--color-line-soft)] bg-white/70",
    dot: "bg-[var(--color-status-ok-dot)]",
    ring: "ring-[var(--color-status-ok-dot)]",
  },
  slate: {
    pill: "border-transparent bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral-fg)]",
    panel: "border-[var(--color-line-soft)] bg-[var(--color-surface-sunk)] text-[var(--color-ink-500)]",
    metric: "border-[var(--color-line-soft)] bg-[var(--color-surface-card)]",
    dot: "bg-[var(--color-status-neutral-dot)]",
    ring: "ring-[var(--color-status-neutral-dot)]",
  },
};

export interface StatusPillProps {
  tone: StatusTone;
  children: ReactNode;
  size?: "xs" | "sm";
}

export function StatusPill({ tone, children, size = "xs" }: StatusPillProps) {
  return createElement(
    "span",
    {
      className: [
        "inline-flex items-center rounded-full border px-2 py-0.5 font-semibold",
        size === "sm" ? "text-[11px]" : "text-[10px]",
        statusToneClasses[tone].pill,
      ].join(" "),
    },
    children,
  );
}
