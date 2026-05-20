# Learnings - Building PharmaPM Command Center

> Living notes for this fork. Adapted from the `pharmapm-pro` learnings doc and grounded in the command-center work.

## 1. The Main Lesson

The highest-leverage move is a repo-level source of truth. Without it, each AI session restarts cold, repeats decisions, touches the wrong repo, or ships a UI that passes tests but does not feel usable. For this fork, `AIVELLO_OPERATING_DOC.md` is that anchor.

## 2. What To Do At The Start Of A Session

1. Read `AIVELLO_OPERATING_DOC.md`.
2. Confirm the current module from section 4.
3. Check that the work belongs in `pharmapm-command-center`, not the original `pharmapm-pro`.
4. Make the smallest useful change.
5. Verify with tests/build and, for UI, live browser or GitHub Pages checks.

## 3. Product Lessons So Far

- PMs need next-action guidance more than they need another dashboard.
- The app should support the current delivery reality: mixed teams of AI agents and human-led workstreams.
- The app should open on what to do next, not on a table of raw objects.
- Enterprise users still need detailed grids, but grids should sit behind operating views.
- Built-in adoption guidance should be contextual, dismissible, and role-aware.
- Status color must be consistent: rose means blocking, amber means attention, blue means information, emerald means resolved.
- A GitHub Pages deploy is not done until the public URL is checked for 200 and visible content.

## 4. UI Direction

The current direction is an enterprise command centre with five primary operating views:

- Command Center: role-specific next actions.
- Worklist: blocked, due soon, in progress, and decisions.
- Plan: charter, schedule, tasks, milestones, and waiting links.
- Governance: risks, decisions, budget, and sponsor follow-up.
- Readiness: validation, migration, training, and go-live checks.

This is intentionally different from a pure CRUD app. Detailed modules remain available, but the product should guide PMs through project setup and delivery, almost like a non-LLM version of an embedded project assistant.

## 5. Engineering Lessons

- Keep the original repo untouched when experimenting in this fork.
- Engine correctness comes before UI polish.
- For any delivery-truth engine, forecast model, impact analysis, or agent-cost model, write the behavior/spec and tests before polishing the screen.
- Keep one main module per session; extra ideas go to the operating doc backlog.
- Avoid heavy visualization libraries unless the product problem proves they are needed.
- Tests passing are necessary, but UI work also needs dogfooding.
- Commit messages and session logs are product memory.

## 6. Current Open Questions

- What is the simplest reliable import path for Microsoft Project and Planner exports?
- Should M5 focus on guided setup/import/workstream onboarding before a full visual design-system pass?
- Which free database path is best for the next persistence step?
- What role permissions are needed first: PM, workstream lead, QA, data migration, sponsor, or admin?
- Which enterprise PM patterns from Veeva, MS Project, Primavera, Smartsheet, Monday, Asana, and Jira should be adopted or deliberately rejected?

## 7. Latest Snapshot

As of 2026-05-19, the command-center fork has local guided setup/import work ready for dogfood. It adds `/v2/setup/` for guided templates, Microsoft Project/Planner imports, and blank project setup. The latest deployed public version still has operating views at:

- `https://buildpod.github.io/pharmapm-command-center/v2/`
- `https://buildpod.github.io/pharmapm-command-center/v2/worklist/`
- `https://buildpod.github.io/pharmapm-command-center/v2/plan/`
- `https://buildpod.github.io/pharmapm-command-center/v2/governance/`
- `https://buildpod.github.io/pharmapm-command-center/v2/readiness/`

Latest verified deploy commit: `2071af4`.
