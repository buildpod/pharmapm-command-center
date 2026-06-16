# PharmaPM Command Center Next Product Hardening Plan

Created: 2026-06-16
Purpose: define the next execution sequence before more feature coding.

## Product Owner Position

Do not compete with Monday, Smartsheet, or MS Project as a generic work-management tool.

Win narrowly:

```text
For regulated pharma implementation projects, PharmaPM Command Center turns plans,
risks, approvals, costs, and evidence into a board-ready delivery story.
```

The product must first make one journey excellent:

```text
New Project
-> Preview Generated Operating Model
-> Fix Setup Gaps
-> Run Dashboard
-> Review Schedule Impact
-> Send Traceable Report
```

## Execution Rules

- Work one step at a time.
- Do not add new routes unless a route answers a clear business question.
- Do not add backend/database until the front-end workflow is worth preserving.
- Every step must improve buyer clarity, user confidence, or evidence traceability.
- Each step gets its own verification before the next begins.

## Step 1: First 10-Minute Journey

Goal: a first-time PM understands what the product does and reaches useful value quickly.

Build or refine:

- First-run welcome/DAP entry that explains the product journey.
- Role choice: PM, Sponsor, QA/Validation, Workstream Lead.
- Clear setup path: template, import, saved template, or blank.
- “What happens next” after project creation.

Done when:

- A new user can explain the app in one sentence.
- The user knows why setup matters before seeing dense registers.

## Step 2: Generated Operating Model Preview

Goal: users can inspect what will be created before they commit.

Build or refine:

- Review tabs before Create:
  - Milestones
  - Tasks
  - Risks
  - Documents
  - Team
  - Costs
  - Out of Scope
- Show actual names, owners, dates, dependencies, and counts.
- For suite templates, show selected modules and excluded modules.
- Let users defer or remove obvious irrelevant sections.

Done when:

- Generation summary is no longer just numbers.
- A PM can see whether the template is credible before creating a project.

## Step 3: Setup-To-Run Readiness Checklist

Goal: after creation, the app tells the PM what is missing before the command center is trustworthy.

Build or refine:

- Persistent checklist:
  - Charter drafted
  - Milestone spine reviewed
  - Tasks linked to milestones
  - Risks reviewed
  - Budget lines added
  - Documents/approval evidence added
  - First SteerCo report ready
- Each checklist item links to the exact page and record where possible.
- Checklist state comes from live project data.

Done when:

- The user does not need training to know what to fix next.

## Step 4: Native DAP As Guided Work

Goal: DAP becomes a working assistant, not generic tooltip training.

Build or refine:

- Visible welcome card with Start, Skip, close, and progress.
- Contextual page guidance that can collapse.
- Smart nudges from live data only.
- Role-aware language.
- Micro-guidance near important fields.

Done when:

- Guidance feels like “do this next because your project data says so.”
- It does not feel like a static product tour.

## Step 5: Schedule Impact Comprehension

Goal: users understand the consequence of schedule edits before and after saving.

Build or refine:

- Plain-language top summary.
- Clear explanation of red conflicts.
- Clear explanation of green “go-live still holds” state.
- Back/Cancel without saving.
- Save receipt listing changed tasks and links.

Done when:

- A PM can say exactly what shifted and what still needs review.

## Step 6: Reports As Trust Centerpiece

Goal: reports become the reason to use the product.

Build or refine:

- Live project-scoped report data only.
- Evidence trail for every key claim.
- “What changed since last report” section.
- Export matches screen.
- Missing data shown honestly.

Done when:

- A PM can send a report to SteerCo and defend every claim.

## Step 7: Domain Playbook Credibility

Goal: templates feel like real regulated delivery playbooks.

Build or refine:

- Veeva RIM partial-suite playbook.
- Veeva Clinical modules.
- SAP S/4HANA workstreams.
- CSV validation.
- Regulated data migration.
- LIMS implementation.
- Honesty tests prevent scaffold language inside playbooks.

Done when:

- A domain PM would keep most of the generated plan instead of deleting it.

## Step 8: Enterprise Backbone

Goal: move from demo to pilotable enterprise product.

Only start after Steps 1-7 are credible.

Build:

- Authentication.
- Organization/workspace model.
- Database persistence.
- Audit trail.
- Role permissions.
- Template library with versioning.
- Report snapshots.
- Import history.

Done when:

- Multiple users can operate one project with traceable changes.

## Immediate Next Action

Start with Step 1.

Create the first 10-minute user journey as an implemented flow:

```text
Open app
-> Understand product promise
-> Choose role
-> Create/import project
-> Preview operating model
-> Create project
-> Land on setup-to-run checklist
```

Do not start backend, new playbooks, or extra dashboards until this journey is understandable.
