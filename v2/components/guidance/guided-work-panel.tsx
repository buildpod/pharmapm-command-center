"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, ListChecks, Sparkles } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { useDapEnabled } from "@/components/guidance/dap-settings";
import { GUIDANCE_ROLE_EVENT, GUIDANCE_ROLE_KEY } from "@/components/guidance/role-selector";
import {
  buildGuidedWork,
  guidanceRoleLabel,
  type GuidanceRole,
  type GuidanceTone,
} from "@/lib/guidance/guided-work";
import { useEntityStore } from "@/lib/stores/entity-store";

const roleValues: GuidanceRole[] = ["pm", "sponsor", "qa"];

function readRole(): GuidanceRole {
  try {
    const stored = window.localStorage.getItem(GUIDANCE_ROLE_KEY);
    return roleValues.includes(stored as GuidanceRole) ? stored as GuidanceRole : "pm";
  } catch {
    return "pm";
  }
}

function toneClass(tone: GuidanceTone) {
  return `guided-work__tone guided-work__tone--${tone}`;
}

export function GuidedWorkPanel({
  route,
  showChecklist = false,
  compact = false,
}: {
  route: string;
  showChecklist?: boolean;
  compact?: boolean;
}) {
  const { activeProject } = useProject();
  const charters = useEntityStore((s) => s.charters);
  const milestones = useEntityStore((s) => s.milestones);
  const tasks = useEntityStore((s) => s.tasks);
  const risks = useEntityStore((s) => s.risks);
  const documents = useEntityStore((s) => s.documents);
  const costLines = useEntityStore((s) => s.costLines);
  const issues = useEntityStore((s) => s.issues);
  const decisionRecords = useEntityStore((s) => s.decisionRecords);
  const [role, setRole] = useState<GuidanceRole>("pm");
  const [collapsed, setCollapsed] = useState(false);
  const dapEnabled = useDapEnabled();

  useEffect(() => {
    setRole(readRole());
    function onRoleChange(event: Event) {
      const nextRole = (event as CustomEvent<GuidanceRole>).detail;
      if (roleValues.includes(nextRole)) setRole(nextRole);
    }
    window.addEventListener(GUIDANCE_ROLE_EVENT, onRoleChange);
    return () => window.removeEventListener(GUIDANCE_ROLE_EVENT, onRoleChange);
  }, []);

  const guidance = useMemo(() => buildGuidedWork({
    project: activeProject,
    charters,
    milestones,
    tasks,
    risks,
    documents,
    costLines,
    issues,
    decisionRecords,
  }, role, route), [
    activeProject,
    charters,
    milestones,
    tasks,
    risks,
    documents,
    costLines,
    issues,
    decisionRecords,
    role,
    route,
  ]);

  const doneCount = guidance.readiness.filter((item) => item.status === "done").length;
  const topNudges = guidance.nudges.slice(0, showChecklist ? 4 : 2);

  if (!dapEnabled) return null;

  return (
    <section className={compact ? "guided-work guided-work--compact" : "guided-work"} data-tour-id="guided-work">
      <button
        type="button"
        className="guided-work__summary"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
      >
        <span className="guided-work__icon"><Sparkles /></span>
        <span>
          <small>Guided work</small>
          <strong>{guidance.page.title}</strong>
          <em>{guidance.page.body}</em>
        </span>
        <span className="guided-work__mode">
          {guidanceRoleLabel(role)}
          {topNudges.length > 0 ? ` · ${topNudges.length} action${topNudges.length === 1 ? "" : "s"}` : " · clear"}
        </span>
        <ChevronDown className={collapsed ? "" : "guided-work__chevron--open"} />
      </button>

      {!collapsed && (
        <div className="guided-work__body">
          {showChecklist && (
            <div className="guided-work__card guided-work__card--checklist">
              <div className="guided-work__card-head">
                <div>
                  <span className="guided-work__eyebrow">Setup to usable command center</span>
                  <h2>Project readiness checklist</h2>
                </div>
                <span className="pill pill--info">{doneCount} of {guidance.readiness.length} ready</span>
              </div>
              <div className="guided-work__checklist">
                {guidance.readiness.map((item) => (
                  <Link key={item.id} href={item.href} className="guided-work__item">
                    <span className={toneClass(item.tone)}>
                      {item.status === "done" ? <CheckCircle2 /> : <ListChecks />}
                    </span>
                    <span>
                      <strong>{item.label}</strong>
                      <em>{item.description}</em>
                    </span>
                    <span className="guided-work__cta">{item.cta} <ChevronRight /></span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="guided-work__card">
            <div className="guided-work__card-head">
              <div>
                <span className="guided-work__eyebrow">What needs attention</span>
                <h2>{topNudges.length ? "Live nudges from project data" : "No active guidance issues"}</h2>
              </div>
            </div>
            {topNudges.length ? (
              <div className="guided-work__nudge-list">
                {topNudges.map((nudge) => (
                  <Link key={nudge.id} href={nudge.href} className="guided-work__nudge">
                    <span className={toneClass(nudge.tone)}><Sparkles /></span>
                    <span>
                      <strong>{nudge.title}</strong>
                      <em>{nudge.body}</em>
                    </span>
                    <ChevronRight />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="guided-work__quiet">
                No data-backed guidance to show right now. Keep the next status cycle focused on the current path.
              </p>
            )}
          </div>

          <div className="guided-work__actions" aria-label="What you can do here">
            {guidance.page.actions.map((action) => (
              <span key={action}>{action}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
