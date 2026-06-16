"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDapEnabled } from "@/components/guidance/dap-settings";
import { Coachmark } from "@/components/ui/coachmark";
import { TOUR_STORAGE_KEY, toursByRoute, type TourStep } from "@/lib/guidance/tours";

type SeenMap = Record<string, boolean>;
type TourPhase = "intro" | "steps";

type TourIntro = {
  eyebrow: string;
  title: string;
  body: string;
  primaryAction: string;
};

function normalizeRoute(pathname: string) {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return Object.keys(toursByRoute)
    .sort((a, b) => b.length - a.length)
    .find((route) => normalized === route || normalized.startsWith(`${route}/`)) ?? normalized;
}

function readSeen(): SeenMap {
  try {
    const raw = window.localStorage.getItem(TOUR_STORAGE_KEY);
    return raw ? JSON.parse(raw) as SeenMap : {};
  } catch {
    return {};
  }
}

function markSeen(route: string) {
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ ...readSeen(), [route]: true }));
  } catch {}
}

function targetSelector(step: TourStep) {
  return `[data-tour-id="${step.anchor}"]`;
}

function getTourIntro(route: string): TourIntro {
  switch (route) {
    case "/setup":
      return {
        eyebrow: "Guided setup",
        title: "Let's build a command center you can trust.",
        body: "I'll walk you through the project facts, playbook choice, and review points before anything is created.",
        primaryAction: "Start setup guide",
      };
    case "/tasks":
      return {
        eyebrow: "Guided work",
        title: "Let's make schedule impact visible.",
        body: "I'll show where work is owned, where dates move, and how downstream tasks are reviewed before saving.",
        primaryAction: "Start task guide",
      };
    case "/truth":
      return {
        eyebrow: "Guided evidence",
        title: "Let's understand the delivery story.",
        body: "I'll show how the promise is judged, which records explain it, and what leadership choices are implied.",
        primaryAction: "Start signal guide",
      };
    case "/costs":
      return {
        eyebrow: "Guided finance",
        title: "Let's connect spend to delivery confidence.",
        body: "I'll show where budget, actuals, and burn become evidence for the project story.",
        primaryAction: "Start cost guide",
      };
    case "/reports":
      return {
        eyebrow: "Guided reporting",
        title: "Let's prepare a report you can defend.",
        body: "I'll show how to choose the audience, export the report, and backtrace claims to source records.",
        primaryAction: "Start report guide",
      };
    default:
      return {
        eyebrow: "Guided command center",
        title: "Hi, let's read the project story.",
        body: "I'll show the verdict, the numbers behind it, and the next actions that make this project board-ready.",
        primaryAction: "Start guided work",
      };
  }
}

export function PageTour() {
  const pathname = usePathname();
  const dapEnabled = useDapEnabled();
  const route = useMemo(() => normalizeRoute(pathname), [pathname]);
  const steps = toursByRoute[route] ?? [];
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<TourPhase>("intro");
  const [index, setIndex] = useState(0);
  const intro = getTourIntro(route);
  const step = steps[index];
  const dismiss = useCallback(() => {
    markSeen(route);
    setActive(false);
    setPhase("intro");
  }, [route]);

  useEffect(() => {
    if (!dapEnabled || !steps.length) {
      setActive(false);
      return;
    }
    const seen = readSeen();
    if (!seen[route]) {
      setIndex(0);
      setPhase("intro");
      setActive(true);
    } else {
      setActive(false);
    }
  }, [dapEnabled, route, steps.length]);

  useEffect(() => {
    function replay(event: Event) {
      const detail = (event as CustomEvent<{ route?: string }>).detail;
      if (detail?.route && detail.route !== route) return;
      if (!dapEnabled) return;
      if (!steps.length) return;
      setIndex(0);
      setPhase("intro");
      setActive(true);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && active) dismiss();
    }

    window.addEventListener("aivello:replay-tour", replay);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("aivello:replay-tour", replay);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, dapEnabled, dismiss, route, steps.length]);

  useEffect(() => {
    if (!active || phase !== "steps" || !step) return;
    const target = document.querySelector<HTMLElement>(targetSelector(step));
    target?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    target?.setAttribute("data-tour-active", "true");
    return () => target?.removeAttribute("data-tour-active");
  }, [active, phase, step]);

  if (!active || !step) return null;

  function start() {
    setIndex(0);
    setPhase("steps");
  }

  function next() {
    if (index >= steps.length - 1) {
      dismiss();
      return;
    }
    setIndex((value) => value + 1);
  }

  return (
    <div className="page-tour" aria-live="polite">
      {phase === "intro" ? (
        <aside className="tour-start-card" role="dialog" aria-label={intro.title}>
          <button type="button" className="tour-start-card__close" onClick={dismiss} aria-label="Close guide">
            ×
          </button>
          <div className="tour-start-card__visual" aria-hidden="true">
            <div className="tour-start-card__mock-shell">
              <span />
              <span />
              <span />
            </div>
            <div className="tour-start-card__mock-list">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="tour-start-card__body">
            <div className="tour-start-card__eyebrow">{intro.eyebrow}</div>
            <h2>{intro.title}</h2>
            <p>{intro.body}</p>
            <div className="tour-start-card__progress" aria-label={`0 of ${steps.length} steps complete`}>
              <span style={{ width: `${100 / (steps.length + 1)}%` }} />
            </div>
            <div className="tour-start-card__actions">
              <button type="button" className="coachmark__button" onClick={dismiss}>
                Skip
              </button>
              <button type="button" className="coachmark__button coachmark__button--primary" onClick={start}>
                {intro.primaryAction}
              </button>
            </div>
          </div>
        </aside>
      ) : (
        <Coachmark
          eyebrow={`Step ${index + 1} of ${steps.length}`}
          title={step.title}
          secondaryAction={
            <button type="button" className="coachmark__button" onClick={dismiss}>
              Dismiss
            </button>
          }
          primaryAction={
            <button type="button" className="coachmark__button coachmark__button--primary" onClick={next}>
              {index >= steps.length - 1 ? "Done" : "Next"}
            </button>
          }
        >
          {step.body}
        </Coachmark>
      )}
    </div>
  );
}
