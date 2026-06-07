# Repository Working Instructions

Before non-trivial changes, read `COMMAND_CENTRE_PHARMAPM_PRO.md` and identify the current product priority.

Work only in this `pharmapm-command-center` repository unless Vineet explicitly asks for another repo. Do not modify the original `pharmapm-pro` repo while using this fork as a comparison/prototype space.

For UI work, verify the deployed GitHub Pages route when possible. For engine or scheduling work, run the relevant Vitest tests before summarizing.

## Efficiency Principles

- Think before coding: state assumptions, tradeoffs, and unclear points before implementation.
- Keep changes surgical: every changed line should trace to the current request.
- Prefer the minimum useful solution; do not add speculative abstraction or extra features.
- Match the existing project style instead of refactoring nearby code.
- Define success criteria for non-trivial work and verify against those checks.
- Mention unrelated issues you notice, but do not fix them unless they block the task.
- Keep one main module per session; put durable extra ideas in `COMMAND_CENTRE_PHARMAPM_PRO.md` only when they are decisions, not passing notes.
- For critical engines such as forecasting, impact analysis, scheduling, cost, or agent economics, write/adjust the spec and tests before UI polish.
- Treat session logs, structured commits, and ADRs as product memory; update them when decisions change.
