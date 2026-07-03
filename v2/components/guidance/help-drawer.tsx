"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Map, PlayCircle, Search, X } from "lucide-react";
import { useDapEnabled, writeDapEnabled } from "@/components/guidance/dap-settings";
import { helpByRoute, productGlossary } from "@/lib/guidance/help";

// Guide panel shaped like the market standard for in-app help (Intercom
// Messenger / Pendo Resource Center): search first, tour launchers as rows
// (icon + title + description + chevron), short icon-led lists, glossary
// collapsed by default, and guidance on/off as a real switch in the footer.
// One action per row — never a wall of buttons.
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
  const [query, setQuery] = useState("");
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Open clean every time — a stale query hiding content reads as broken.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const canDo = useMemo(() => (q ? help.canDo.filter((i) => i.toLowerCase().includes(q)) : help.canDo), [help, q]);
  const howDoI = useMemo(() => (q ? help.howDoI.filter((i) => i.toLowerCase().includes(q)) : help.howDoI), [help, q]);
  const glossary = useMemo(
    () => (q ? productGlossary.filter((t) => `${t.term} ${t.definition}`.toLowerCase().includes(q)) : productGlossary),
    [q],
  );
  const nothingMatches = q !== "" && canDo.length === 0 && howDoI.length === 0 && glossary.length === 0;

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
      <button type="button" className="help-drawer__backdrop" aria-label="Close guide" onClick={onClose} />
      <aside className="help-drawer__panel">
        <header className="help-drawer__header">
          <div>
            <div className="help-drawer__eyebrow">Guide</div>
            <h2 className="help-drawer__title">Help &amp; tours</h2>
            <p className="help-drawer__question">{help.question}</p>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close guide">
            <X />
          </button>
        </header>

        <div className="help-drawer__body">
          <label className="help-drawer__search">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search this guide…"
              aria-label="Search this guide"
            />
          </label>

          {!q && (
            <section className="help-drawer__tours" aria-label="Guided walkthroughs">
              <button type="button" className="help-drawer__row" onClick={startPageTour}>
                <PlayCircle aria-hidden="true" />
                <span>
                  <strong>Tour this page</strong>
                  <em>Spotlight the key controls, one step at a time.</em>
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
              <button type="button" className="help-drawer__row" onClick={startProductJourney}>
                <Map aria-hidden="true" />
                <span>
                  <strong>Full product journey</strong>
                  <em>Setup → dashboard → milestones → tasks → reports.</em>
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
            </section>
          )}

          {canDo.length > 0 && (
            <section>
              <h3 className="help-drawer__section-title">What this page is for</h3>
              <ul className="help-drawer__list">
                {canDo.map((item) => (
                  <li key={item}>
                    <CheckCircle2 aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {howDoI.length > 0 && (
            <section>
              <h3 className="help-drawer__section-title">How do I…</h3>
              <ul className="help-drawer__list">
                {howDoI.map((item) => (
                  <li key={item}>
                    <ArrowRight aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {glossary.length > 0 && (
            <details
              className="help-drawer__glossary-details"
              open={glossaryOpen || q !== ""}
              onToggle={(event) => setGlossaryOpen((event.target as HTMLDetailsElement).open)}
            >
              <summary>
                <BookOpen aria-hidden="true" />
                Glossary
                <span>{glossary.length} term{glossary.length === 1 ? "" : "s"}</span>
              </summary>
              <dl className="help-drawer__glossary">
                {glossary.map((item) => (
                  <div key={item.term}>
                    <dt>{item.term}</dt>
                    <dd>{item.definition}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          {nothingMatches && (
            <p className="help-drawer__empty">
              No matches for “{query}”. Try a term like “report”, “risk”, or “schedule” — or clear the search and start
              the page tour.
            </p>
          )}
        </div>

        <footer className="help-drawer__footer">
          <button
            type="button"
            role="switch"
            aria-checked={dapEnabled}
            className="help-drawer__switch"
            onClick={() => writeDapEnabled(!dapEnabled)}
          >
            <span className="help-drawer__switch-track" aria-hidden="true">
              <span className="help-drawer__switch-thumb" />
            </span>
            Tours, highlights &amp; nudges
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Got it
          </button>
        </footer>
      </aside>
    </div>
  );
}
