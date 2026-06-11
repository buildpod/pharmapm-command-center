# Command Centre PharmaPM Pro

Compact operating context for this fork. Read this first before product, UI, test, deployment, or GitHub work.

## Identity

- Repo: `https://github.com/buildpod/pharmapm-command-center`
- Hosted app: `https://buildpod.github.io/pharmapm-command-center/v2/`
- Local app: `http://localhost:3000/pharmapm-command-center/v2/`
- Current branch used for design work: `design-harmonization`
- GitHub Pages deploys from `main`
- Original reference repo: `https://github.com/buildpod/pharmapm-pro`
- Do not edit original `pharmapm-pro` unless Vineet explicitly asks.

## Product Thesis

PharmaPM Command Center is a regulated-project command center for pharma implementation work. It should help a PM create a credible SteerCo story, see delivery risk early, and keep evidence behind every claim.

The product should feel like a calm enterprise operating partner:

- guided enough for non-expert PMs
- dense enough for real delivery work
- plain-language, not engineering jargon
- audit-aware for regulated environments
- useful for human teams plus AI-agent-assisted workstreams

## Current UX Direction

Default user flow:

1. Unauthenticated user: login/welcome page in future.
2. First-time authenticated user with no project: `New Project` / setup wizard.
3. After project creation: dashboard with a guided setup-review prompt.
4. Returning user with active project: dashboard for the active project.

Navigation rule:

- Sidebar is for running a project, not every setup state.
- Create/import/reuse project actions belong under project switcher, command palette, or Manage Projects.
- Main nav should lead with Dashboard, Delivery Signals, Reports, Worklist, My Items, Readiness Gates, Plan, Governance, and record registers.

## Built Product Surface

Current v2 routes include:

- Dashboard
- Delivery Signals
- Reports
- New Project / Setup
- Worklist
- My Items
- Readiness Gates
- Plan
- Governance
- Charter
- Milestones
- Tasks
- Risks
- Documents
- Costs
- People & Meetings
- Manage Projects
- Rules & Settings

Setup wizard shape:

1. Project Discovery
2. Build Method
3. Template Recommendation / Import & Map / Saved Template
4. Review & Create

Setup supports:

- predefined templates
- Microsoft Project / Planner / Excel / CSV import preview
- saved project templates
- blank base skeleton

Manage Projects supports:

- switch/open project
- delete local project and related records
- export project data
- save existing project as reusable template

Saved templates are prototype-only browser `localStorage` in `v2/lib/templates/custom-project-templates.ts`.

## Core Architecture Decisions

1. Static GitHub Pages remains default deployment.
2. Keep schedule/dependency correctness separate from UI polish.
3. Avoid heavy graph/visualization libraries unless scale proves the need.
4. Role-guided operating views matter more than raw module lists.
5. When Vineet says `commit`, commit and push intended changes to GitHub unless he says local-only.
6. Always provide a test link after app changes, commits, pushes, or deploy work.
7. Read `v2/docs/LOCAL_SERVER_REGISTRY.md` before local server work.
8. Imports must show mapping, preview, missing data, and unresolved links before creation.
9. Saved templates are useful for releases/rollouts, but need backend persistence before enterprise use.
10. Release work must run the full verification gate before push.
11. One financial truth (Phase-2, 2026-06-11): the EVM snapshot (lib/domain/evm.ts, shared via useProjectEvm) is the single measurement layer for confidence and cost pressure across the dashboard verdict and Delivery Signals. Delivery-truth signals are the explanation layer (sources, why-it-matters, decisions). The deduction-score heuristic survives only as the no-EVM fallback. Sample data is opt-in and badged (CX-7); templates declare an honesty tier (CX-4).

## Quality And Release Gate

Default release verification from `v2`:

```bash
pnpm release:verify
```

This runs:

- `pnpm test`
- `pnpm build`
- `pnpm ui:regression`

It writes:

- `v2/output/release-checks/latest.md`
- `v2/output/release-checks/latest.json`

Do not patch from the first visible symptom. Let the gate finish, read the full report, group issues by shared cause, patch the smallest shared component, then rerun the full gate.

Current pushed release gate commit:

- `312c9c9 Add release UI regression gate`

## Test Links To Provide

- Local: `http://localhost:3000/pharmapm-command-center/v2/`
- Hosted: `https://buildpod.github.io/pharmapm-command-center/v2/`
- Repo: `https://github.com/buildpod/pharmapm-command-center`

## Important Files

- Project map: `v2/docs/CODEBASE_INDEX.md`
- UI/UX standard: `v2/docs/MASTER_UI_UX.md`
- UI regression protocol: `v2/docs/UI_QUALITY_REGRESSION.md`
- Local server registry: `v2/docs/LOCAL_SERVER_REGISTRY.md`
- Setup wizard: `v2/app/(app)/setup/page.tsx`
- Dashboard: `v2/app/(app)/page.tsx`
- Sidebar/topbar: `v2/components/sidebar.tsx`, `v2/components/topbar.tsx`
- Entity store: `v2/lib/stores/entity-store.ts`
- Templates: `v2/lib/templates/project-templates.ts`, `v2/lib/templates/custom-project-templates.ts`
- Import parser: `v2/lib/import/project-import.ts`
- Delivery Signals: `v2/app/(app)/truth/page.tsx`, `v2/lib/domain/delivery-truth.ts`
- Reports: `v2/app/(app)/reports/page.tsx`, `v2/components/reports/*`
- Browser regression: `v2/tests/e2e/ui-regression.spec.ts`
- Release gate: `v2/scripts/release-verify.mjs`

## Known Product Limits

- Static demo app, not production multi-user software.
- Browser-local project data and saved templates are not shared or auditable.
- Some record screens still need progressive disclosure for non-expert users.
- Import preview exists, but arbitrary user column mapping is not fully editable yet.
- No authentication, roles, backend database, or audit trail yet.

## Next Product Priorities

1. Make first-run project creation clearly useful: setup, review tour, verify milestones/tasks/risks/charter/owners/dates.
2. Improve entity modal information hierarchy so new users can act without certification.
3. Add backend persistence for projects, templates, imports, and audit history.
4. Add organization template library with permissions, versioning, and audit events.
5. Expand import mapping for Microsoft Project, Planner, and messy Excel exports.
6. Add role-based onboarding for PM, workstream lead, QA, sponsor, and admin.

## Working Rule For Future AI Sessions

Start with:

1. Read this file.
2. Read `v2/docs/CODEBASE_INDEX.md`.
3. If doing UI, read `v2/docs/MASTER_UI_UX.md` and `v2/docs/UI_QUALITY_REGRESSION.md`.
4. If running local preview, read `v2/docs/LOCAL_SERVER_REGISTRY.md`.
5. Make the smallest modular change.
6. Run `pnpm release:verify` before push.
7. Provide the hosted test link after push.
