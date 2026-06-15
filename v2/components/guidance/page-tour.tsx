"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDapEnabled } from "@/components/guidance/dap-settings";
import { Coachmark } from "@/components/ui/coachmark";
import { TOUR_STORAGE_KEY, toursByRoute, type TourStep } from "@/lib/guidance/tours";

type SeenMap = Record<string, boolean>;

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

export function PageTour() {
  const pathname = usePathname();
  const dapEnabled = useDapEnabled();
  const route = useMemo(() => normalizeRoute(pathname), [pathname]);
  const steps = toursByRoute[route] ?? [];
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const dismiss = useCallback(() => {
    markSeen(route);
    setActive(false);
  }, [route]);

  useEffect(() => {
    if (!dapEnabled || !steps.length) {
      setActive(false);
      return;
    }
    const seen = readSeen();
    if (!seen[route]) {
      setIndex(0);
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
    if (!active || !step) return;
    const target = document.querySelector<HTMLElement>(targetSelector(step));
    target?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    target?.setAttribute("data-tour-active", "true");
    return () => target?.removeAttribute("data-tour-active");
  }, [active, step]);

  if (!active || !step) return null;

  function next() {
    if (index >= steps.length - 1) {
      dismiss();
      return;
    }
    setIndex((value) => value + 1);
  }

  return (
    <div className="page-tour" aria-live="polite">
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
    </div>
  );
}
