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

### Current Module: UI simplification and guided operating views

Goal: make the app easy for a PM, workstream lead, or human/agent delivery team to set up and run a project with minimal tool training.

Done means:

- The public GitHub Pages app loads at `/v2/` without 404.
- Command Center, Worklist, Plan, Governance, and Readiness routes are deployed and reachable.
- Sidebar labels are organized around project operating modes, not only data entities.
- UI copy uses plain project language, not graph-theory or implementation terms.
- The setup and run experience feels guided, as if an AI project assistant is helping structure the work even before real LLM features exist.
- Tests and build pass before commit or deploy.
- Browser or live URL UAT confirms the deployed app, not only local files.

Out of scope for this module:

- Authentication and permissions.
- Database migration.
- Multi-user collaboration.
- Full design-system rebuild.
- Replacing the scheduling engine.

### Next Candidate Module: Guided setup and import layer

Potential goal: add guided project setup, Microsoft Project/Planner import, and role/workstream coaching similar to a lightweight DAP, without adding a heavy third-party platform.

Candidate done means:

- A PM can start from a blank project, a template, or a Microsoft Project/Planner export.
- Imported tasks, owners, dates, dependencies, and milestones are mapped into the command-center model with a review step before save.
- Each human or agent-led workstream has a first-run path and "what should happen next?" guidance.
- Guidance is contextual and dismissible, not a marketing tour.
- PMs can reach the next action from any main operating view.
- Guidance respects tone semantics and does not over-alert.

## 5. Module Breakdown

- M1: Fork, public repo, GitHub Pages deployment.
- M2: Dependency repair workbench and alternative cycle-resolution algorithm.
- M3: Role-guided Command Center.
- M4: Operating views and simplified navigation.
- M5: Guided setup, import, and workstream onboarding.
- M6: Persistence/database path evaluation.
- M7: Multi-role permissions and collaboration model.
- M8: Audit/change feed and "what changed today".
- M9: Scenario planning and what-if saves.

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
