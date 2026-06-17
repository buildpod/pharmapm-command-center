"use client";

import { useDapEnabled, writeDapEnabled } from "@/components/guidance/dap-settings";

export function DapToggle() {
  const enabled = useDapEnabled();

  function replayGuide() {
    window.dispatchEvent(new CustomEvent("aivello:replay-tour"));
  }

  return (
    <div className="dap-control" aria-label="Digital adoption guidance">
      <button
        type="button"
        className="dap-start-guide"
        onClick={replayGuide}
        disabled={!enabled}
        title={enabled ? "Start the page guide" : "Turn DAP on to start the page guide"}
      >
        Start guide
      </button>
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
    </div>
  );
}
