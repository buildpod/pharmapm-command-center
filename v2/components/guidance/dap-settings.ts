"use client";

import { useEffect, useState } from "react";

export const GUIDANCE_DAP_KEY = "aivello_guidance_dap_enabled_v1";
export const GUIDANCE_DAP_EVENT = "aivello:guidance-dap-change";

export function readDapEnabled() {
  try {
    return window.localStorage.getItem(GUIDANCE_DAP_KEY) !== "0";
  } catch {
    return true;
  }
}

export function writeDapEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(GUIDANCE_DAP_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new CustomEvent(GUIDANCE_DAP_EVENT, { detail: enabled }));
  } catch {}
}

export function useDapEnabled() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(readDapEnabled());

    function onChange(event: Event) {
      setEnabled((event as CustomEvent<boolean>).detail);
    }

    window.addEventListener(GUIDANCE_DAP_EVENT, onChange);
    return () => window.removeEventListener(GUIDANCE_DAP_EVENT, onChange);
  }, []);

  return enabled;
}
