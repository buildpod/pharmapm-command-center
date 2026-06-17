# User Journey — UAT Test Script

> Purpose: define the end-to-end user journey with **objective acceptance
> criteria**, so "does it work?" has a yes/no answer at every step — across all
> entry paths, the review/adjust step, post-create readiness, daily work, the
> payoff, and sharing. Run this as whole-journey regression after any change.
>
> Companion to `FIRST_10_MINUTES_USER_JOURNEY.md` (build spec) — this is the
> **test** against it.
>
> **Verify column legend:** `AUTO` = drivable via the browser-preview tools
> (clicks/forms/state); `VISUAL` = screenshot judgement (layout/feel);
> `HUMAN` = needs a person (subjective clarity, real messy file, real buyer).
>
> Status: DRAFT for review — confirm/adjust criteria before we execute.

---

## Persona
Primary: **PM running a regulated pharma implementation** (creates the command
center, owns the rhythm). Secondary checks: **Workstream Lead** (updates own
items), **Sponsor** (reads the verdict/report).

## Pass bar
A stage **passes** only if every `[must]` criterion holds. `[should]` criteria
are tracked as friction, not blockers. Any `[must]` failure = the journey breaks
there.

---

## J0 — First arrival (no project)
**Objective:** a brand-new user instantly understands what this is and what to do.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| J0.1 | Landing shows a guided start (not an empty dashboard with broken charts). | must | AUTO |
| J0.2 | The product promise is stated in one line. | must | VISUAL |
| J0.3 | The four start paths + "explore demo" are visible and selectable. | must | AUTO |
| J0.4 | A non-PM can say what the app does in one sentence after this screen. | should | HUMAN |

## J1 — Start a project (ALL FOUR PATHS + demo)
**Objective:** every entry path produces a usable starting point.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| J1.1 | **Playbook**: choosing a playbook (e.g. Veeva RIM) generates milestones, tasks, owners, and documents with real domain content. | must | AUTO |
| J1.2 | **Import**: uploading a CSV/XLSX reaches the column-mapping step; a non-standard-header file is NOT a dead-end (columns are offered to map). | must | AUTO |
| J1.3 | **Import**: a plan with no cost column still imports tasks + milestones (cost simply absent, not an error). | must | AUTO |
| J1.4 | **Saved template**: a previously saved template recreates its full model. | must | AUTO |
| J1.5 | **Blank**: creates an empty shell without pretending to have data. | must | AUTO |
| J1.6 | **Demo**: explore-demo opens the sample project read-to-explore. | should | AUTO |
| J1.7 | Each path clearly says what will happen next before committing. | should | VISUAL |

## J2 — Review & adjust the generated model (BEFORE create)
**Objective:** the user can trust and correct the generated model before committing.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| J2.1 | The review screen shows real names, owners, dates, counts per category (milestones/tasks/docs/risks/costs/scope) — not just totals. | must | AUTO |
| J2.2 | "Worth knowing" honestly flags what's missing (e.g. no milestones / no budget) and the consequence. | must | AUTO |
| J2.3 | For an import, a wrong column mapping can be corrected here and the preview re-flows. | must | AUTO |
| J2.4 | The user can edit/remove an obviously wrong record, or defer a section, before Create. | should | AUTO |
| J2.5 | Reviewing feels manageable, not overwhelming, for a ~150-row plan. | should | HUMAN |

## J3 — Create → "now what" readiness
**Objective:** after Create the user knows exactly what's needed to get a trustworthy story — and can act on it.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| J3.1 | Create lands on the dashboard / readiness view for the new project (scoped to it). | must | AUTO |
| J3.2 | If unscored (e.g. no budget), the verdict honestly reads "pending" with the reason — never a fabricated score. | must | AUTO |
| J3.3 | **The cost gap is actionable**: when there are no budget lines, there is a clear, one-click path to add them (nudge/checklist → Costs). | must | AUTO |
| J3.4 | The readiness checklist reflects live project data and links each item to the exact place to fix it. | must | AUTO |
| J3.5 | A PM can tell, without training, what to do next. | should | HUMAN |

## J4 — Daily work (manage the project)
**Objective:** PM and workstream lead can keep the project current without friction.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| J4.1 | **Add a cost line** (budget + actual + contract type) and it activates/updates the verdict. | must | AUTO |
| J4.2 | Add / edit a task (name, owner, date, %); inline edits persist. | must | AUTO |
| J4.3 | Add / edit a milestone and a risk. | must | AUTO |
| J4.4 | A workstream lead can filter to **their own** items (today "Mine" is hardcoded to VP — known gap G1). | should | AUTO |
| J4.5 | Updating many items weekly is not punishing (bulk / low-friction) — known gap G2. | should | HUMAN |
| J4.6 | Navigation to any record is shallow and obvious from the dashboard. | should | VISUAL |

## J5 — Payoff (the truth)
**Objective:** the verdict, signals, and impact are trustworthy and understandable.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| J5.1 | Dashboard verdict, Delivery Signals, and Reports show the **same** confidence number (one financial truth). | must | AUTO |
| J5.2 | Moving a task date opens the impact drawer: go-live / cost / confidence, plain-language, with "how is this calculated". | must | AUTO |
| J5.3 | Over-claimed progress raises the **status-integrity** signal ("reported progress may be overstated"). | must | AUTO |
| J5.4 | Every claim traces to its source record (one click). | should | AUTO |
| J5.5 | A sponsor understands the verdict in ~30 seconds. | should | HUMAN |

## J6 — Share (SteerCo report)
**Objective:** the PM can produce a board-ready report and defend every claim.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| J6.1 | A weekly/status report generates from live project data, scoped to the project. | must | AUTO |
| J6.2 | Export (PDF/Excel) matches the on-screen report. | must | VISUAL |
| J6.3 | Every key claim has an evidence trail; missing data shown honestly. | must | AUTO |
| J6.4 | A sponsor would accept this report as-is. | should | HUMAN |

---

## How we run it
1. Confirm/adjust these criteria (this review).
2. I execute every `AUTO` criterion via the preview tools and record pass/fail with evidence (screenshot or state).
3. `VISUAL` — I capture screenshots and give an impression, flagged as such.
4. `HUMAN` — left for your check; I'll note what to look at.
5. Output: a pass/fail matrix → the real, prioritized gap list (the "100 gaps"), grounded in the journey, not the engine alone.
