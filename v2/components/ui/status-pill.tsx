import { createElement, type ReactNode } from "react";

export type StatusTone = "rose" | "amber" | "blue" | "emerald" | "slate";

export const statusToneClasses: Record<StatusTone, {
  pill: string;
  panel: string;
  metric: string;
  dot: string;
  ring: string;
}> = {
  rose: {
    pill: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100",
    panel: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-100",
    metric: "border-rose-200 bg-white/70 dark:border-rose-800/70 dark:bg-rose-950/40",
    dot: "bg-rose-500",
    ring: "ring-rose-300",
  },
  amber: {
    pill: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100",
    panel: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100",
    metric: "border-amber-200 bg-white/70 dark:border-amber-800/70 dark:bg-amber-950/40",
    dot: "bg-amber-500",
    ring: "ring-amber-300",
  },
  blue: {
    pill: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-100",
    panel: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-100",
    metric: "border-blue-200 bg-white/70 dark:border-blue-800/70 dark:bg-blue-950/40",
    dot: "bg-blue-500",
    ring: "ring-blue-300",
  },
  emerald: {
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100",
    panel: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100",
    metric: "border-emerald-200 bg-white/70 dark:border-emerald-800/70 dark:bg-emerald-950/40",
    dot: "bg-emerald-500",
    ring: "ring-emerald-300",
  },
  slate: {
    pill: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200",
    panel: "border-border bg-muted/30 text-muted-foreground",
    metric: "border-border bg-background",
    dot: "bg-slate-300",
    ring: "ring-slate-300",
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
