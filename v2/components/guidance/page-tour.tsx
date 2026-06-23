"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useDapEnabled } from "@/components/guidance/dap-settings";
import {
  ACTIVE_COMMAND_CENTER_JOURNEY_KEY,
  COMMAND_CENTER_JOURNEY_SEEN_KEY,
  TOUR_STORAGE_KEY,
  commandCenterJourney,
  toursByRoute,
  type TourStep,
} from "@/lib/guidance/tours";

type SeenMap = Record<string, boolean>;
type TourMode = "route" | "journey";
type TourPhase = "intro" | "steps";
type TargetBox = { top: number; left: number; width: number; height: number };

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

function readJourneySeen() {
  try {
    return window.localStorage.getItem(COMMAND_CENTER_JOURNEY_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markJourneySeen() {
  try {
    window.localStorage.setItem(COMMAND_CENTER_JOURNEY_SEEN_KEY, "1");
    window.sessionStorage.removeItem(ACTIVE_COMMAND_CENTER_JOURNEY_KEY);
  } catch {}
}

function writeActiveJourney(index: number) {
  try {
    window.sessionStorage.setItem(ACTIVE_COMMAND_CENTER_JOURNEY_KEY, JSON.stringify({ index }));
  } catch {}
}

function readActiveJourney(): { index: number } | null {
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_COMMAND_CENTER_JOURNEY_KEY);
    return raw ? JSON.parse(raw) as { index: number } : null;
  } catch {
    return null;
  }
}

function clearActiveJourney() {
  try {
    window.sessionStorage.removeItem(ACTIVE_COMMAND_CENTER_JOURNEY_KEY);
  } catch {}
}

function targetSelector(step: TourStep) {
  return `[data-tour-id="${step.anchor}"]`;
}

function getTargetBox(target: HTMLElement): TargetBox {
  const rect = target.getBoundingClientRect();
  const padding = 8;
  return {
    top: Math.max(8, rect.top - padding),
    left: Math.max(8, rect.left - padding),
    width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
    height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
  };
}

function getStepCardStyle(targetBox: TargetBox | null): CSSProperties {
  if (!targetBox || typeof window === "undefined") {
    return { right: 24, bottom: 24, width: 392 };
  }

  const cardWidth = 392;
  const estimatedCardHeight = 260;
  const gap = 18;
  const margin = 20;
  const left = Math.min(Math.max(targetBox.left, margin), window.innerWidth - cardWidth - margin);
  const below = targetBox.top + targetBox.height + gap;
  const top = below + estimatedCardHeight < window.innerHeight
    ? below
    : Math.max(margin, targetBox.top - estimatedCardHeight - gap);

  return { top, left, width: cardWidth };
}

function getTourIntro(route: string): TourIntro {
  switch (route) {
    case "/setup":
      return {
        eyebrow: "Guided setup",
        title: "Hi Vineet, let's build a command center you can trust.",
        body: "I'll walk you through the project facts, playbook choice, and review points before anything is created.",
        primaryAction: "Start setup guide",
      };
    case "/tasks":
      return {
        eyebrow: "Guided work",
        title: "Hi Vineet, let's make schedule impact visible.",
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
        title: "Hi Vineet, let's read the project story.",
        body: "I'll show the verdict, the numbers behind it, and the next actions that make this project board-ready.",
        primaryAction: "Start guided work",
      };
  }
}

export function PageTour() {
  const pathname = usePathname();
  const router = useRouter();
  const dapEnabled = useDapEnabled();
  const route = useMemo(() => normalizeRoute(pathname), [pathname]);
  const routeSteps = toursByRoute[route] ?? [];
  const journeySteps = commandCenterJourney.steps;
  const [mode, setMode] = useState<TourMode>("route");
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<TourPhase>("intro");
  const [index, setIndex] = useState(0);
  const [targetBox, setTargetBox] = useState<TargetBox | null>(null);
  const steps = mode === "journey" ? journeySteps : routeSteps;
  const intro = mode === "journey" ? commandCenterJourney : getTourIntro(route);
  const step = steps[index];
  const progress = phase === "intro" ? 100 / (steps.length + 1) : ((index + 1) / steps.length) * 100;
  const dismiss = useCallback(() => {
    if (mode === "journey") {
      markJourneySeen();
    } else {
      markSeen(route);
    }
    setActive(false);
    setPhase("intro");
    setTargetBox(null);
  }, [mode, route]);

  const goToStep = useCallback((nextIndex: number) => {
    const nextStep = steps[nextIndex];
    if (!nextStep) return;
    setIndex(nextIndex);
    if (mode === "journey") writeActiveJourney(nextIndex);
    if (nextStep.route && nextStep.route !== route) {
      setTargetBox(null);
      router.push(nextStep.route);
    }
  }, [mode, route, router, steps]);

  useEffect(() => {
    if (!dapEnabled) {
      setActive(false);
      return;
    }
    const activeJourney = readActiveJourney();
    if (activeJourney && !readJourneySeen()) {
      const safeIndex = Math.min(Math.max(activeJourney.index, 0), journeySteps.length - 1);
      setMode("journey");
      setIndex(safeIndex);
      setPhase("steps");
      setActive(true);
      const nextRoute = journeySteps[safeIndex]?.route;
      if (nextRoute && nextRoute !== route) router.replace(nextRoute);
      return;
    }
    if (!routeSteps.length) {
      setActive(false);
      return;
    }
    if (route === "/" && !readJourneySeen()) {
      setMode("journey");
      setIndex(0);
      setPhase("intro");
      setActive(true);
      return;
    }
    const seen = readSeen();
    if (!seen[route]) {
      setMode("route");
      setIndex(0);
      setPhase("intro");
      setActive(true);
    } else {
      setActive(false);
    }
  }, [dapEnabled, journeySteps, route, routeSteps.length, router]);

  useEffect(() => {
    function replay(event: Event) {
      const detail = (event as CustomEvent<{ route?: string }>).detail;
      if (!dapEnabled) return;
      if (detail && "route" in detail) {
        if (detail.route && detail.route !== route) return;
        if (!routeSteps.length) return;
        clearActiveJourney();
        setMode("route");
        setIndex(0);
        setPhase("intro");
        setActive(true);
        return;
      }
      if (!journeySteps.length) return;
      setMode("journey");
      setIndex(0);
      setPhase("intro");
      setActive(true);
      writeActiveJourney(0);
      const firstRoute = journeySteps[0]?.route;
      if (firstRoute && firstRoute !== route) router.push(firstRoute);
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
  }, [active, dapEnabled, dismiss, journeySteps, route, routeSteps.length, router]);

  useEffect(() => {
    if (!active || phase !== "steps" || !step) {
      setTargetBox(null);
      return;
    }
    const target = document.querySelector<HTMLElement>(targetSelector(step));
    if (!target) {
      setTargetBox(null);
      return;
    }
    const tourTarget = target;

    function syncTarget() {
      setTargetBox(getTargetBox(tourTarget));
    }

    tourTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    tourTarget.setAttribute("data-tour-active", "true");
    syncTarget();
    const timer = window.setTimeout(syncTarget, 260);
    window.addEventListener("resize", syncTarget);
    window.addEventListener("scroll", syncTarget, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", syncTarget);
      window.removeEventListener("scroll", syncTarget, true);
      tourTarget.removeAttribute("data-tour-active");
    };
  }, [active, phase, step]);

  if (!active || !step) return null;

  function start() {
    setPhase("steps");
    goToStep(0);
  }

  function next() {
    if (index >= steps.length - 1) {
      dismiss();
      return;
    }
    goToStep(index + 1);
  }

  function back() {
    if (index === 0) {
      setPhase("intro");
      return;
    }
    goToStep(index - 1);
  }

  return (
    <div className="page-tour" aria-live="polite">
      {phase === "steps" ? (
        <>
          <div className="page-tour__scrim" aria-hidden="true" />
          {targetBox ? (
            <div
              className="page-tour__spotlight"
              aria-hidden="true"
              style={{
                top: targetBox.top,
                left: targetBox.left,
                width: targetBox.width,
                height: targetBox.height,
              }}
            />
          ) : null}
        </>
      ) : null}
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
              <span style={{ width: `${progress}%` }} />
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
        <aside className="tour-step-card" role="dialog" aria-label={step.title} style={getStepCardStyle(targetBox)}>
          <div className="tour-step-card__header">
            <span className="tour-step-card__eyebrow">Step {index + 1} of {steps.length}</span>
            <button type="button" className="tour-step-card__close" onClick={dismiss} aria-label="Close guide">
              ×
            </button>
          </div>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
          <div className="tour-start-card__progress" aria-label={`${index + 1} of ${steps.length} steps complete`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="tour-step-card__actions">
            <button type="button" className="coachmark__button" onClick={dismiss}>
              Skip
            </button>
            <button type="button" className="coachmark__button" onClick={back}>
              Back
            </button>
            <button type="button" className="coachmark__button coachmark__button--primary" onClick={next}>
              {index >= steps.length - 1 ? "Done" : step.nextLabel ?? "Next"}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
