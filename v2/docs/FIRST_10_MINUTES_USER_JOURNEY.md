# First 10 Minutes User Journey

Created: 2026-06-16
Status: Step 1 build spec from `NEXT_PRODUCT_HARDENING_PLAN.md`.

## Product Promise To Communicate

```text
PharmaPM Command Center helps regulated project teams turn plans, risks,
approvals, costs, and evidence into a board-ready delivery story.
```

The first 10 minutes must prove this promise without requiring the user to understand every module.

## Primary Persona For First Build

Optimize first for:

```text
Project Manager running a regulated pharma technology implementation.
```

Other modes can exist, but PM is the default because the PM creates the command center and owns the operating rhythm.

## Entry States

### No project

User should land on a guided start screen, not an empty dashboard.

Primary choices:

- Start from playbook.
- Import existing plan.
- Use saved template.
- Start blank.
- Explore demo project.

### Project exists but is not run-ready

User should land on a setup-to-run checklist, not raw registers.

The app should say:

```text
This project exists, but the command center needs a few records before it can give a trustworthy delivery story.
```

### Run-ready project exists

User lands on dashboard.

The dashboard should answer:

```text
Can leadership trust the project story today?
```

## First 10-Minute Flow

### 1. Welcome

Purpose: explain what this product does in one screen.

Screen should show:

- Product promise.
- The operating loop:
  `Create plan -> verify evidence -> run project -> explain delivery -> report to SteerCo`.
- Role selector:
  - PM
  - Sponsor
  - QA / Validation
  - Workstream Lead
- Primary action: `Start guided setup`.
- Secondary action: `Explore demo`.

Avoid:

- Marketing hero copy.
- Dense module navigation.
- Empty dashboard charts.

### 2. Choose Starting Path

Purpose: let user start from the closest real-world situation.

Options:

- `Use a playbook`
  For common regulated implementations.
- `Import existing plan`
  For MS Project, Planner, Excel, or CSV.
- `Reuse saved template`
  For rollout/release patterns.
- `Start blank`
  For custom projects.

Each option should say what happens next.

### 3. Discovery

Purpose: collect only fields needed to recommend the right operating model.

Fields:

- Project name.
- Client/business area.
- Industry.
- System family.
- Project type.
- Control model.
- Region.
- Start date.
- Target go-live.

The page should explain:

```text
These answers choose the first draft. You can review and adjust before creation.
```

### 4. Playbook Or Import Setup

Purpose: choose what will generate the project.

For playbooks:

- Show playbook tier: Playbook or Starter.
- Show module picker only for suite playbooks.
- Show coverage counts that update with module selection.
- Show plain warning when a starter is structure-only.

For import:

- Show accepted sources.
- Show required/recognized columns.
- Show preview and mapping before create.
- Show missing fields and unresolved dependencies.

### 5. Generated Operating Model Preview

Purpose: replace vague generation counts with inspectable project content.

Required tabs before create:

- Milestones.
- Tasks.
- Risks.
- Documents.
- Team.
- Costs.
- Out of Scope.

Each tab should show real names, owners, dates, and counts.

The user should be able to:

- Accept the draft.
- Remove irrelevant module content.
- Revisit discovery.
- Revisit timeline.
- Create command center.

### 6. Create Project

Purpose: persist the selected operating model.

After creation, do not dump user into a dense page.

Route user to:

```text
Setup-to-run checklist
```

### 7. Setup-To-Run Checklist

Purpose: teach the PM what makes the command center trustworthy.

Checklist:

- Charter drafted.
- Milestone spine reviewed.
- Tasks linked to milestones.
- Risks reviewed.
- Budget lines added.
- Documents/approval evidence added.
- First SteerCo report ready.

Each item should include:

- Status.
- Why it matters.
- Next action.
- Link to exact route or record.

### 8. First Dashboard Moment

Purpose: show the operating value.

Dashboard should show:

- Executive verdict.
- Confidence drivers.
- What needs attention.
- Evidence trail.
- Link to report.

If data is incomplete, dashboard should say what is missing instead of faking confidence.

## Success Criteria

A new PM succeeds if, within 10 minutes, they can answer:

1. What does this app do?
2. Which project setup path should I use?
3. What will be created before I click Create?
4. What is missing before the command center is trustworthy?
5. Where do I go next?
6. How will this become a SteerCo-ready report?

## Build Priority

Build in this order:

1. Welcome / DAP start card.
2. Generated operating model preview.
3. Setup-to-run checklist landing.
4. Dashboard handoff from checklist.

Do not start database/auth until these front-end behaviors are clear.
