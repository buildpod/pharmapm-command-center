"use client";

import { useDapEnabled, writeDapEnabled } from "@/components/guidance/dap-settings";

export function DapToggle() {
  const enabled = useDapEnabled();

  return (
    <button
      type="button"
      className={enabled ? "dap-toggle dap-toggle--on" : "dap-toggle"}
      onClick={() => writeDapEnabled(!enabled)}
      aria-pressed={enabled}
      title={enabled ? "Turn guided work off" : "Turn guided work on"}
    >
      <span>DAP</span>
      <strong>{enabled ? "On" : "Off"}</strong>
    </button>
  );
}
