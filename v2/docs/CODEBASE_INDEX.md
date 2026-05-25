# Codebase Index

Read this file first when returning to this project. It is a navigation map, not a full spec.

## Product Spine

The app is a project command center for regulated implementation work. The sellable wedge is: help a PM produce a credible SteerCo story, expose delivery risk early, and keep evidence behind the brief.

Canonical local URL:

```text
http://localhost:3000/pharmapm-command-center/v2/
```

Setup URL:

```text
http://localhost:3000/pharmapm-command-center/v2/setup/
```

## First Files To Read

1. `AIVELLO_OPERATING_DOC.md`
2. `v2/docs/LOCAL_SERVER_REGISTRY.md`
3. `v2/docs/CODEBASE_INDEX.md`
4. The specific file for the task below

## Main App Areas

| Area | Files |
|---|---|
| App shell, sidebar, topbar | `v2/app/(app)/layout.tsx`, `v2/components/sidebar.tsx`, `v2/components/topbar.tsx` |
| Project switcher/provider | `v2/components/projects/project-provider.tsx`, `v2/components/projects/project-switcher.tsx` |
| Project setup wizard | `v2/app/(app)/setup/page.tsx` |
| Project templates | `v2/lib/templates/project-templates.ts` |
| Discovery and feasibility logic | `v2/lib/setup/project-intake.ts` |
| Import parser and migration preview | `v2/lib/import/project-import.ts`, `v2/lib/import/project-import.test.ts` |
| Project management page | `v2/app/(app)/projects/page.tsx` |
| Entity store | `v2/lib/stores/entity-store.ts`, `v2/lib/repositories/entity-repository.ts` |
| Mock domain data and shared types | `v2/lib/mockData.ts` |
| Export workbook | `v2/components/projects/export-button.tsx`, `v2/lib/exporter.ts` |
| Delivery Signals | `v2/app/(app)/truth/page.tsx`, `v2/lib/domain/delivery-truth.ts` |
| Tasks grid and scheduling | `v2/components/tasks/tasks-grid.tsx`, `v2/lib/domain/scheduling.ts` |
| Reports | `v2/app/(app)/reports/page.tsx`, `v2/components/reports/*` |

## Setup Wizard Shape

`v2/app/(app)/setup/page.tsx` is a four-step client wizard:

1. Project Discovery
2. Build Method
3. Template Recommendation or Import & Map Existing Plan
4. Review & Create

Important state:

- `mode`: `template`, `import`, or `blank`
- `templateId`: selected template
- `projectCode`: user-visible identifier; internal `Project.id` still links records
- `intake`: discovery answers used for template recommendation and feasibility
- `preview`: import preview built from CSV/Excel records

## Import Rules

Accepted task headers include:

- Task name: `Task Name`, `Task title`, `Name`, `Title`
- Owner: `Resource Names`, `Assignments`, `Owner`, `Assigned to`
- Schedule: `Start`, `Start Date`, `Finish`, `Due Date`
- Progress: `Status`, `Priority`, `% Complete`
- Links: `Predecessors`, `Depends on`

Sample files live in:

```text
v2/public/samples/
```

Parser tests read those samples so broken samples fail CI.

## Local Dev Discipline

Read `v2/docs/LOCAL_SERVER_REGISTRY.md` before starting or sharing local URLs.

Fresh local server:

```bash
cd v2
pnpm dev:fresh
```

Verification:

```bash
pnpm test
pnpm build
```

Route smoke list:

```text
/, /setup/, /projects/, /reports/, /worklist/, /readiness/, /plan/, /governance/,
/charter/, /milestones/, /tasks/, /risks/, /documents/, /costs/, /resources/, /settings/
```

## Git Rules For This Project

When Vineet says `commit`, stage intended changes, commit, and push to `origin/main`.

Always provide a test link after app changes, commits, pushes, or deploy work.

Do not touch the original `pharmapm-pro` repo unless explicitly asked.
