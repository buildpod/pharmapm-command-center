"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useDapEnabled, writeDapEnabled } from "@/components/guidance/dap-settings";
import { helpByRoute, productGlossary } from "@/lib/guidance/help";

export function HelpDrawer({
  open,
  route,
  onClose,
}: {
  open: boolean;
  route: string;
  onClose: () => void;
}) {
  const help = helpByRoute[route] ?? helpByRoute["/"];
  const dapEnabled = useDapEnabled();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function startPageTour() {
    if (!dapEnabled) writeDapEnabled(true);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("aivello:replay-tour", { detail: { route } }));
    }, 0);
    onClose();
  }

  function startProductJourney() {
    if (!dapEnabled) writeDapEnabled(true);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("aivello:replay-tour"));
    }, 0);
    onClose();
  }

  return (
    <div className="help-drawer" role="dialog" aria-modal="true" aria-label="Guide">
      <button type="button" className="help-drawer__backdrop" aria-label="Close help" onClick={onClose} />
      <aside className="help-drawer__panel">
        <header className="help-drawer__header">
          <div>
            <div className="help-drawer__eyebrow">Guide</div>
            <h2 className="help-drawer__title">{help.question}</h2>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close help">
            <X />
          </button>
        </header>

        <div className="help-drawer__body">
          <section className="help-drawer__tour-actions" aria-label="Guided walkthroughs">
            <button type="button" className="btn btn--primary" onClick={startPageTour}>
              Start page tour
            </button>
            <button type="button" className="btn btn--secondary" onClick={startProductJourney}>
              Product journey
            </button>
            <p>
              DAP is {dapEnabled ? "on" : "off"}. Starting a guide turns DAP on so the overlay, highlights, and nudges are visible.
            </p>
          </section>

          <section>
            <h3 className="help-drawer__section-title">Current page purpose</h3>
            <ul className="help-drawer__list">
              {help.canDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="help-drawer__section-title">How do I...</h3>
            <ul className="help-drawer__list">
              {help.howDoI.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="help-drawer__section-title">Glossary</h3>
            <dl className="help-drawer__glossary">
              {productGlossary.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <footer className="help-drawer__footer">
          <button type="button" className="btn btn--secondary" onClick={startProductJourney}>
            Replay product journey
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Got it
          </button>
        </footer>
      </aside>
    </div>
  );
}
