import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Shared page-title block — the SINGLE place a screen heading is defined, so a
// heading change is one edit, not one-per-page. Renders the same markup the
// pages used inline: an <h1> (which picks up the brand serif from globals) plus
// a muted subtitle. Pass `icon` for a leading glyph, `actions` for a
// right-aligned control (switches the header to a space-between row).
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
  tourId,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  className?: string;
  /** Maps to data-tour-id for the guided-tour anchors. */
  tourId?: string;
}) {
  return (
    <header
      className={cn(actions ? "flex flex-wrap items-start justify-between gap-3" : "space-y-1", className)}
      data-tour-id={tourId}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5 text-primary" /> : null}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
