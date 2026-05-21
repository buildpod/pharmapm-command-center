# Landing And Guided Navigation Design

**Created:** 2026-05-20
**Purpose:** define the first screen, post-login routing, and guided navigation model before implementation.

This is the core product differentiator:

> Make complex project management easy for the delivery team while preserving transparent, board-ready truth for leadership.

The app should not merely provide modules. It should guide the user through the project.

---

## 1. Product Promise

PharmaPM Command Center should feel like a calm operating partner.

It should answer:

- Where am I in the project?
- What should I do next?
- What is blocking delivery?
- What evidence is missing?
- What decision does leadership need?
- Can the board trust the project story?

The key UX principle:

> The app should guide the user to the right next action, and every action should leave a transparent trail for PM, SteerCo, and board review.

---

## 2. User Entry States

When a user opens the app after login, the first screen depends on project and role state.

Backend/auth can come later. The UX still needs to be designed now.

### Entry State A: No Projects

**First page:** Start Project

Purpose:

```text
Create the first command center.
```

Primary options:

- Start from template
- Import Microsoft Project / Excel
- Start blank
- Explore demo project

Guided path:

```text
Start Project
-> Choose starting path
-> Choose template family
-> Refine by industry, region, GxP, system type
-> Enter basics
-> Review operating model
-> Create command center
-> Land on Command Center
```

Do not show:

- dense dashboard
- empty charts
- raw registers
- technical setup language

### Entry State B: Project Exists But Is Not Run-Ready

**First page:** Complete Setup

Purpose:

```text
This project exists, but the command center cannot yet give reliable guidance.
```

Show:

- missing milestones
- missing owners
- missing risks
- missing budget
- missing readiness gates
- missing validation/migration structure if template requires it

Primary options:

- Finish setup
- Import plan
- Add owners
- Add budget
- Add readiness model
- Open anyway

Guided path:

```text
Complete Setup
-> Missing structure checklist
-> Fix/import/add
-> Recheck run-readiness
-> Land on Command Center
```

### Entry State C: Run-Ready Project, PM User

**First page:** Command Center

Purpose:

```text
Run the project today.
```

First viewport:

- project promise
- Delivery Truth band
- top 3 actions
- active blockers
- next board/SteerCo decision
- readiness pressure

Primary options:

- Open today’s worklist
- Review Delivery Truth
- Prepare SteerCo story
- Open readiness gates
- Open plan

### Entry State D: Run-Ready Project, Workstream Lead

**First page:** My Workstream

Purpose:

```text
Show what I own, what blocks me, and what I owe others.
```

Show:

- my due-soon tasks
- blockers
- dependencies I create for others
- decisions waiting on me
- readiness gates tied to my workstream

Primary options:

- Update my work
- Escalate blocker
- Review dependencies
- Open evidence/documents

### Entry State E: Run-Ready Project, QA / Validation

**First page:** Validation Readiness

Purpose:

```text
Show whether the validated project can pass evidence and signoff gates.
```

Show:

- VMP / URS / UAT / PQ / VSR state
- traceability coverage
- evidence gaps
- open validation risks
- UAT/PQ defects
- signoff readiness

Primary options:

- Review validation evidence
- Review UAT/PQ readiness
- Open missing documents
- Escalate quality blocker

### Entry State F: Run-Ready Project, Data Migration Lead

**First page:** Migration Readiness

Purpose:

```text
Show whether data can be trusted at cutover.
```

Show:

- source inventory
- mapping completeness
- dry-run status
- reconciliation result
- defect count
- production-load readiness

Primary options:

- Review dry run
- Open data-quality blockers
- Update reconciliation
- Escalate migration risk

### Entry State G: Executive / Sponsor / Board

**First page:** Executive Briefing

Purpose:

```text
Can I trust the project story, and what decision is needed from me?
```

Show:

- Delivery Truth
- go-live confidence
- decision needed
- top risks
- budget pressure
- readiness confidence
- what changed since last review

Primary options:

- Review decision pack
- Open SteerCo report
- Drill into risk
- Drill into readiness

### Entry State H: CTO / Architecture

**First page:** Technical Readiness

Purpose:

```text
Can the architecture, integrations, security, and operating model support go-live?
```

Show:

- integration readiness
- environment status
- API/data-flow risks
- security/access concerns
- cutover technical readiness
- support/hypercare model

Primary options:

- Review integrations
- Review architecture risks
- Open cutover plan
- Review technical blockers

---

## 3. Guided Navigation Model

Guided navigation means the app does not simply expose pages. It tells the user what path to follow.

### Navigation Should Be Role-Aware

The same project can have different first paths:

- PM: Command Center
- Workstream lead: My Workstream
- QA: Validation Readiness
- Data migration: Migration Readiness
- Sponsor: Executive Briefing
- CTO: Technical Readiness

In the static demo, this can be simulated with role tabs/lenses. Later backend/auth can route automatically.

### Navigation Should Be State-Aware

If project setup is incomplete, do not pretend the project is run-ready.

State gate:

```text
No project -> Start Project
Incomplete project -> Complete Setup
Run-ready project -> Role landing page
```

### Navigation Should Be Action-Aware

Every operating screen should show:

- what matters now
- why it matters
- who owns it
- what to do next
- where the source record is

This turns the app from "many modules" into "guided project management."

---

## 4. Guided Navigation Patterns

### Pattern 1: Project Promise Bar

Appears on major operating pages.

Contains:

- project name
- target go-live
- Delivery Truth band
- top reason confidence changed
- next board decision

Purpose:

```text
Keep every role anchored to the promise.
```

### Pattern 2: Next Action Rail

Persistent right-side or top section on operating pages.

Contains:

- top 3 next actions
- owner
- urgency
- link to source

Purpose:

```text
The user always knows what to do next.
```

### Pattern 3: Role Lens

User can switch perspective:

- PM
- Workstream
- QA
- Migration
- DAP
- Sponsor
- CTO

Purpose:

```text
Same project truth, different operating view.
```

### Pattern 4: Source Trace

Every signal should link back to source records.

Examples:

- Delivery Truth signal -> milestone/task/risk/document/cost
- Readiness gap -> evidence/doc/task
- Board decision -> risk/issue/impact record

Purpose:

```text
Transparency to board without manual explanation.
```

### Pattern 5: Escalation Path

Any blocker should offer:

- update owner
- add note
- create risk/issue/decision
- mark for SteerCo

Purpose:

```text
Make governance a natural part of running the project.
```

### Pattern 6: Readiness Gate

Readiness should not be only percentages.

Each gate should show:

- condition
- owner
- evidence
- open blockers
- decision needed
- pass/fail/needs review

Purpose:

```text
Go-live confidence must be explainable.
```

---

## 5. First Page Logic

Future backend/auth routing can use this logic.

For now, static demo can simulate it.

```text
onAppOpen(user):
  if no projects:
    route Start Project

  else if active project not run-ready:
    route Complete Setup

  else if user role is Sponsor or Board:
    route Executive Briefing

  else if user role is Workstream Lead:
    route My Workstream

  else if user role is QA:
    route Validation Readiness

  else if user role is Data Migration:
    route Migration Readiness

  else if user role is CTO:
    route Technical Readiness

  else:
    route Command Center
```

Minimum static version:

- Keep Command Center as default for now.
- Add no-project and incomplete-project redirect later.
- Add role lens tabs in Command Center until auth exists.

---

## 6. Recommended Sidebar

Sidebar should show the product journey first, not the database structure.

### Start

Shown when setup incomplete or no project:

- Start Project
- Complete Setup

### Run

- Command Center
- Worklist
- Delivery Truth
- Readiness

### Control

- Plan
- Governance
- Reports

### Registers

- Charter
- Milestones
- Tasks
- Risks
- Documents
- Costs
- Resources

### Admin

- Project Rules
- Templates
- Settings

Important:

Registers should be visible, but not treated as the product home.

---

## 7. Board Transparency Flow

The board should never need a manually invented story.

The app should produce the story from project truth.

### Board Questions

- Are we on track?
- What changed since the last meeting?
- What decision do you need from us?
- What are the top risks?
- What is the budget pressure?
- Is go-live readiness credible?
- What is being done about blockers?

### Data Flow

```text
Tasks / Milestones / Risks / Documents / Costs / Readiness
-> Delivery Truth
-> Decision Options
-> Governance
-> SteerCo Report
-> Board Transparency
```

### Board View Should Show

- promise status
- top movement since last review
- risk/decision list
- readiness gates
- budget status
- ask from board
- source trace links

This is the USP:

```text
Easy for PM to run.
Transparent for board to trust.
```

---

## 8. Template-Aware Guided Navigation

The selected template should change navigation emphasis.

### Veeva RIM Template

Emphasize:

- RIM modules
- Vault Connections
- migration
- validation
- publishing/gateway readiness
- cutover

### SAP S/4HANA GxP Template

Emphasize:

- SAP Activate phases
- fit-to-standard
- master data
- integrations
- validation
- cutover
- hypercare

### Non-GxP SaaS Rollout

Emphasize:

- adoption
- configuration
- training
- go-live
- support

### Data Migration Template

Emphasize:

- source inventory
- mapping
- dry runs
- reconciliation
- cutover load
- data-quality decisions

The UI should not be one-size-fits-all. It should keep the same shell, but change the guided lanes.

---

## 9. Implementation Sequence

Do not build this all at once.

### M6.3 - Start Project Flow Redesign

- rename Guided Setup to Start Project
- create stepper
- remove fake toggles
- show created-now vs not-modeled-yet
- create lands on Command Center

### M6.4 - Guided Navigation Shell

- add project promise bar
- add next-action rail
- formalize role lens behavior
- make Command Center first viewport a briefing

### M6.5 - Board Transparency Flow

- define "what changed since last review"
- connect Delivery Truth to Governance and Reports
- create board-ready decision pack concept

### M6.6 - Template Catalog

- template taxonomy
- filter by industry, GxP, region, system family
- add SAP/data/eQMS/general templates at starter level

---

## 10. Design Check Before Coding

Before implementation, ask Claude Design or another design reviewer:

- Does the first-page logic make sense?
- Is guided navigation visible enough?
- Is setup too long?
- Does the board transparency flow feel credible?
- Which screens should be merged, hidden, or renamed?
- Does the Command Center feel like a briefing or a dashboard dump?

