# PharmaPM Command Center UX Flow Map

**Purpose:** lock the product journey before more UI patches.
**Created:** 2026-05-20
**Scope:** first-time setup, daily project running, persona views, readiness, governance, and the detailed registers.

This document is not a feature backlog. It is the navigation and experience spine the app should follow.

Reference UI inspected:

- `https://buildpod.github.io/pharmapm-pro/v2/tasks/`
- Use it for density, workstream grouping, enterprise table rhythm, chips, filters, and quiet visual hierarchy.
- Do not copy it as the whole IA model; it is a strong register screen, not a complete command-center journey.

Design-system decision:

- Adopt `shadcn/ui` as the source component language: Button, Card, Sheet, Dialog, Tabs, Badge, Table, Command, Select, Dropdown, Toast, Tooltip, Stepper-like composition.
- `shadcn/ui` is not enough by itself. It gives building blocks; the product still needs a journey model and template strategy.

---

## 1. Design Thesis

The product is not a dashboard collection. It is a **project operating system** for regulated implementation work.

The user should never wonder:

- What project am I running?
- Is the delivery promise still credible?
- What changed since the last review?
- What do I need to do next?
- Which workstream owns the problem?
- What evidence is missing before go-live?
- What should I take to SteerCo?

Every screen should answer at least one of those questions.

---

## 1.1 Reference UI Learnings From PharmaPM Pro Tasks

The reference Tasks page is the best current example of a dense enterprise register in this product family.

What to keep:

- **Calm density:** many rows are visible without feeling like Excel.
- **Workstream summary cards:** Configuration, Validation, Data Migration, Training, Project Mgmt give immediate shape.
- **Grouped table:** section rows make large task lists readable.
- **Inline filters:** status/priority/workstream/mine filters are simple and understandable.
- **Owner avatars and badges:** lightweight recognition without overdecorating.
- **Dependency chips:** good compact way to show upstream links.
- **Primary action placement:** `New task` is easy to find but does not dominate the whole page.

What not to copy:

- It is entity-first. It answers "show me tasks", not "what should I do today?"
- It assumes the user already knows the project structure.
- It does not explain readiness, validation, migration, or executive consequence.
- It does not solve first-time setup or template selection.

Design implication:

- Register screens should look like this: dense, scannable, grouped, filterable.
- Operating screens should not look like this. Command Center, Start Project, Delivery Truth, and Readiness need briefing/guidance layouts.

---

## 2. Source-Backed Project Reality

The Veeva RIM template is only a stress test, not the whole product. It is useful because it forces the app to handle the complexity real regulated projects create.

### RIM Is A Connected Data Model

Veeva RIM is not four disconnected modules. Applications, Submissions, Regulatory Objectives, Registrations, Content Plans, XML generation, Publishing, and Archive are linked. The project tool must therefore show cross-workstream consequences, not just task lists.

UX implication:

- The setup template must create module/workstream structure.
- The daily run view must show cross-workstream blockers.
- Delivery Truth must eventually understand connection/migration/validation readiness, not only dates.

### Publishing Has Operational Gates

Submissions Publishing includes content plans, continuous publishing/validation, Archive Viewer handoff, overlays, lifecycle operations, and gateway/submission readiness.

UX implication:

- Publishing cannot be a generic task group.
- It needs a readiness gate: content plan ready, validation clean, archive viewer checked, gateway smoke test passed.

### Migration Is Extract, Transform, Load, Verify

Veeva migration guidance emphasizes extracting from legacy systems, transforming data, using loader/API paths, and verifying the loaded data. Community migration experience also stresses that teams skip verification at their own cost.

UX implication:

- Migration needs dry-run/reconciliation status, not just "migration task complete."
- Setup should create migration runs or placeholders.
- Readiness must include data-quality and reconciliation gates.

### Validation Has Customer-Owned Evidence

Veeva provides validation material, but customers still own project-level validation artifacts such as VMP, URS, UAT/PQ plan/scripts, traceability, and VSR according to their SOP.

UX implication:

- Validation is not just Documents.
- The app needs a traceability journey: requirement -> configured area -> UAT/PQ script -> evidence -> signoff.

### Adoption Is A First-Class Risk

Veeva is powerful but users routinely find Vault complex without good rollout, role design, and training.

UX implication:

- DAP/adoption should appear during setup and readiness.
- Workstream leads need "what do I do next" guidance, not only tables.

### SAP And Other Enterprise Programs Need Template Families

Veeva RIM is only one stress test. European pharma and regulated companies also run SAP S/4HANA, SAP quality/manufacturing, eQMS, LIMS, MES, serialization, IDMP/SPOR, data migration, CSV, and non-GxP SaaS programs.

SAP Activate is a useful comparison point because SAP describes it as a structured implementation framework with roadmaps, quality gates, checkpoints, and six phases. SAP learning material names Prepare, Explore, Realize, Deploy, plus Discover and Run around the core delivery phases.

UX implication:

- Templates need a common spine: phases, workstreams, roles, deliverables, readiness gates, risks, evidence, cutover, hypercare.
- Templates should vary by industry, system family, GxP status, and region/regulatory expectations.
- Setup cannot be a single Veeva wizard. It must become a reusable template selector and operating-model generator.

---

## 3. Product States

The app has three states, and the first screen depends on the state.

### State A: No Project Yet

First screen: **Start Project**

Goal: get to a credible command center with minimum confusion.

Flow:

```text
Start Project
-> Choose starting path
-> Choose template/import/blank
-> Confirm delivery shape
-> Enter project basics
-> Review operating model
-> Create project
-> Land in Command Center
```

### State B: Project Exists But Is Not Run-Ready

First screen: **Setup Completion**

Goal: show what is missing before Delivery Truth can be trusted.

Examples:

- no milestones
- no owners
- no budget
- no risks
- no validation/migration/readiness structure when template says it is needed

Flow:

```text
Setup Completion
-> Missing structure checklist
-> Fix/import/add
-> Recalculate run-readiness
-> Land in Command Center
```

### State C: Project Exists And Is Run-Ready

First screen: **Command Center**

Goal: answer the PM's morning question in 10 seconds.

```text
Can we still hit the promise?
What changed?
What needs action today?
Who owns it?
What should I escalate?
```

---

## 4. Primary Landing Page

For run-ready projects, the landing page is **Command Center**.

It should not feel like a dashboard. It should feel like a briefing.

### First Viewport

1. **Project Promise Bar**
   - project name
   - phase
   - target go-live
   - Delivery Truth band
   - top reason confidence changed
   - next decision owner

2. **Today’s Required Actions**
   - maximum 5
   - each has owner, due signal, reason, and next action
   - grouped by urgency, not by module

3. **Role Lens**
   - PM
   - Workstream Lead
   - QA/Validation
   - Data Migration
   - DAP/Adoption
   - Sponsor/SteerCo
   - CTO/Architecture

4. **Operating Lanes**
   - Plan
   - Readiness
   - Governance
   - Delivery Truth

The command center should not start with charts. Charts are secondary.

---

## 5. Setup UX

Setup should feel like a guided interview, not a form.

### Setup Step 1: Choose Starting Path

Cards:

- Use a template
- Import a plan
- Start blank

This part exists today and is directionally right.

### Setup Step 2: Choose Template

Template cards should answer:

- What type of project is this?
- Who is it for?
- What operating model will be created?
- What does it not create yet?

Template examples:

- Veeva RIM implementation
- CSV validation project
- Data migration project
- PromoMats migration
- eQMS rollout
- SAP S/4HANA implementation
- SAP S/4HANA GxP validation
- SAP ECC to S/4HANA migration
- LIMS implementation
- MES implementation
- Serialization / EU FMD readiness
- IDMP / SPOR readiness
- Non-GxP enterprise SaaS rollout
- Generic implementation

### Setup Step 3: Confirm Delivery Shape

This should be a **read-only consequence summary**, not fake switches unless switches change the output.

Example for Veeva RIM:

```text
This template creates:
- 4 RIM module workstreams
- 4 Vault Connection workstreams
- Migration dry-run placeholders
- Validation/UAT/PQ artifacts
- Publishing/gateway readiness tasks
- Cutover and hypercare gates

Still not created:
- real Vault API connection
- migration run object
- traceability matrix object
- UAT execution records
```

If the user toggles something, it must change the generated model. Otherwise, do not show toggles.

### Setup Step 3A: Template Refinement Questions

The setup should ask only questions that change the generated operating model.

Good questions:

- Is this GxP-regulated?
- Is validation required?
- Is data migration in scope?
- Are integrations or Vault/SAP connections in scope?
- Is formal UAT/PQ required?
- Is cutover/go-live readiness required?
- Is this Europe/EMA/EU-market focused?
- Does the project need country/affiliate rollout waves?

Bad questions:

- Decorative toggles that merely explain the template.
- Questions whose answers are not used.
- Questions that sound precise but do not alter tasks, documents, risks, or readiness gates.

### Setup Step 4: Enter Basics

Fields:

- Project name
- Client/business unit
- Target go-live
- Start date
- Methodology
- Sponsor
- Project manager

Basics should come after template choice because template choice can pre-fill sensible defaults.

### Setup Step 5: Review Operating Model

This is the real checkpoint.

Show:

- phases
- workstreams
- roles
- milestones
- top tasks
- validation artifacts
- migration dry runs
- readiness gates
- risks seeded
- gaps not yet modeled

The CTA should be:

```text
Create command center
```

Not "Confirm and create." The user is not creating a form; they are creating the operating room.

### Setup Step 6: First Landing After Create

Land on Command Center with an onboarding banner:

```text
Your command center is ready.
Start with these 5 actions:
1. Confirm charter owner
2. Review first gate dates
3. Assign unresolved owners
4. Review seeded risks
5. Open Delivery Truth
```

---

## 6. Persona Jobs

### Project Manager

Needs:

- morning run view
- what changed
- blockers
- upcoming decisions
- schedule and readiness credibility
- SteerCo story

Primary path:

```text
Command Center -> Today’s Actions -> Delivery Truth -> Governance -> Reports
```

### Workstream Lead

Needs:

- what I own
- what is due soon
- what blocks me
- what I block
- decisions needed from other teams

Primary path:

```text
Command Center role lens -> Worklist -> Tasks -> Plan
```

### QA / Validation Lead

Needs:

- validation strategy status
- URS status
- UAT/PQ script readiness
- traceability coverage
- evidence gaps
- VSR readiness

Primary path:

```text
Readiness -> Validation lane -> Documents -> Worklist -> Governance
```

Missing today:

- traceability object
- UAT/PQ script execution
- evidence state

### Data Migration Lead

Needs:

- source inventory
- mapping status
- dry-run count
- reconciliation status
- defect counts
- production-load readiness

Primary path:

```text
Readiness -> Migration lane -> Worklist -> Risks -> Cutover readiness
```

Missing today:

- migration run object
- reconciliation metrics
- load defect tracker

### DAP / Adoption Lead

Needs:

- affected personas
- training readiness
- adoption risks
- user guidance assets
- hypercare feedback

Primary path:

```text
Readiness -> Training/DAP lane -> Documents -> Worklist -> Reports
```

Missing today:

- persona/adoption journey object
- training attendance
- hypercare adoption feedback

### Sponsor / SteerCo

Needs:

- can we still hit go-live
- what decision is needed
- what tradeoffs exist
- top risks
- budget pressure
- readiness confidence

Primary path:

```text
Command Center sponsor lens -> Delivery Truth -> Governance -> Reports
```

### CTO / Architecture Lead

Needs:

- environment readiness
- integration architecture
- Vault Connection flow status
- API/security risks
- scalability/support model
- cutover technical readiness

Primary path:

```text
Command Center CTO lens -> Readiness -> Plan -> Risks
```

Missing today:

- architecture/integration map
- environment register
- connection readiness object
- security/control view

---

## 7. Navigation Model

The sidebar should be based on how people run the project.

### Start

Only shown prominently if setup is incomplete.

- Start Project
- Import Plan

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

Registers are drill-downs, not the main experience.

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

---

## 7.1 Template Strategy

Templates are not just starter task lists. A template is an operating-model generator.

### Template Dimensions

Every template should declare:

- Industry: pharma, biotech, medtech, healthcare, generic enterprise
- System family: Veeva, SAP, Quality/eQMS, LIMS, MES, Microsoft, generic SaaS
- Regulatory mode: GxP, non-GxP, mixed
- Region: global, Europe/EMA, US/FDA, APAC, country rollout
- Delivery method: CSV/GAMP, SAP Activate, agile, waterfall/stage-gate, hybrid
- Scope elements: migration, integration, validation, UAT, cutover, training, hypercare
- Output entities: milestones, tasks, documents, risks, roles, cost lines, readiness gates

### Template Families To Build

#### Pharma / Regulatory

- Veeva RIM implementation
- Veeva PromoMats migration
- Veeva Clinical Vault implementation
- Veeva Quality/eQMS implementation
- IDMP/SPOR readiness
- Regulatory submission gateway readiness

#### SAP / ERP

- SAP S/4HANA greenfield implementation
- SAP ECC to S/4HANA migration
- SAP S/4HANA GxP validation
- SAP Quality Management rollout
- SAP serialization / EU FMD readiness
- SAP master-data governance project

#### Quality / Manufacturing

- eQMS rollout
- LIMS implementation
- MES implementation
- Deviation/CAPA process transformation
- CSV remediation project

#### Data / Platform

- Legacy data migration
- Document migration
- Integration platform rollout
- Identity/SSO rollout
- Data-quality remediation

#### General

- Generic regulated system implementation
- Non-GxP SaaS rollout
- PMO recovery project
- Audit remediation project

### Template Maturity Levels

Each template should have a maturity level:

- **L1 Starter:** workstreams, milestones, top tasks.
- **L2 Operating:** roles, documents, risks, readiness gates, cost lines.
- **L3 Domain:** first-class domain objects such as Vault Connections, Migration Runs, Traceability Items, UAT Scenarios.
- **L4 Evidence:** validation evidence, approval state, audit trail, export pack.

Veeva RIM should become the first L3/L4 template because it is the hardest stress test.

---

## 8. Screen Map

### Start Project

Purpose: create or complete the operating model.

Primary question:

```text
What kind of project are we starting, and what structure should the app create?
```

### Command Center

Purpose: daily run briefing.

Primary question:

```text
What matters today?
```

### Delivery Truth

Purpose: promise credibility.

Primary question:

```text
Can we still hit the promise, and why?
```

### Worklist

Purpose: execution queue.

Primary question:

```text
What do I need to do or unblock?
```

### Plan

Purpose: schedule and structure.

Primary question:

```text
What is the plan and where are the dependencies?
```

### Readiness

Purpose: gate confidence.

Primary question:

```text
Are validation, migration, UAT, training, cutover, and go-live ready?
```

### Governance

Purpose: control and accountability.

Primary question:

```text
What risks, decisions, budget pressure, and sponsor actions need governance?
```

### Reports

Purpose: stakeholder output.

Primary question:

```text
What story do we send to SteerCo or sponsors?
```

### Registers

Purpose: detailed records.

Primary question:

```text
Show me the source data behind the operating views.
```

---

## 9. What To Fix Before More Feature Work

### P0 UX Fixes

1. Rename `/setup` to **Start Project** in the sidebar and page.
2. Change setup from one long page to a 5-step guided flow:
   - starting path
   - template/import details
   - template refinement questions
   - basics
   - operating-model review
3. Remove or demote intent toggles unless they change generated output.
4. After project creation, land on Command Center with a first-actions banner.
5. Add no-project / incomplete-project routing logic.

### P0 Product Model Fixes

1. Add first-class `VaultConnection`.
2. Add first-class `MigrationRun`.
3. Add first-class `ValidationRequirement` or `TraceabilityItem`.
4. Add first-class `UATScenario`.

### P1 UI Fixes

1. Command Center first viewport becomes a briefing, not cards/charts.
2. Readiness becomes lane-based with validation/migration/UAT/cutover gates.
3. Worklist gets persona filters by default.
4. Governance gets decision/action owner surface.

### P2 Polish

1. Guided empty states.
2. Better mobile setup flow.
3. Export/share SteerCo summary.
4. Template editor later.

---

## 10. Immediate Design Decision

Do not continue patching individual setup cards.

Next implementation module should be:

```text
M6.3 - Start Project Flow Redesign
```

Definition of done:

- Sidebar says `Start Project`, not `Guided Setup`.
- `/setup` becomes a stepper flow.
- Intent toggles are replaced by a consequence summary unless wired to generation.
- Template review explicitly separates "created now" from "not modeled yet."
- Create lands on Command Center with first-actions banner.
- Existing import and blank modes still work.

After M6.3, the next design module should be:

```text
M6.4 - Template Catalog Strategy
```

Definition of done:

- Template model includes industry, system family, regulatory mode, region, delivery method, scope elements, and maturity level.
- Veeva RIM remains one template.
- SAP S/4HANA, CSV validation, data migration, eQMS, and generic implementation templates are represented in the catalog.
- Setup can filter templates by regulated/non-regulated, industry, and project type.
