# Claude Working Instructions

Read `COMMAND_CENTRE_PHARMAPM_PRO.md` first, then identify the current product priority before writing code.

Keep work scoped to `pharmapm-command-center` unless Vineet explicitly asks for changes in another repository.

For UI changes, show what changed, verify tests/build, and check the live GitHub Pages route before asking Vineet to commit.

Work efficiently: think before coding, make surgical changes, avoid speculative abstraction, match existing style, and define verifiable success criteria before implementing non-trivial work.

For critical delivery-truth engines, formalize the behavior and tests before polishing UI. Keep one module per session and log only durable decisions in the operating doc.

## Project skills (ported from the original repo — Phase 4)

`.claude/skills/` carries 11 skills; read `.claude/skills/README.md` at session start and invoke them proactively:

- **Quality (every UI string / color / error):** `ui-string-audit`, `tone-discipline` (enforces the Tone Semantics table in the operating doc), `error-message-pattern`
- **Efficiency:** `session-bootstrap`, `focused-read`, `lean-test-output`, `parallel-tool-calls`, `audit-log-compression`
- **Architectural (any save handler / guard / cross-entity change):** `save-flow-parity`, `pre-existing-state-distinction`, `cross-entity-parity`

## Non-negotiables (carried over from the original repo's anti-drift rules)

1. One financial truth: confidence, cost pressure, and budget claims come from the EVM snapshot (`useProjectEvm` / `calculateDeliveryTruth` with `evm`) — never recomputed locally (operating-doc decision #11).
2. No fabricated data on any surface: coverage-gate scores, badge sample data, warn before thin imports. Honest empty states per MASTER_UI_UX.
3. Live store only: components never import value bindings from `mockData` (allowlist: provider seeds, entity-store seeds, templates, use-project-evm's budgetTrend).
4. Do not assume code runs — test before claiming. `pnpm release:verify` before push.
5. Scoring thresholds (verdict bands, EVM weights, anomaly rules) are NOT user-configurable. That is a product decision, not an oversight.

## History

This repo absorbed the `pharmapm-pro` v2 line (engines, registers, design discipline) in June 2026 — that repo is archived as reference; its v1 app and full module history (`AIVELLO_OPERATING_DOC.md`, M0–M33) remain there.
