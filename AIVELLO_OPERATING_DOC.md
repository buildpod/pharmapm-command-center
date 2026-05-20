# PharmaPM Command Center Operating Doc

> Source of truth for this fork. Read this before making product, UI, algorithm, deployment, or repository changes.

## 1. What We Are Building

PharmaPM Command Center is a fork of `buildpod/pharmapm-pro` focused on making pharma project delivery easy to run in the current market reality: mixed teams of humans and AI agents, for example two agents plus four human-led workstreams. The PM should be able to set up, structure, and run any project with minimal tool knowledge. The product should feel like an enterprise command centre with an embedded AI operating partner: organized, guided, calm, audit-aware, and capable of turning intent into structured project actions. Until a real LLM is embedded, the UI must simulate that guidance through clear setup flows, next-best actions, templates, import tools, and plain-language prompts.

## 2. What Is Already Built

- GitHub repo: `https://github.com/buildpod/pharmapm-command-center`
- Public app: `https://buildpod.github.io/pharmapm-command-center/v2/`
- Reference/original repo: `https://github.com/buildpod/pharmapm-pro`
- Current app stack: Next.js, TypeScript, Tailwind, static export, GitHub Pages.
- Current v2 routes include Command Center, Worklist, Plan, Governance, Readiness, Tasks, Milestones, Risks, Documents, Costs, Resources, Reports, Charter, My Items, Projects, and Project Rules.
- Original `pharmapm-pro` must not be modified from this fork session unless Vineet explicitly asks for work in that repo.

## 3. Confirmed Architectural Decisions

### ADR-1: Static GitHub Pages deployment stays the default

The command-center preview is deployed through GitHub Pages. Do not switch to Vercel, Supabase, or a server-backed runtime without a new ADR.

### ADR-2: Keep engine correctness separate from UI polish

For scheduling, dependency, and cascade behavior, implement or verify the domain engine first, then polish the UI. A polished screen showing wrong project impact is worse than a plain screen showing correct impact.

### ADR-3: No heavy graph or visualization libraries by default

Dependency repair and schedule explanation UI should use existing React/Tailwind patterns. Do not add D3, Cytoscape, canvas graph engines, or similar heavy dependencies unless the scale problem has been demonstrated and Vineet approves.

### ADR-4: Role-guided IA is the current product direction

The app should lead with operating views rather than raw modules:

- Command Center: role-specific next actions.
- Worklist: what needs attention now.
- Plan: charter, milestones, tasks, schedule shape, and dependencies.
- Governance: risks, decisions, budget, and sponsor-ready follow-up.
- Readiness: validation, migration, training, and go-live checks.

Detailed module screens remain available, but should not be the only way a PM runs the project.

## 4. Current Module And Next Module

### Current Module: M6.1 - Product Spine Cleanup

Goal: tighten the product spine after dogfooding revealed the app was starting to feel like many screens stitched together. Fix the highest-friction UX issues before adding another feature: Delivery Truth empty-state correctness, dark-mode readability, guided setup safety, navigation hierarchy, and topbar accessibility.

Status: built locally; tests/build clean; browser render check partially complete.

Done means:

- Delivery Truth does not show false `100 credible` for an empty/new project; it shows a "not enough data yet" state with next setup actions.
- Delivery Truth tone cards are readable in dark mode and no longer use pale-card text combinations that wash out.
- Guided Setup is review-first. Primary action prepares a review, and project creation happens only after explicit confirmation.
- Sidebar exposes operating views first and moves raw detail modules under a clearer "Registers" group so the app feels less overgrown.
- Search, alerts, and export controls have stable accessible labels.
- Tests/build pass.
- Browser UAT checks Delivery Truth, setup confirmation, nav, and mobile menu.

Out of scope for this module:

- Authentication and permissions.
- Database migration.
- Multi-user collaboration.
- Full enterprise/portfolio hierarchy.
- Real LLM prediction or Monte Carlo simulation.
- Full agent token telemetry.
- Replacing existing detailed module screens.
- Building the Impact Ledger.
- Committing/deploying unless Vineet explicitly asks after review.

### Next Candidate Module: Impact Ledger

Potential goal: turn every material project event into an impact record that shows schedule, cost, quality, readiness, decision, and evidence consequences before the team drifts into month-four fire mode.

Candidate done means:

- Impact records can be created from schedule drift, issue/risk movement, document readiness, cost pressure, or manual PM input.
- Each impact record names what changed, why it matters, affected workstreams, affected artifacts, decision owner, and recommended next action.
- A first ledger view exists with filters by severity, workstream, and decision status.
- Impact records are deterministic and audit-friendly, not AI-generated prose without traceability.

## 5. Module Breakdown

- M1: Fork, public repo, GitHub Pages deployment.
- M2: Dependency repair workbench and alternative cycle-resolution algorithm.
- M3: Role-guided Command Center.
- M4: Operating views and simplified navigation.
- M5: Guided setup, import, and workstream onboarding.
- M6: Delivery Truth Foundation.
- M7: Impact Ledger.
- M8: Persistence/database path evaluation.
- M9: Multi-role permissions and collaboration model.
- M10: Audit/change feed and "what changed today".
- M11: Scenario planning and what-if saves.

## 5.1 Post-Launch Module Sequence

- Microsoft Project/Planner import path for common export formats.
- Free database proof of concept, likely Supabase or another low-friction hosted Postgres path.
- Role permissions and data access model.
- Audit trail surfaced as product UI.
- Export/share workflows for SteerCo, validation, and sponsor updates.
- Enterprise readiness review against Veeva-style usability, PMBOK expectations, and BuildPod factory agent workflows.

## 5.2 Tech-Debt Index

| ID | Severity | Origin | Issue | Proposed clearance |
|---|---|---|---|---|
| TD-1 | P1 | Fork setup | Root legacy app and v2 app coexist, which can confuse future sessions. | Document route ownership; do not edit root legacy app unless explicitly scoped. |
| TD-2 | P1 | Static export | No backend persistence yet; data is demo/local-first. | Decide database path before real project usage. |
| TD-3 | P2 | UI iteration | Some detailed screens still feel like raw grids. | Gradually wrap grids with role/workstream intent, filters, and next-action guidance. |
| TD-4 | P2 | GitHub Actions | Workflow annotation warns about Node 20 action deprecation. | Update actions to Node 24-compatible versions in a maintenance module. |

## 5.3 Design Tokens And Tone Semantics

Use one meaning per tone across badges, cards, toasts, drawers, and alerts:

- Rose: blocking issue, action needed.
- Amber: soft conflict, schedule risk, or attention needed.
- Blue: information, guidance, or opportunity.
- Emerald: success, readiness, or resolved state.
- Slate: neutral status.

Plain-language rule: do not show users terms like "cycle", "back-edge", "DFS", "SCC", "FS-rule", or internal helper names. Translate them into project language such as "waiting link", "blocked by", "schedule impact", or "recommended fix".

## 6. Known Issues Being Managed

- This is still a static demo app, not a production multi-user system.
- Some routes remain entity-first rather than role-first.
- Current UI has improved IA, but not a complete enterprise design-system pass.
- Live UAT should be repeated after every deploy because GitHub Pages can pass build while still serving stale or missing routes.

## 7. Backlog

- Guided project setup for blank projects, templates, and imports.
- Microsoft Project/Planner import and review flow.
- In-product guided onboarding by role, workstream, and agent/human ownership.
- "What changed today" activity feed.
- Undo/redo for key project edits.
- Scenario/what-if save and compare.
- Supabase or free database prototype.
- Permission model for PM, workstream lead, QA, data migration, sponsor, and admin roles.
- Compare against Veeva, MS Project, Primavera, Smartsheet, Monday, Asana, and Jira Product Discovery for enterprise PM usability patterns.

## 8. Last Session Log

### 2026-05-20 - M6.1 Product Spine Cleanup

Dogfood feedback was blunt: the app was starting to feel like a broad, vibe-coded collection of screens rather than one opinionated project operating system. M6.1 tightened the most visible issues before adding any new feature.

Built:

- Delivery Truth now has a data-coverage model. Empty/new projects show `not-ready` with setup actions instead of a false `100 credible`.
- Delivery Truth dark-mode contrast fixed by replacing pale-card text combinations with tone-aware dark classes.
- Delivery Truth decision-option owner pills now render as readable badges, not unlabeled switch-like controls.
- Guided Setup is now review-first. The primary button starts as `Review setup`; only a second explicit confirmation creates the project and imports tasks/owners.
- Sidebar detail section renamed from `DETAIL` to `REGISTERS` so detailed modules feel like drill-down registers, not the main product spine.
- Command palette trigger now opens through an explicit app event instead of dispatching a fake keyboard event.
- Alerts and Export controls gained stable accessible labels.

Verification:

- `pnpm test` passed: 141 passing, 4 skipped.
- `pnpm build` passed: 22 static pages.
- Local browser render check confirmed `/truth` shows `NOT READY` for an incomplete setup project, setup shows `Review setup`, and sidebar shows `REGISTERS`.
- Some browser click automation was unstable after page load (`Runtime.evaluate` / screenshot CDP timeouts), so final manual dogfood is still recommended before deploy.

Next:

- If this cleanup feels right, commit/deploy M6.1.
- Then continue toward M7 Impact Ledger, but only after the product spine feels calmer.

### 2026-05-19 - M6 Delivery Truth Foundation

Built the first deterministic Delivery Truth layer for the command-center fork. This is the first product-defining move away from "better PM dashboard" and toward an AI-native project operating system: the app now calculates whether the project promise is still credible, which conditions are changing that promise, and what decision options the PM should take to leadership.

Built:

- `v2/docs/DELIVERY_TRUTH_ENGINE.md` formal spec covering purpose, inputs, outputs, signal rules, scoring, non-goals, and test coverage.
- `v2/lib/domain/delivery-truth.ts` pure TypeScript engine. It calculates confidence score, confidence band, target vs forecast date, budget pressure, ordered delivery signals, traceable source records, and deterministic decision options.
- `v2/lib/domain/delivery-truth.test.ts` with coverage for clean project, schedule drift, cost pressure, document/decision debt, readiness compression, blocked work, high-risk pressure, and combined signal confidence.
- `/truth` operating route showing "Is the project promise still credible?", top delivery signals, source traces, budget/date pressure, and decision options.
- Sidebar, command palette, and topbar wiring for Delivery Truth.

Decided:

- Delivery Truth stays deterministic first. No LLM prediction, Monte Carlo, database, or impact ledger persistence in M6.
- Current route reads the existing entity store and project context; no new dependency or parallel state layer.
- Signals use plain-language PM framing: promise, pressure, readiness, decisions, and trace, not implementation language.

Verification:

- `pnpm test` passed: 140 passing, 4 skipped.
- `pnpm build` passed: 22 static pages generated, including `/truth`.
- Browser UAT was not completed because the local dev server bind was blocked by sandbox permissions and escalation was unavailable in this session. Remaining risk: visual layout needs a browser pass before deploy.

Next:

- Dogfood `/truth` locally or after deploy.
- If the direction holds, M7 should become the Impact Ledger: persistent records for schedule, cost, readiness, decision, evidence, and quality consequences.

### 2026-05-19 - Guided setup and import module

Built the first guided setup/import layer. Added `/v2/setup/` as a PM-facing start path with three options: guided template, Microsoft Project/Planner import, and blank project shell. Added a pure import mapper for CSV, pasted tables, and Excel-derived rows that detects Planner vs Project shape, maps tasks, owners, workstreams, status, priority, progress, and waiting links, then creates app tasks/team members after review. Renamed the Command Center operating roles from "Junior PM / Senior PM" to "PM Operator / Program Lead" to match the human-plus-agent delivery model.

Verification: `pnpm test` passed with 132 passing and 4 skipped tests. `pnpm build` passed and generated 21 static pages including `/setup`. Local browser UAT passed for `/pharmapm-command-center/v2/setup/` and `/pharmapm-command-center/v2/`.

Next: Vineet should dogfood the setup/import flow, then say whether to commit/deploy or refine the flow before publishing.

### 2026-05-19 - Operating views deployed

Built and deployed the first simplified operating-view pass for the command-center fork. Added Command Center, Worklist, Plan, Governance, and Readiness as top-level product views; reorganized the sidebar around RUN, CONTROL, DETAIL, and ADMIN; polished route copy and status language. Verified `pnpm test`, `pnpm build`, GitHub Pages deployment, live HTTP 200 checks, and browser UAT for public routes. Latest deployed commit: `2071af4`.

Decision: keep the original `pharmapm-pro` repo untouched and treat `pharmapm-command-center` as the comparison/prototype space.

Next: prioritize M5 as guided setup/import/workstream onboarding, then decide whether database/persistence or a full design-system pass follows.

## 9. Anti-Drift Rules

- Work in `pharmapm-command-center` unless Vineet explicitly asks for another repo.
- Do not change `buildpod/pharmapm-pro` while working on command-center comparisons.
- One main module per session. New ideas go to the backlog unless Vineet expands scope.
- Read this operating doc before non-trivial changes.
- If a route is deployed, verify the live GitHub Pages URL, not just local output.
- Do not add production dependencies without clear need and approval.
- For UI, plain language beats technical accuracy visible to end users.
- For PM workflows, actionability beats dashboards that only report status.
- The product should support human-led and agent-led workstreams as first-class delivery units.
- Partial success or attention states are amber, not red.
- Every error message should answer what happened, why it matters, and what to do next.

## 10. Glossary

- Command Center: the main role-guided project operating surface.
- Operating view: a page organized around a project job-to-be-done, not just an entity table.
- DAP: digital adoption platform; in this product, use lightweight contextual guidance rather than a heavy third-party layer by default.
- Agent-led workstream: a project workstream where an AI agent owns or executes structured tasks, with human oversight.
- Guided setup: the path that turns a PM's intent, template, or imported plan into a usable project structure.
- Waiting link: user-facing language for a task dependency relationship.
- Readiness: validation, migration, training, and go-live preparation health.
