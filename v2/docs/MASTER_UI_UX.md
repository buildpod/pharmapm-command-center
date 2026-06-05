# PharmaPM Command Center Master UI/UX Guide

This file is the first stop for any Codex, Claude, or design agent changing the
Command Center UI. It turns the NotebookLM UX audit, Claude design prompts, and
current implementation choices into one practical operating guide.

## Product Intent

PharmaPM Command Center is an enterprise project-control surface for regulated
technology delivery. It should help a PM, sponsor, or SteerCo answer:

- What is the current delivery story?
- Can leadership trust the plan?
- What needs action now?
- Which evidence supports the claim?
- What changed, and what downstream work is affected?

The app is not a landing page or a generic dashboard. It is a working command
center for repeated project operation.

## Design Source Of Truth

Use these before changing UI:

- `v2/app/styles/design-tokens.css`
- `v2/app/styles/components.css`
- `v2/app/styles/dashboard.css`
- `v2/app/styles/tasks.css`
- `v2/docs/DESIGN_INVENTORY.md`
- `v2/docs/CODEBASE_INDEX.md`
- `v2/docs/LOCAL_SERVER_REGISTRY.md`

Do not add new colors, fonts, or one-off palettes. Use existing token variables
and shared classes first.

## UX Principles

1. Visibility of status
   Every major action should tell the user what happened, what is waiting, and
   what remains unresolved.

2. Plain PM language
   Visible UI should say "Review Schedule Impact", "Waiting for action",
   "Approvals required", and "Delivery Signals". Avoid engineering words like
   cascade, topology, engine, graph, mutation, and entity.

3. Recognition over recall
   The PM should not need to remember where a task, risk, approval, or milestone
   lives. Labels, empty states, and route titles must explain the business job.

4. Progressive disclosure
   Show action first. Hide completed reviewers, long detail lists, and low-value
   rows behind "Expand details" unless they are the primary work of the page.

5. Regulated-industry trust
   Avoid dark patterns. Never hide risk, approval, audit, or schedule-impact
   information to create false confidence.

6. Executive cognition
   A sponsor should understand the project state in 60 seconds: verdict,
   schedule, risk, budget, readiness, decisions, and evidence path.

## Route Purposes

| Route | Primary user question | UX rule |
|---|---|---|
| `/` Dashboard | Is the project healthy enough to trust? | First viewport must show verdict/KPIs; detailed lists can expand. |
| `/truth` Delivery Signals | What evidence supports the delivery story? | Keep claims tied to tasks, risks, documents, milestones, or costs. |
| `/reports` Reports | What can I send to leadership? | Report empty states must explain what the absence means for governance. |
| `/setup` New Project | How do I create or import the command center? | Guide the user through discovery, build method, import/map, and review. |
| `/worklist` Worklist | What work is active? | Prioritize action and blockers over raw volume. |
| `/my-items` My Items | What do I personally owe? | Empty state should reassure and explain ownership aggregation. |
| `/readiness` Readiness Gates | Are gates ready for go-live? | Surface missing evidence and approval blockers. |
| `/plan` Plan | What is the project shape? | Link plan structure to charter, milestones, tasks, and dependencies. |
| `/governance` Governance | What decisions and controls matter? | Keep language business-facing and audit-ready. |
| `/charter` Charter | Is scope and authority clear? | Empty state should promote SteerCo alignment and auditor readiness. |
| `/milestones` Milestones | Does the schedule promise still hold? | Planned-date edits must lead to schedule-impact review. |
| `/tasks` Tasks | Who owns the next move? | Reduce dependency clutter; show blockers and ownership clearly. |
| `/risks` Risks | What exceptions need attention? | Empty/filter states should explain how risk focus helps leadership. |
| `/documents` Documents | What approvals and evidence are waiting? | Show pending approvers first; completed RACI is detail. |
| `/costs` Costs | Is spend still credible? | Tie empty or quiet states to budget confidence. |
| `/resources` People & Meetings | Who is needed and what meeting actions remain? | Empty states should distinguish no action from no visibility. |
| `/projects` Manage Projects | Which command center is active? | Project creation and "New Project" language must stay consistent. |
| `/settings` Rules & Settings | What rules drive schedule calculations? | Explain why calendars and controls matter. |

## Empty-State Standard

Every empty state should include:

1. A clear state title.
2. One business-value sentence.
3. A next action or recovery hint when relevant.

This applies to full pages, cards, drawers, side panels, list editors, popovers,
and form sub-sections. Drawer micro-states like "Objectives", "Reviewers", or
"Attendees" must not say only "Nothing added yet" or "None yet"; they should
recommend what a good entry looks like and why the entry matters.

Good examples:

- "Charters keep your SteerCo aligned and auditor-ready."
- "Tasks show who owns the next move and what is blocking delivery."
- "Documents keep decisions, approvals, and audit evidence visible in one place."
- "Holiday calendars keep schedule shifts realistic for each region."
- "Recommended: add 2-4 measurable outcomes."
- "Recommended: add accountable sign-off owners."

Avoid:

- "No data."
- "Nothing found."
- "No entities available."
- "Nothing added yet."
- "None yet."

## Schedule Impact Language

Visible UI should use:

- "Review Schedule Impact"
- "Schedule impact"
- "Affected downstream tasks"
- "Waiting link"
- "Discard changes"

Internal identifiers may still use `cascade` because the domain engine and audit
source names already use that term.

## Coachmark Anchors

Current static anchors:

- `task-due-date`
- `task-dependencies`
- `milestone-planned-date`
- `milestone-forecast-date`
- `schedule-impact-drawer`

The reusable presentation component is:

- `v2/components/ui/coachmark.tsx`

Do not add persistence, localStorage, or tour state unless explicitly requested.

## Component Rules

- Use shared pills: `pill--ok`, `pill--warn`, `pill--risk`, `pill--info`,
  `pill--neutral`.
- Use shared topbar, navigation, card, drawer, and field patterns.
- Prefer existing `ProgressBar`, `StatusPill`, `Coachmark`, and token classes.
- Avoid decorative gradients, oversized hero sections, or marketing-style cards.
- Keep dashboards dense, readable, and executive-oriented.

## Verification Checklist

Before reporting UI work complete:

1. Run `pnpm test`.
2. Run `pnpm build`.
3. If build ran, refresh local preview with `pnpm dev:verified`.
4. Run `pnpm preview:check`.
5. Browser-check affected routes at:
   `http://localhost:3000/pharmapm-command-center/v2/`

Always provide:

- Local test link.
- GitHub repo link.
- GitHub Pages link.
- Commit link if pushed.

## Current GitHub URLs

- Repo: `https://github.com/buildpod/pharmapm-command-center`
- GitHub Pages: `https://buildpod.github.io/pharmapm-command-center/v2/`
