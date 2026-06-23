# PharmaPM Command Center UAT Results

Executed against local preview `http://localhost:3000/pharmapm-command-center/v2/` on 2026-06-23.

## Summary

| Status | Count |
|---|---:|
| PASS | 54 |
| FAIL | 10 |
| BLOCKED | 0 |
| HUMAN-PENDING | 11 |
| Total criteria | 75 |

## Must Failures

- O1.1 - FAIL - Expected known gap: "Mine" / lead-owned filtering is still hardcoded to `VP`.
- O4.3 - FAIL - Added scope can be modeled, but there is no verified accept-scope workflow that records both the cost addition and decision as one committed scope decision.
- O9.2 - FAIL - Reports use current scoped project state and pending decisions, but do not include accepted slips/decisions from the audit log for the reporting period.
- O10.1 - FAIL - Expected known gap: no time-series snapshots, so confidence/go-live deltas since last reporting point cannot be shown.

## Run Notes

- Product behavior was not changed.
- No new product dependencies were added.
- No new tests were committed; AUTO logic criteria mapped to existing deterministic tests where available, with UI/visual criteria verified through browser evidence and source inspection.
- Pre-flagged expected fails were recorded as expected: O1.1, O8.4, O10.
- Browser evidence files are in `v2/docs/uat-artifacts/`.
- `pnpm ui:regression` was also run during evidence gathering: 18/22 passed. The four failures were both desktop/mobile variants of the setup flow tests, caused by strict Playwright matching on multiple `Continue` buttons after the new setup cockpit. Product behavior was not fixed per instruction.

## Evidence Map

- Import and mapping logic: `v2/lib/import/project-import.test.ts`.
- Playbook and saved-template logic: `v2/lib/templates/project-templates.test.ts`, `v2/lib/templates/custom-project-templates.test.ts`.
- Guided readiness and live nudges: `v2/lib/guidance/guided-work.test.ts`.
- Delivery truth, status integrity, and one financial truth: `v2/lib/domain/delivery-truth.test.ts`, `v2/lib/domain/status-integrity.test.ts`.
- Impact math, absorbed slips, cost pressure, scope addition, absence, and T&M assumptions: `v2/lib/domain/consequence.test.ts`.
- Frozen baseline: `v2/lib/domain/baseline-commitment.test.ts`.
- Scheduling cascade and overrides: `v2/lib/domain/scheduling.algorithm.test.ts`.
- Reports and evidence links: `v2/lib/reports/report-data.test.ts`.
- Browser evidence: `v2/docs/uat-artifacts/uat-browser-check.json`.

## Setup UAT Matrix

| ID | Pri | Verify | Status | Evidence |
|---|---|---|---|---|
| J0.1 | must | AUTO | PASS | Browser evidence: launchpad renders instead of empty dashboard (`uat-browser-check.json`, `uat-j0-launchpad.png`). |
| J0.2 | must | VISUAL | PASS | Screenshot shows the one-line product promise and core issue statement (`uat-j0-launchpad.png`). |
| J0.3 | must | AUTO | PASS | Browser evidence confirms all four start paths are visible: sample, playbook, import, blank. |
| J0.4 | should | HUMAN | HUMAN-PENDING | Left for Vineet: ask a non-PM to summarize the app after viewing launchpad. |
| J1.1 | must | AUTO | PASS | `project-templates.test.ts` covers pharma playbooks generating real milestones, tasks, documents, owners, risks, costs, and scope. |
| J1.2 | must | AUTO | PASS | `project-import.test.ts` proves non-standard headers are importable with explicit column mapping; setup source includes `ColumnMapper` for detected headers. |
| J1.3 | must | AUTO | PASS | `project-import.test.ts` imports task/milestone rows without requiring cost columns; cost lines are additive only when present. |
| J1.4 | must | AUTO | PASS | `custom-project-templates.test.ts` verifies saved templates recreate the model with shifted dates and reset progress. |
| J1.5 | must | AUTO | PASS | Source path `mode === "blank"` creates a project shell without template/import records and shows blank-shell copy before review. |
| J1.6 | should | AUTO | PASS | Launchpad browser evidence shows "Explore sample project"; provider path sets sample opt-in and active sample project. |
| J1.7 | should | VISUAL | PASS | Setup screenshot shows "creates" and "then guide the PM through" before commit (`uat-j1-next-before-commit.png`). |
| J2.1 | must | AUTO | PASS | Browser evidence: review screen shows generated operating model and category counts (`review.hasCategoryCounts=true`). |
| J2.2 | must | AUTO | PASS | Setup source renders `coverageWarnings`; guided-work/report tests verify missing budget/evidence is shown honestly. |
| J2.3 | must | AUTO | PASS | `project-import.test.ts` verifies wrong/non-standard mapping can be corrected and preview output reflows. |
| J2.4 | should | AUTO | FAIL | Review screen exposes tabs/counts but no verified edit/remove/defer control for individual records before create. |
| J2.5 | should | HUMAN | HUMAN-PENDING | Left for Vineet: judge manageability of a ~150-row plan review. |
| J3.1 | must | AUTO | PASS | Browser evidence: after dismissing the guide overlay, Create lands on the project dashboard with scoped project name. |
| J3.2 | must | AUTO | PASS | `delivery-truth.test.ts` and `report-data.test.ts` verify missing budget/evidence keeps confidence pending instead of fabricating a score. |
| J3.3 | must | AUTO | PASS | `guided-work.test.ts` verifies missing budget generates a nudge/checklist action linking to Costs. |
| J3.4 | must | AUTO | PASS | `guided-work.test.ts` verifies readiness checklist is driven by live project data and each item links to a fix route. |
| J3.5 | should | HUMAN | HUMAN-PENDING | Left for Vineet: PM clarity check after create. |
| J4.1 | must | AUTO | PASS | Cost-grid/source and delivery-truth tests verify budget/actual lines feed the verdict. |
| J4.2 | must | AUTO | PASS | UI regression evidence covers task modal/edit paths and schedule-impact persistence. |
| J4.3 | must | AUTO | PASS | UI regression evidence covers entity create modals; source includes milestone and risk create/edit flows. |
| J4.4 | should | AUTO | FAIL | Expected known gap G1 also applies here: `Mine` filters are hardcoded to `VP` in issues/documents and not identity-aware. |
| J4.5 | should | HUMAN | HUMAN-PENDING | Left for Vineet: weekly bulk-update friction check. |
| J4.6 | should | VISUAL | PASS | Dashboard navigation screenshot shows shallow record navigation and main route groups (`uat-j4-dashboard-nav.png`). |
| J5.1 | must | AUTO | PASS | `delivery-truth.test.ts` and report data tests verify verdict/signals/report confidence use the same EVM inputs. |
| J5.2 | must | AUTO | PASS | `consequence.test.ts` plus UI regression evidence cover date move impact drawer with go-live/cost/confidence and calculation details. |
| J5.3 | must | AUTO | PASS | `status-integrity.test.ts` and `delivery-truth.test.ts` verify over-claimed progress fires the status-integrity signal. |
| J5.4 | should | AUTO | PASS | Report evidence rows and UI regression evidence link claims back to source routes/records. |
| J5.5 | should | HUMAN | HUMAN-PENDING | Left for Vineet: sponsor 30-second comprehension check. |
| J6.1 | must | AUTO | PASS | `report-data.test.ts` verifies weekly/status reports are live and scoped to the active project. |
| J6.2 | must | VISUAL | PASS | Weekly report screenshot and export controls are present (`uat-j6-o9-weekly-report.png`); export code uses the same report data object. |
| J6.3 | must | AUTO | PASS | `report-data.test.ts` verifies evidence rows and pending/missing-data reporting. |
| J6.4 | should | HUMAN | HUMAN-PENDING | Left for Vineet: sponsor acceptance of report as-is. |

## Operational UAT Matrix

| ID | Pri | Verify | Status | Evidence |
|---|---|---|---|---|
| O1.1 | must | AUTO | FAIL | Expected known gap: `Mine` is hardcoded to `VP`; no active identity-aware owner filtering. |
| O1.2 | must | AUTO | PASS | Task grid/source supports inline percent/status updates; UI regression covers edit persistence. |
| O1.3 | should | HUMAN | HUMAN-PENDING | Left for Vineet: bulk/fast-path weekly maintenance friction check. |
| O1.4 | must | AUTO | PASS | Store-derived EVM/delivery-truth tests verify verdict/signals recompute from live task/cost state. |
| O1.5 | should | AUTO | FAIL | Same identity gap as O1.1: a non-`VP` lead can be shown `VP` items as "Mine". |
| O2.1 | must | AUTO | PASS | UI regression evidence: date move opens schedule impact review modal. |
| O2.2 | must | AUTO | PASS | `consequence.test.ts` verifies go-live movement, cost, and confidence language/math for task slips. |
| O2.3 | must | AUTO | PASS | `consequence.test.ts` verifies absorbed slips vs go-live-moving slips. |
| O2.4 | should | AUTO | PASS | `consequence.test.ts` and scheduling tests verify causal chain/critical path traceability. |
| O2.5 | should | AUTO | PASS | `consequence.test.ts` verifies adjustable T&M assumptions and freeze behavior in impact math. |
| O2.6 | should | HUMAN | HUMAN-PENDING | Left for Vineet: non-expert PM comprehension check. |
| O3.1 | must | AUTO | PASS | `scheduling.algorithm.test.ts` verifies cascade previews for downstream gates/tasks. |
| O3.2 | must | AUTO | PASS | Scheduling/consequence tests verify go-live impact and critical-path markers. |
| O3.3 | should | AUTO | PASS | Scheduling tests and impact drawer source cover override/exclude rows before apply. |
| O4.1 | must | AUTO | PASS | Source provides task and cost creation paths; consequence tests model added scope. |
| O4.2 | must | AUTO | PASS | `consequence.test.ts` verifies scope-addition impact on cost/go-live/confidence. |
| O4.3 | must | AUTO | FAIL | No verified unified "accept added scope" workflow that records both the cost addition and decision log as one committed scope decision. |
| O4.4 | should | HUMAN | HUMAN-PENDING | Left for Vineet: PM understands true cost before saying yes. |
| O5.1 | must | AUTO | PASS | Cost grid/source exposes over-charge/impact path for cost lines. |
| O5.2 | must | AUTO | PASS | `consequence.test.ts` verifies over-charge raises forecast cost and lowers confidence while go-live holds. |
| O5.3 | should | AUTO | PASS | Store audit/source records accepted over-charge actions to the audit log. |
| O6.1 | must | AUTO | PASS | Resources/milestones source exposes owner-unavailable modeling for a return date. |
| O6.2 | must | AUTO | PASS | `consequence.test.ts` verifies owner absence impact on breach/slip, cost, and confidence. |
| O6.3 | must | AUTO | PASS | `consequence.test.ts` verifies locked go-live is shown as a breach rather than silently absorbed. |
| O7.1 | must | AUTO | PASS | `status-integrity.test.ts` verifies the over-claimed progress signal fires with reasons. |
| O7.2 | must | AUTO | PASS | `delivery-truth.test.ts` verifies confidence is shown with the status-integrity caveat. |
| O7.3 | should | HUMAN | HUMAN-PENDING | Left for Vineet: missing-evidence comprehension check for over-claimed progress. |
| O8.1 | must | AUTO | PASS | Impact drawer source restates accepted slip/cost before commit. |
| O8.2 | must | AUTO | PASS | Store audit/source records accepted impact actions. |
| O8.3 | must | AUTO | PASS | `baseline-commitment.test.ts` verifies frozen baseline survives later go-live edits. |
| O8.4 | should | AUTO | FAIL | Expected known gap: re-baseline who/when/why visibility is not yet built. |
| O9.1 | must | AUTO | PASS | `report-data.test.ts` verifies reports are live and project-scoped across verdict, schedule, cost, risks, and decisions. |
| O9.2 | must | AUTO | FAIL | Report data does not include audit-log accepted slips/decisions for the reporting period; it reports current state and pending decisions. |
| O9.3 | should | AUTO | FAIL | Status-integrity signal exists in Delivery Signals, but weekly/SteerCo report data does not surface the caveat explicitly. |
| O9.4 | must | AUTO | PASS | `report-data.test.ts` verifies evidence rows and missing-data claims link to source records. |
| O9.5 | must | VISUAL | PASS | Weekly report screenshot is board-style and export controls are present (`uat-j6-o9-weekly-report.png`). |
| O9.6 | should | HUMAN | HUMAN-PENDING | Left for Vineet: sponsor can decide from report alone. |
| O10.1 | must | AUTO | FAIL | Expected known gap: no time-series snapshots, so no last-reporting-point delta is available. |
| O10.2 | should | VISUAL | FAIL | Expected known gap: direction-of-travel is not explicit in dashboard/report (`uat-o10-trend-missing.png`). |

## Browser Artifacts

- `v2/docs/uat-artifacts/uat-j0-launchpad.png`
- `v2/docs/uat-artifacts/uat-j1-next-before-commit.png`
- `v2/docs/uat-artifacts/uat-j4-dashboard-nav.png`
- `v2/docs/uat-artifacts/uat-j6-o9-weekly-report.png`
- `v2/docs/uat-artifacts/uat-o10-trend-missing.png`
- `v2/docs/uat-artifacts/uat-browser-check.json`
