"use client";

import { useDapEnabled, writeDapEnabled } from "@/components/guidance/dap-settings";

export function DapToggle() {
  const enabled = useDapEnabled();

  function replayGuide() {
    window.dispatchEvent(new CustomEvent("aivello:replay-tour"));
  }

  return (
    <div className="dap-control" aria-label="Guidance controls">
      <button
        type="button"
        className="dap-start-guide"
        onClick={replayGuide}
        disabled={!enabled}
        title={enabled ? "Start the page guide" : "Turn guidance on to start the page guide"}
      >
        Start guide
      </button>
      <button
        type="button"
        className={enabled ? "dap-toggle dap-toggle--on" : "dap-toggle"}
        onClick={() => writeDapEnabled(!enabled)}
        aria-pressed={enabled}
        title={enabled ? "Turn guidance off" : "Turn guidance on"}
      >
        {/* Plain PM language — "DAP" is adoption-industry jargon no operator knows. */}
        <span>Guidance</span>
        <strong>{enabled ? "On" : "Off"}</strong>
      </button>
    </div>
  );
}
