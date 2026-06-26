# ENGINEERING STANDARDS — the bar every change must meet

> This is the working contract for anyone (human or AI) editing this codebase.
> It exists because we hit real pain: a single idea ("make status muted") took
> edits in four files. The fix is **modularity + single sources of truth +
> comments a human can debug from.** Read [`ARCHITECTURE.md`](ARCHITECTURE.md)
> for _where_ things live; this is _how_ we change them.

## The four principles

1. **Modular** — small, single-purpose files. If a file does two jobs, split it.
   Hard ceiling: **~400 lines** for a component; over that, extract.
2. **Single source of truth** — one concept is defined in exactly one place.
   No copy-paste of tokens, colours, strings, or logic.
3. **Well-commented for debugging** — every module opens with _what it does and
   why it exists_; every non-obvious line says _why_ (not what). A new engineer
   should be able to debug it cold.
4. **Release-safe** — every change is verified by the gate, small, and committed
   with a message that explains the intent.

## Rules

### R1 — One source of truth
- Colours/spacing/type: tokens only. Never hardcode `#0f7c6c` or `bg-rose-50` in
  a component — use a token/shared class. (Status colour → `statusToneClasses`.)
- Repeated UI = a shared component, not a copy. Targets to build/reuse:
  `<PageHeader>`, `<StatusPill>`, `<RegisterGrid>`, `<Field>` (`ui/entity-drawer`).
- Repeated logic = a helper in `lib/` (e.g. `shortId`, `dates`), with a test.

### R2 — Keep the domain pure
- `lib/domain/*` must stay free of React, stores, and `window`. Pure in → pure
  out, with a `*.test.ts` beside it. This is the moat — protect it.
- Components/screens never recompute a number the domain already owns (one
  financial truth: EVM via `use-project-evm`).

### R3 — Comment so a human can debug
- **Module header** (every file): 1–3 lines — what it is, why it exists, any
  non-obvious constraint. Good example, `evm-project.ts`: _"Project EVM adapter +
  confidence scoring."_
- **Inline comments explain _why_**, not what the code already says. Flag
  thresholds, workarounds, and "looks wrong but is intentional" spots.
- Name things in plain domain language (PM-readable), not jargon.

### R4 — User-facing copy
- Plain PM language; honest empty states (state + value + next action). No raw
  ids shown to users where a name fits (recognition over recall). Errors follow
  the three-part pattern (what / why / next).

### R5 — Release discipline
- Run `pnpm release:verify` (test + build + e2e) **before** claiming done.
- One logical change per commit; message says the _intent_, not the diff.
- `git pull --rebase` before pushing (Codex works in parallel; `tasks-grid.tsx`
  overlaps). Push only when asked.

### R6 — Don't break the non-negotiables
One financial truth (EVM) · no fabricated data · live store only · scoring
thresholds are not user-configurable. (See `CLAUDE.md` / operating doc.)

## Cookbook — make a common change in ONE place

| Change | The one place (target state) |
|---|---|
| A brand colour | the token source (being consolidated to one file) |
| A status tone | `components/ui/status-pill.tsx` |
| Every page's title style | `<PageHeader>` component |
| A register's behaviour | shared `<RegisterGrid>` |
| A displayed id format | `shortId` in `lib/utils.ts` |
| The current user | `lib/settingsStore.ts` |

If a change can't be made in one place, that's a **modularity bug** — fix the
structure first, then make the change.

## Pre-commit checklist

- [ ] Could this change have been one edit? If not, did I consolidate first?
- [ ] New/edited file has a header comment; non-obvious lines say _why_.
- [ ] No hardcoded colours/strings/logic that belong in a token/helper/component.
- [ ] Domain stayed pure (no React/store in `lib/domain`).
- [ ] `pnpm release:verify` is green.
- [ ] Commit message explains intent.

## Active modularization backlog (the debt to retire)

1. **One token source** — merge `design-tokens.css` + `globals.css` colour defs.
2. **`<PageHeader>`** — replace 18 copy-pasted `<h1>` blocks.
3. **One status system** — fold the bespoke `.pill` CSS into `<StatusPill>`.
4. **`<RegisterGrid>`** — de-duplicate the entity grids (tasks 1,250 / milestones 940 lines).

Tracked in [`UI_REPORT.md`](UI_REPORT.md) §14.
