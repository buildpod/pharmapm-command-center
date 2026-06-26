# ARCHITECTURE — the map

**Read this first.** It tells you _where to look for what_. If you only read one
doc, read this. Deep specs are linked at the end. Pair it with
[`ENGINEERING_STANDARDS.md`](ENGINEERING_STANDARDS.md) (the rules for _how_ we
write changes).

---

## 1. The 30-second mental model

Data flows in one direction, in clear layers. Change things at the lowest layer
that owns them, and the layers above update for free.

```
  app/(app)/<route>/page.tsx     ← screens (thin: wire data → components)
        │  uses
        ▼
  components/<area>/*.tsx         ← UI (grids, forms, drawers, cards)
        │  reads/writes
        ▼
  lib/stores/* (Zustand)          ← state (entities, audit, baseline, trend)
        │  computed by
        ▼
  lib/domain/* (pure functions)   ← the brains (EVM, scheduling, impact…) NO UI
        │  seeded from
        ▼
  lib/mockData.ts                 ← seed data + shared TYPES
```

**Golden rule:** `lib/domain/*` is pure and UI-free — it's the moat. Never import
React or a store into it. Numbers come from there, not from components.

---

## 2. "Where do I change X?" (the cheat sheet)

| I want to change… | Go to |
|---|---|
| A **colour / font / spacing token** | `app/styles/design-tokens.css` (bespoke) **and** `app/globals.css` (`:root` shadcn vars). ⚠️ Two sources today — see §7 debt. |
| A **status pill colour** (risk/warn/ok…) | `components/ui/status-pill.tsx` (`statusToneClasses`) — the single React source. CSS twin: `.pill--*` in `design-tokens.css`. |
| A **page title's look** | Today: each `page.tsx` (copy-pasted `<h1>`). Target: a shared `<PageHeader>` (see standards). |
| **Navigation** (tabs, sidebar items, routes) | `lib/navigation.ts` (the model) → rendered by `components/sidebar.tsx` + `topbar.tsx`. |
| The **current user / identity** | `lib/settingsStore.ts` (`useCurrentUser`, `getCurrentUserInitials`). |
| An **entity's data shape / seed** | `lib/mockData.ts` (types + Veeva RIM seed). |
| How an **entity is stored** | `lib/stores/entity-store.ts` + `lib/repositories/entity-repository.ts`. |
| A **register screen** (tasks/risks/…) | `components/<entity>/<entity>-grid.tsx` + `<entity>-form.tsx`. |
| The **confidence / verdict number** | `lib/domain/evm.ts` → `evm-project.ts` (verdict) → surfaced via `lib/hooks/use-project-evm.ts`. Don't recompute in UI. |
| **Schedule / dependency** behaviour | `lib/domain/scheduling.ts` (+ `critical-path.ts`, `dates.ts`). |
| The **Delivery Signals** logic | `lib/domain/delivery-truth.ts` → screen `app/(app)/truth/page.tsx`. |
| A **report's content** | `lib/reports/report-data.ts` + `lib/domain/steerco-brief.ts` → `components/reports/*`. |
| **Setup wizard** steps | `app/(app)/setup/page.tsx` + `lib/setup/project-intake.ts`. |
| **Import** (MS Project / Excel) | `lib/import/project-import.ts`. |
| **Guidance / tours / DAP** | `lib/guidance/*` + `components/guidance/*`. |
| A **display helper** (short id, dates, avatar colour) | `lib/utils.ts`, `lib/domain/dates.ts`, `lib/ui/avatar-color.ts`. |
| The **release gate** | `scripts/release-verify.mjs` (`pnpm release:verify`). |
| **Deploy** | `.github/workflows/deploy.yml` (builds on push to `main`, serves `/v2/`). |

---

## 3. Screens — `app/(app)/*/page.tsx`

Screens should be **thin**: read from stores/hooks, hand data to components.
Shell is `app/(app)/layout.tsx` (sidebar + topbar + providers).

Command: `/` dashboard · `/truth` Delivery Signals · `/reports` · `/activity`
Plan: `/plan` · `/milestones` · `/tasks` · `/worklist` · `/my-items` · `/readiness`
Governance: `/governance` · `/charter` · `/decisions` · `/risks` · `/issues` · `/documents`
Finance: `/costs` · People: `/resources` · Admin: `/projects` · `/settings` · `/setup`

## 4. State & data — `lib/stores/`, `lib/repositories/`, `lib/mockData.ts`

| File | Owns |
|---|---|
| `stores/entity-store.ts` | Central Zustand store for all entities (tasks, risks, …). |
| `repositories/entity-repository.ts` | localStorage persistence behind the store. |
| `stores/audit.ts` | Immutable audit log (every mutation). |
| `stores/baseline-store.ts` | Frozen go-live commitment + re-baseline history (F2/O8.4). |
| `stores/trend-store.ts` | Per-week headline snapshots for trend (O10). |
| `settingsStore.ts` | Operator identity + app settings. |
| `mockData.ts` | Seed data **and the shared TypeScript types**. |
| `useLocalStorageState.ts` | `useState` that mirrors to localStorage. |

## 5. Domain engines — `lib/domain/` (pure, tested, UI-free)

The brains. Every one has unit tests next to it (`*.test.ts`).

| Module | Purpose |
|---|---|
| `evm.ts` | Earned Value engine — pure compute (CPI/SPI(t)/EAC…). |
| `evm-project.ts` | Adapter: live project → EVM input; confidence score + executive verdict. |
| `evm-coverage.ts` | Gate: is there enough data to show a verdict? |
| `delivery-truth.ts` | Delivery Signals — explains the score from real records. |
| `scheduling.ts` | Milestone dependency cascade + RAG status. |
| `critical-path.ts` | Critical chain to go-live (Impact Engine step 2). |
| `consequence.ts` | Impact Engine — consequence projection (steps 3–5). |
| `hard-windows.ts` | Impact Engine — freeze/hard-window collisions (step 6). |
| `baseline.ts` / `baseline-commitment.ts` | Planned-value baseline + frozen commitment (F2). |
| `status-integrity.ts` | Status Integrity Index — claimed-vs-computed (F1). |
| `variance.ts` | Cost variance attribution (rate/volume/scope). |
| `anomaly.ts` | Heuristic anomaly rules (PT-7). |
| `steerco-brief.ts` | SteerCo brief generation. |
| `activity-feed.ts` | Humanized read-model over the audit log. |
| `dates.ts` / `countryHolidays.ts` | UTC ISO date utilities + holiday calendars. |

## 6. Components — `components/`

- `components/ui/*` — **shared primitives**: `entity-drawer` (`EntityDrawer`,
  `Field`), `status-pill`, `impact-drawer`, `progress-bar`, `coachmark`,
  `dialog`, `sheet`, `badge`, `button`, `select-with-custom`. **Reuse these.**
- `components/<entity>/*` — per-entity `*-grid` (table) + `*-form` (drawer).
- `components/dashboard/*`, `components/reports/*`, `components/guidance/*`,
  `components/projects/*` — area-specific.
- Top-level: `sidebar.tsx`, `topbar.tsx`, `command-palette.tsx`,
  `notification-bell.tsx`, `theme-provider.tsx`.

## 7. Styling & tokens — `app/styles/` + `app/globals.css`

- `design-tokens.css` — bespoke design system (`--color-*`, type scale, `.pill`,
  `.card`, `.btn`, `.t-*` type classes).
- `globals.css` — Tailwind base + shadcn HSL vars (`--background`, `--primary`…)
  + the global font stack + dark-mode block.
- `components.css`, `dashboard.css`, `tasks.css`, `activity.css` — area CSS.

> ⚠️ **Known debt (being consolidated):** colour/type are defined in **two**
> places (`design-tokens.css` hex vs `globals.css` HSL). Until merged, a palette
> change is a two-file edit. Status colour is unified in `status-pill.tsx`.
> See [`ENGINEERING_STANDARDS.md`](ENGINEERING_STANDARDS.md) §"Single source of truth".

## 8. Tests & release

- Unit/domain: `*.test.ts(x)` via `pnpm test` (Vitest).
- Browser: `tests/e2e/ui-regression.spec.ts` via `pnpm ui:regression` (Playwright).
- **One command before any push:** `pnpm release:verify` (test + build + e2e),
  writes `output/release-checks/latest.md`.

## 9. Deep-dive specs (open only when working that area)

`MASTER_UI_UX.md` (UI/UX/copy) · `IMPACT_ENGINE_SPEC.md` / `IMPACT_ENGINE_DESIGN.md` ·
`DELIVERY_TRUTH_ENGINE.md` · `CASCADE_ALGORITHM.md` · `DESIGN_TOKENS.md` ·
`UI_REPORT.md` (current UI audit + backlog) · `LOCAL_SERVER_REGISTRY.md`.
