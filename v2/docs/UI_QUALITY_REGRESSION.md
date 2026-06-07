# UI Quality Regression Register

Purpose: track enterprise-quality UI issues that unit tests do not catch, especially clipped actions, overcrowded forms, inconsistent typography, and confusing workflow language.

## Current Regression Command

Run from `v2`:

```bash
pnpm ui:regression
```

For release work, run the full gate:

```bash
pnpm release:verify
```

That command runs unit tests, production build, and the browser UI regression to completion, then writes:

- `output/release-checks/latest.md`
- `output/release-checks/latest.json`

If one check fails, the command still runs the remaining checks before exiting. This is intentional: patch from the complete failure pattern, not from the first symptom.

What it checks today:

- Key app routes render in Chromium at desktop and mobile sizes.
- Sidebar navigation reaches every main product area.
- Topbar search, theme toggle, notifications, and project switcher open without errors.
- Entity create modals expose visible Close, Cancel, and primary action buttons inside the viewport.
- Charter standard-template flow opens with prefilled content.
- Reports tabs and evidence links remain navigable.

Current limitation: this is still a guardrail, not a human product review. It does not certify that every microcopy choice is optimal, and it intentionally avoids destructive clicks such as confirming deletes.

## Open Quality Bar

Before calling a UI change done:

1. Run `pnpm release:verify`.
2. Read `output/release-checks/latest.md`.
3. Group failures by shared cause: shared shell, route page, entity modal, data store, import parser, or deployment/static asset.
4. Patch the smallest shared cause.
5. Rerun `pnpm release:verify`.
6. Browser-check the changed route at desktop and narrow widths when the patch is UI-visible.
7. Only then commit, push, and provide the GitHub Pages test link.

## Failure Triage Standard

| Failure pattern | Likely dependency | Patch rule |
| --- | --- | --- |
| Same issue appears on many pages | Shared layout, sidebar, topbar, token CSS, or modal shell | Fix the shared component once; do not patch each page separately. |
| Only one route fails | Route page or route-specific component | Keep the patch local to that route unless the same pattern exists elsewhere. |
| Desktop passes and mobile fails | Responsive CSS, touch target, overflow, sticky footer, or accessible label | Fix the responsive/accessibility layer and rerun both viewports. |
| Unit tests fail but UI passes | Domain logic, stores, import mapping, or formatting helpers | Do not compensate in UI; fix the underlying logic or test expectation. |
| Build fails but tests pass | Type boundary, static export, route metadata, or client/server split | Fix compile/static-export issue before any UI review. |
| GitHub Pages differs from local | Static asset path, cache, deployment branch, or out-of-date main | Verify build output and deployment source before changing product code. |

## Issue Register

| ID | Surface | Issue | Severity | Status | Fix |
| --- | --- | --- | --- | --- | --- |
| UI-001 | Add cost line | Footer buttons can feel clipped/too close to browser chrome in the right drawer. | P1 | Fixed | Cost line now uses wide modal chrome; shared drawer footer has safe-area padding. |
| UI-002 | Entity forms | Several forms expose advanced fields too early for non-expert users. | P1 | Open | Progressive-disclose advanced scheduling/dependency fields by role or section. |
| UI-003 | End-to-end checks | No true browser interaction regression existed. | P1 | Fixed | Playwright route, nav, topbar, modal action, charter template, and report evidence tests added. |
| UI-004 | Release workflow | Checks were run separately, so failures could be patched one symptom at a time. | P1 | Fixed | Added `pnpm release:verify` to run all gates and write a release report before patching. |

## Recommended Next Automation

Recommended next additions:

- Add CI artifact upload for `output/playwright-report`.
- Add screenshot baselines only after the visual design stabilizes.
- Add role-based test profiles: Contributor, PM, Admin.
- Add a non-destructive button inventory test that records every visible button by route and flags new untested controls.
