# PharmaPM Command Center Product Gaps And Recommendations

Created: 2026-06-16
Purpose: pause feature work, identify why the product is not yet enterprise-sellable, and define the next product hardening sequence.

## Executive View

PharmaPM Command Center has promising foundations: project templates, delivery signals, schedule-impact review, reports, entity registers, and a native guidance layer. But it is not yet a sellable enterprise product because the experience does not consistently help a new PM understand what to do, why it matters, and how the data becomes a credible SteerCo story.

The core issue is not coding capability. The issue is product discipline. Too much work has been implemented as isolated surfaces instead of one guided operating flow.

The product should stop expanding horizontally until the first-run journey, evidence model, and daily operating loop feel obvious.

## Why A Buyer Would Not Buy Yet

### 1. The product promise is still not instantly clear

A buyer should understand in 60 seconds:

- What problem this solves better than MS Project, Smartsheet, Excel, and email.
- Why it is especially useful for regulated pharma delivery.
- How project data turns into board-ready confidence.
- What evidence backs each claim.

Current gap: the app has many good modules, but the user still has to infer the system logic.

Recommendation: make the first screen and DAP explain the operating model:

```text
Create / import project
-> Review plan quality
-> Fix missing evidence
-> Run project
-> Explain delivery truth
-> Send SteerCo report with traceability
```

### 2. First-run setup is too much work before value appears

The setup wizard asks for data, templates, dates, modules, and review counts, but the user does not always see what will actually be created before committing.

Current gap: generation summary counts are not enough. A PM needs to inspect the actual milestone spine, task groups, risk list, documents, owners, and exclusions before creation.

Recommendation:

- Add a reviewable “Generated Operating Model” before create.
- Show tabs: Milestones, Tasks, Risks, Documents, Team, Costs, Out of Scope.
- Let users accept, remove, or defer sections before creating the command center.
- Clearly label playbooks vs starter scaffolds.

### 3. DAP is not yet a real guided-work product layer

Current guidance is closer to contextual help than a digital adoption platform. A real DAP feels like a guided assistant that starts the user, tracks progress, and explains the next action in context.

Recommendation: build native DAP as a visible guided-work layer:

- Welcome card like monday.com: visual, progress, Start, Skip, close.
- Role mode: PM, Sponsor, QA/Validation, Workstream Lead.
- Persistent setup-to-run checklist.
- Smart nudges only when live data indicates a problem.
- Guided task sequences, not generic tooltips.
- “Why this matters” microcopy inside forms.

Good DAP behavior:

```text
You created a CSV Validation project.
Next: review the milestone spine.
Why: the schedule-impact engine depends on clean milestone gates.
Action: open Milestones.
Progress: 2 of 7 setup checks complete.
```

### 4. Several pages still feel like registers, not decisions

Enterprise users do not buy more tables. They buy clarity, control, and confidence.

Current gap: pages like Tasks, Risks, Documents, Costs, Governance, and Reports contain useful data, but do not always answer the page’s business question immediately.

Recommendation: each route must start with its answer:

| Route | Page must answer first |
| --- | --- |
| Dashboard | Can leadership trust the project? |
| Delivery Signals | What changed the promise? |
| Plan | What is the project shape? |
| Milestones | Which gates define the promise? |
| Tasks | Who owns the next move? |
| Risks | What can break delivery? |
| Documents | What evidence or approval is missing? |
| Costs | Is spend still credible? |
| Reports | What can I safely send to leadership? |
| Governance | What decisions and controls need attention? |

### 5. Reports must become the product’s trust centerpiece

The report surface is the main buyer artifact. If it feels static, generic, or disconnected, the product fails.

Recommendation:

- Every report claim must show source evidence.
- “Backtrace” should be explicit and simple.
- Reports should explain missing data without pretending confidence exists.
- Exports must exactly match the screen.
- Report should show what changed since last cycle.

### 6. Schedule impact is powerful but still cognitively heavy

The schedule-impact modal is one of the strongest differentiators. It proves that changing one task can shift downstream dates. But it still asks users to interpret too much.

Recommendation:

- Add a plain-language summary at the top:
  “This change shifts 19 downstream tasks. 16 affect the go-live path. 1 issue must be fixed before saving.”
- Explain red sections:
  “This is a new conflict caused by this edit.”
- Explain green sections:
  “Go-live still holds because shifted work finishes before the committed date.”
- After save, show an impact receipt:
  “Saved. 19 task dates updated. Open changed tasks.”

### 7. Template credibility is uneven

Some templates are moving toward real playbooks. Others still feel like renamed generic scaffolds.

Recommendation:

- Only call something a playbook if domain experts would recognize it.
- Starter templates should be clearly marked as structure-only.
- Add module selection for true suites.
- Add playbook preview before creation.
- Keep honesty tests: no scaffold language inside playbooks.

Priority playbooks:

- Veeva RIM partial-suite implementation.
- Veeva Clinical eTMF / CTMS / Study Startup.
- SAP S/4HANA implementation.
- CSV validation.
- Regulated data migration.
- LIMS implementation.

### 8. The product has no enterprise operating backbone yet

Static GitHub Pages and local browser storage are fine for prototyping, but not for enterprise evaluation beyond a demo.

Required before serious buyer pilots:

- Authentication.
- Organization/workspace model.
- Database persistence.
- Audit log.
- Role permissions.
- Template library with versioning.
- Import history.
- Report snapshots.
- Change history for schedule-impact decisions.

Do not start backend work until the UX flow is stable enough to preserve.

## Recommended Hardening Sequence

### Phase 1: Make The Product Understandable

Goal: a new PM can create a project and understand the operating model without training.

Work:

- Replace quiet DAP with visible guided-work onboarding.
- Add setup-to-run checklist.
- Add generated operating model preview before create.
- Add plain-language explanations for Delivery Signals, schedule impact, and reports.
- Clean the top-level navigation language.

Done when:

- A new user can create a project and explain what the product does in 10 minutes.

### Phase 2: Make The Product Trustworthy

Goal: every key number and claim is traceable.

Work:

- Make reports fully live and project-scoped.
- Add evidence links everywhere a claim is made.
- Add impact receipts after schedule saves.
- Add missing-data states instead of fake confidence.
- Strengthen UI regression for common workflows.

Done when:

- A PM can send a report and prove where each claim came from.

### Phase 3: Make The Product Domain-Credible

Goal: templates feel like real regulated implementation playbooks.

Work:

- Finish domain-specific playbooks.
- Add module selection for suite products.
- Add preview and pruning integrity checks.
- Validate template outputs using realistic project scenarios.

Done when:

- A domain PM says the generated project is a credible starting point, not a renamed generic plan.

### Phase 4: Make The Product Enterprise-Ready

Goal: move from static demo to pilotable product.

Work:

- Add database.
- Add auth.
- Add audit trail.
- Add organization templates.
- Add role permissions.
- Add import/export governance.

Done when:

- Multiple users can safely operate the same project with traceable changes.

## What To Stop Doing

- Stop adding routes unless the route answers a clear user question.
- Stop polishing individual screens before the journey is coherent.
- Stop calling scaffolds playbooks.
- Stop adding screenshots as proof when the underlying user flow is unclear.
- Stop using generic DAP patterns that do not use live project data.
- Stop treating reports as just another page.

## What To Do Next

The next working session should not start with coding. It should answer:

1. What is the exact first 10-minute user journey?
2. Which role are we optimizing first: PM, Sponsor, QA, or Workstream Lead?
3. What does “project is run-ready” mean?
4. What must be visible before project creation?
5. What must the DAP guide the user to complete?
6. What proof would make a buyer say this is better than Monday, Smartsheet, and MS Project for regulated delivery?

Recommended next artifact:

```text
FIRST_10_MINUTES_USER_JOURNEY.md
```

This should define the actual flow before more UI or backend work.
