# UI Quality Regression Register

Purpose: track enterprise-quality UI issues that unit tests do not catch, especially clipped actions, overcrowded forms, inconsistent typography, and confusing workflow language.

## Current Regression Command

Run from `v2`:

```bash
pnpm ui:regression
```

What it checks today:

- Key app routes return HTML from the verified local server.
- Shared drawer footer uses dynamic viewport height and safe bottom padding.
- Cost line form uses wide modal chrome instead of the narrow drawer pattern.

Current limitation: this is not a true pixel/browser interaction test. It cannot prove a button is visually unclipped. For that, the project should add Playwright screenshot and layout assertions.

## Open Quality Bar

Before calling a UI change done:

1. Run `pnpm test`.
2. Run `pnpm build`.
3. Run `pnpm dev:verified`.
4. Run `pnpm preview:check`.
5. Run `pnpm ui:regression`.
6. Browser-check the changed route at desktop and narrow widths.

## Issue Register

| ID | Surface | Issue | Severity | Status | Fix |
| --- | --- | --- | --- | --- | --- |
| UI-001 | Add cost line | Footer buttons can feel clipped/too close to browser chrome in the right drawer. | P1 | Fixed | Cost line now uses wide modal chrome; shared drawer footer has safe-area padding. |
| UI-002 | Entity forms | Several forms expose advanced fields too early for non-expert users. | P1 | Open | Progressive-disclose advanced scheduling/dependency fields by role or section. |
| UI-003 | End-to-end checks | No true browser screenshot regression exists yet. | P1 | Open | Add Playwright with modal/footer visibility assertions and screenshots. |

## Recommended Next Automation

Add Playwright as a dev dependency and create checks that:

- Open `/costs`, click `Add Cost Line`, assert the modal footer and primary action are fully inside the viewport.
- Open `/tasks`, click `Add Task`, assert advanced dependency content does not hide the action footer.
- Open `/milestones`, click `Add Milestone`, assert the modal fits at 1440x900 and 390x844.
- Capture screenshots for changed routes and store them as CI artifacts.
