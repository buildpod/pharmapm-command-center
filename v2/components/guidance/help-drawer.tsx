"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { evmGlossary, helpByRoute } from "@/lib/guidance/help";

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

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function replayTour() {
    window.dispatchEvent(new CustomEvent("aivello:replay-tour", { detail: { route } }));
    onClose();
  }

  return (
    <div className="help-drawer" role="dialog" aria-modal="true" aria-label="How this page works">
      <button type="button" className="help-drawer__backdrop" aria-label="Close help" onClick={onClose} />
      <aside className="help-drawer__panel">
        <header className="help-drawer__header">
          <div>
            <div className="help-drawer__eyebrow">How this page works</div>
            <h2 className="help-drawer__title">{help.question}</h2>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close help">
            <X />
          </button>
        </header>

        <div className="help-drawer__body">
          <section>
            <h3 className="help-drawer__section-title">What you can do here</h3>
            <ul className="help-drawer__list">
              {help.canDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="help-drawer__section-title">Plain-language glossary</h3>
            <dl className="help-drawer__glossary">
              {evmGlossary.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <footer className="help-drawer__footer">
          <button type="button" className="btn btn--secondary" onClick={replayTour}>
            Replay the tour
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Got it
          </button>
        </footer>
      </aside>
    </div>
  );
}
