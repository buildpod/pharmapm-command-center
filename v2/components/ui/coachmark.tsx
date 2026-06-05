import { type ReactNode } from "react";

export interface CoachmarkProps {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

export function Coachmark({
  eyebrow = "Guide",
  title,
  children,
  primaryAction,
  secondaryAction,
}: CoachmarkProps) {
  return (
    <aside className="coachmark" role="note">
      <div className="coachmark__eyebrow">{eyebrow}</div>
      <div className="coachmark__title">{title}</div>
      <div className="coachmark__body">{children}</div>
      {(primaryAction || secondaryAction) && (
        <div className="coachmark__actions">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </aside>
  );
}
