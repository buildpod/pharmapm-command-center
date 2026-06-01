import { createElement } from "react";

export interface ProgressBarProps {
  value: number;
  minWidth?: number;
  showLabel?: boolean;
}

export function clampProgressValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function ProgressBar({ value, minWidth = 100, showLabel = true }: ProgressBarProps) {
  const pct = clampProgressValue(value);

  return createElement(
    "div",
    { className: "flex items-center gap-2", style: { minWidth } },
    createElement(
      "div",
      { className: "h-1.5 flex-1 overflow-hidden rounded-full bg-muted" },
      createElement("div", {
        className: "h-full rounded-full bg-primary transition-all",
        style: { width: `${pct}%` },
      }),
    ),
    showLabel
      ? createElement(
          "span",
          {
            className: "w-8 shrink-0 text-right text-[11px] font-semibold tabular-nums text-muted-foreground",
          },
          `${pct}%`,
        )
      : null,
  );
}
