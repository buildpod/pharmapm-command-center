import { CharterView } from "@/components/charter/charter-view";

export default function CharterPage() {
  return (
    <div>
      <header className="page-header" data-tour-id="charter-summary">
        <div className="page-header__eyebrow">Project record</div>
        <h1 className="page-header__title t-page-title">Project Charter</h1>
        <p className="page-header__meta">
          The formal authorisation for this project — purpose, objectives, scope, sponsor, and approval. Reference document for every SteerCo decision.
        </p>
      </header>
      <div data-tour-id="charter-doc">
        <CharterView />
      </div>
    </div>
  );
}
