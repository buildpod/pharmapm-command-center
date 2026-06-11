"use client";

// CX-3 deep links: register pages call useFocusRow() once; any row carrying
// data-focus-id={entityId} is scrolled into view and flash-highlighted when
// the page is opened with ?focus=<entityId> (e.g. from a Delivery Signals
// trace chip). Reads window.location directly — useSearchParams would force a
// Suspense boundary under static export for no benefit here.

import { useEffect } from "react";

const FLASH_MS = 2400;

export function useFocusRow(): void {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("focus");
    if (!id) return;
    let attempts = 0;
    let timer: number | undefined;
    const tryFocus = () => {
      const el = document.querySelector(`[data-focus-id="${CSS.escape(id)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("focus-flash");
        timer = window.setTimeout(() => el.classList.remove("focus-flash"), FLASH_MS);
      } else if (attempts < 10) {
        // grids hydrate from localStorage after mount — retry briefly
        attempts += 1;
        timer = window.setTimeout(tryFocus, 100);
      }
    };
    tryFocus();
    return () => window.clearTimeout(timer);
  }, []);
}
