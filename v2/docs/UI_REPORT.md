# PharmaPM Command Center — Full UI Report

_Author: Claude (Opus 4.8) · Date: 2026-06-24 · Scope: `v2/` Next.js app_

A multi-perspective UI/UX audit, graded against the project's own standard
([`MASTER_UI_UX.md`](MASTER_UI_UX.md)) and design tokens
([`design-tokens.css`](../app/styles/design-tokens.css)).

> **Update 2026-06-24 — Phase 1 shipped (release gate green).** The four
> fabricated-data items (§10) and the hardcoded identity are fixed; the
> dark-mode toggle is hidden pending §5. See §14 for current status.

---

## 0. Executive summary

The product has a **high-taste design foundation** (a considered token system, a
strong evidence surface in Delivery Signals, disciplined forms and empty-state
copy) that is undercut by **three structural fractures**:

1. **Two coexisting styling systems** — a bespoke token CSS (dashboard/chrome)
   and Tailwind/shadcn (18 of 21 pages) — that disagree on the **primary colour,
   the typeface, and the dark-mode story**.
2. **Fabricated data on the flagship screen** (hardcoded phase tracker, fake
   sparklines, static nav counts) — a direct contradiction of the product's
   no-fabricated-data thesis.
3. **A single hardcoded operator identity/role**, so two of the three named
   personas (workstream lead, SteerCo) have no real seat.

None require a redesign. The fixes are **convergence and honesty**, not new taste.

### Scorecard

| Perspective | Grade | Headline |
|---|---|---|
| Visual design / brand (look & feel) | **B−** | Strong intent, fragmented execution (teal vs indigo, serif vs system) |
| Design system & consistency | **C** | Two systems; bespoke component library underused |
| Information architecture & nav | **B−** | Logical two-level nav; route-naming drift; dense topbar |
| Theming / dark mode | **D** | Half the app darkens, half stays light |
| Content & microcopy / tone | **B+** | Excellent empty-state standard; some jargon leaks |
| Interaction & forms | **B+** | Robust validation & guidance; label-association gap |
| Accessibility | **C+** | Good aria coverage; 0 `htmlFor`; contrast risks |
| Responsive / mobile | **B** | Deliberately handled in tokens |
| Data honesty in UI | **C** | Fabricated phase/sparklines/counts |
| Per-persona fit | **C** | Single-operator by design; lead/SteerCo unseated |

**Overall: B−** — a B+ design with a C+ rollout.

---

## 1. Method & scope

**Deep-read:** dashboard ([`page.tsx`](../app/(app)/page.tsx)), Delivery Signals
([`truth/page.tsx`](../app/(app)/truth/page.tsx)), sidebar, topbar, My Items,
Worklist, Reports shell, task drawer ([`task-form.tsx`](../components/tasks/task-form.tsx)),
command palette, navigation model, design tokens, globals.

**Scanned (not deep-read):** the six register grids, setup wizard internals,
and the governance/readiness/plan/charter/costs/documents/decisions/issues/
milestones/resources/projects/settings bodies — assessed at system + structure
level. Items depending on those are marked _(scan)_.

**Environment caveat:** the preview dev server 404s in this env, so all visual
claims are derived from source/CSS, not a running browser. Items needing a live
check are marked _(verify in browser)_.

---

## 2. Visual design & brand — "look & feel"

**The intent (strong).** [`design-tokens.css`](../app/styles/design-tokens.css)
is a mature, distinctive system: a _warm_ off-white page (`#fafaf7`), a
navy→teal regulatory palette, a **serif display face** (Source Serif 4) for
titles and KPI numbers, a **muted** status palette (not Bootstrap), tight radii,
and an explicit "border _or_ shadow, never both" rule. This is more
differentiated than the Linear/Stripe clone most PM tools settle for.

**The reality (fragmented).** The brand identity is largely _aspirational_
because a second system overrides it on most screens:

- **Two primary colours.** Bespoke `.btn--primary` = teal `#0f7c6c`
  ([design-tokens.css:249](../app/styles/design-tokens.css:249)); Tailwind
  `bg-primary` = indigo `224 71% 36%` ([globals.css:18](../app/globals.css:18)).
  The CTA colour **changes by page** (dashboard teal; task form, truth, command
  palette indigo).
- **Two typographic identities.** globals pins `html` to **system-ui/Inter**
  ([globals.css:77](../app/globals.css:77)); the serif only appears via `.t-*`
  classes, used on **3 routes**. The "broadsheet" feel is invisible on the other 18.
- **Two temperatures.** ✅ _Neutral surfaces aligned (Phase 2c-i):_ the shadcn
  base is now warm (page `#fafaf7`, sunk `#f5f4ef`) to match the dashboard.
  ✅ _Shared `StatusPill`/`statusToneClasses` muted (Phase 2c-ii):_ truth,
  risks-grid, tasks-grid, and dashboard pills now use the bespoke regulatory
  tokens; my-items and worklist inline maps migrated too — status colour is
  now consistent app-wide. Residual: a few destructive-action affordances
  (delete buttons, error banners) still use bright rose — semantically fine,
  optional cleanup.
- **Two stated philosophies in the comments:** design-tokens says "warm, not
  blue-gray"; globals says "slate-neutral base." They are opposed.

**Look-and-feel recommendations**
1. Pick **one** primary colour (teal is the more distinctive brand choice) and
   one type identity; delete the loser. **✅ Colour unified to teal
   (2026-06-24, Phase 2a):** Tailwind `--primary`/`--ring` map to brand teal
   `#0f7c6c`, matching `.btn--primary`. **✅ Type unified (Phase 2b):** body
   font → Inter Tight app-wide; page titles (h1) → Source Serif everywhere
   (card/section titles stay sans).
2. ✅ Fonts confirmed loaded via [layout.tsx:21](../app/layout.tsx:21) and now
   applied app-wide (Phase 2b) — was previously only on the 3 bespoke pages.
3. Keep the muted palette, but ensure a true `risk/breach` has enough contrast to
   _earn_ attention against the beige — currently everything reads low-urgency.

---

## 3. Design system & consistency

- **🔴 Two systems, 18 vs 3.** Bespoke `.t-page-title`/`.card`/`.kpi` survive only
  on dashboard, charter, activity; all other routes use Tailwind utilities.
- **🔴 A real bespoke component library is underused.** `components.css` defines
  `page-header`, `form-section`, `field-input`, `list-row`, `coachmark`,
  `guided-work`, `pill`, `btn`, etc. — but pages re-implement these inline in
  Tailwind. The documented "source of truth"
  ([MASTER_UI_UX.md:33](MASTER_UI_UX.md:33)) is bypassed in practice.
- **🔴 Token duplication.** Colour, radius, and type are defined twice
  (design-tokens.css `--color-*` vs globals.css shadcn HSL vars) with different
  values. Any future palette change must be made in two places that disagree.

**Recommendation:** choose the target system. Given 18 pages + forms + dark mode
already live on Tailwind/shadcn, the lower-effort convergence is to **port the
bespoke dashboard/chrome onto the Tailwind token layer** and re-express the
brand (teal, serif, warm surfaces) as Tailwind theme tokens — then the
`MASTER_UI_UX` token files become a spec, not a parallel implementation.

---

## 4. Information architecture & navigation

- **Two-level nav:** primary tabs (Command/Plan/Governance/Finance/People) in the
  topbar ([topbar.tsx:144](../components/topbar.tsx:144)); sidebar shows only the
  active tab's sub-items ([sidebar.tsx:53](../components/sidebar.tsx:53)). Logical,
  but the sidebar _looks_ like the whole nav while showing ~5 of 20 routes — a
  first-timer may not realise the thin topbar row is the primary switch.
- **🟠 Route-naming drift for the home route.** It's "Dashboard" in the sidebar,
  "Command" as the tab, and **"SteerCo Brief"** in the command palette
  ([command-palette.tsx:16](../components/command-palette.tsx:16)). Pick one name.
- **🟠 Topbar density:** ~11 controls in a 56px bar (breadcrumb, sample pill,
  project switcher, search, theme, notifications, Guide, DAP, Export, New Project,
  Admin) ([topbar.tsx:46](../components/topbar.tsx:46)).
- **✅ Command palette is excellent:** ⌘K, live project-scoped entity search,
  keyboard hints, good empty state.
- **🔴 Fabricated nav badges:** Risks `"3"`, Documents `"2"` are static strings
  ([navigation.ts:55](../lib/navigation.ts:55)), not the live store.

---

## 5. Theming / dark mode

A light/dark toggle ships in the topbar ([topbar.tsx:86](../components/topbar.tsx:86)).

- **✅ Works** for the 18 Tailwind pages, forms, drawers, command palette —
  globals.css has a full `.dark` block ([globals.css:40](../app/globals.css:40))
  and components use `dark:` variants
  ([task-form.tsx:209](../components/tasks/task-form.tsx:209)).
- **🔴 Breaks** for the bespoke surfaces: dashboard, sidebar, topbar, pills,
  KPIs, charter. None of the five bespoke CSS files define dark overrides; the
  body background is hard-pinned to light `--color-surface-page`
  ([design-tokens.css:139](../app/styles/design-tokens.css:139)); chart strokes
  are hardcoded hex ([page.tsx:565](../app/(app)/page.tsx:565)).

**Net:** toggling dark mode produces a broken split-theme on the flagship screen
_(verify in browser, but the CSS is unambiguous)_.

**Recommendation:** either (a) add dark coverage to the bespoke layer (folds into
the §3 convergence), or (b) **hide the toggle** until then — a visibly broken
flagship is worse than no toggle. (b) is a one-line stopgap.

**Decision (2026-06-24, Vineet): light is the default theme; dark mode is
optional / low-priority.** Phase 1 took stopgap (b). Proper dark support is
deferred into the §3 token convergence — the bespoke tokens need restructuring
for inversion first (several `--color-brand-*` values are used as both fill _and_
text, so they can't be naively flipped). Until then the product ships light-only,
and the toggle stays hidden rather than exposing a broken dark theme.

---

## 6. Content & microcopy / tone

- **✅ Empty-state standard is a genuine differentiator.** The documented rule
  (state title + business-value sentence + next action,
  [MASTER_UI_UX.md:86](MASTER_UI_UX.md:86)) is largely honoured — e.g. the
  Delivery Signals coverage states ([truth/page.tsx:243](../app/(app)/truth/page.tsx:243)),
  My Items "You're all clear" ([my-items/page.tsx:79](../app/(app)/my-items/page.tsx:79)),
  and form hints ("Recommended: …", [task-form.tsx:264](../components/tasks/task-form.tsx:264)).
- **✅ Plain-PM-language wins:** "Review schedule impact", "What needs attention",
  "Decisions Needed", "Trace".
- **🟠 EVM jargon leaks** past the translation layer: "Schedule pace 0.95",
  "SPI(t)", "Earning $0.95 of planned work per $1 spent"
  ([page.tsx:514](../app/(app)/page.tsx:514)) — against UX principle #2.
- **🟠 Naming consistency** (see §4: Dashboard/Command/SteerCo Brief).

---

## 7. Interaction & forms

- **✅ Validation is best-in-class for a prototype** ([task-form.tsx](../components/tasks/task-form.tsx)):
  named field errors, ISO + project-range date checks, **dependency-cycle
  detection with the offending path**, duplicate-name warning, auto-derived
  status from progress. Honours the `error-message-pattern` discipline.
- **✅ Guidance in context:** `DrawerGuidance`, per-field hints, coachmark anchors,
  disabled cycle-candidates with hover explanation.
- **🟠 Modal drawer pattern** is consistent (`EntityDrawer`), but confirm the
  shared `Field` component associates label↔input (see §8).
- **🟠 Toast usage** (sonner) for non-blocking warnings is good; verify tone
  mapping matches the single-tone rule _(scan)_.

---

## 8. Accessibility

- **✅ Reasonable aria coverage:** 66 `aria-*`, 42 `aria-label`, `aria-current`/
  `aria-pressed` on nav, decorative SVGs `aria-hidden`, `sr-only` labels present.
- **✅ Keyboard:** command palette fully keyboard-driven; focus-ring token defined
  ([design-tokens.css:127](../app/styles/design-tokens.css:127)).
- **🟠 Label association is implicit, not explicit** _(corrected after a closer
  read)._ The shared `Field` wraps its children in a `<label>`
  ([entity-drawer.tsx:144](../components/ui/entity-drawer.tsx:144)), so _simple_
  single-input fields ARE associated implicitly — the earlier "0 `htmlFor`"
  framing was overstated. The genuine gap is **composite fields** (e.g. the
  dependency picker) where a `Field` `<label>` wraps a `<div>` of nested
  `<label>` rows — invalid nesting. Fixing it well needs a per-call-site audit
  across the ~6 entity forms, not a blind shared-component change.
  **✅ Fixed (2026-06-24):** `Field` now renders an explicit `<label htmlFor>`
  over a `<div>` wrapper (no more label-wrapping), injecting an `id` into the
  single control; `SelectWithCustom` forwards the `id` so category fields
  associate too; composite group fields keep valid structure. Verified via
  `pnpm release:verify` (86 field usages across 10 forms).
- **🟠 Contrast risks:** muted palette + `opacity-75`/`opacity-70` text on tinted
  panels ([truth/page.tsx:128](../app/(app)/truth/page.tsx:128)) may fail WCAG AA
  _(verify with a contrast checker)_.
- **🟠 No `alt` attributes** — fine if there are truly no `<img>` (icons are
  inline SVG), but confirm no raster images slip in.

---

## 9. Responsive / mobile

- **✅ Deliberate handling in tokens** ([design-tokens.css:219](../app/styles/design-tokens.css:219),
  [:278](../app/styles/design-tokens.css:278)): grid collapses to 1 column, sidebar
  hides and moves into a sheet ([topbar.tsx:50](../components/topbar.tsx:50)),
  padding reduces, card headers stack.
- **🟠 Topbar overflow** on mid-widths given control count (§4) _(verify in browser)_.
- **🟠 Wide register tables** (tasks/milestones) need a horizontal-scroll or
  fixed-layout check on small screens _(scan)_.

---

## 10. Data honesty in the UI (the trust perspective)

The product's wedge is "every claim is computed, never hand-set." Four UI spots
violate that on sight — fatal for the skeptical SteerCo/auditor:

| Finding | Evidence |
|---|---|
| Phase tracker hardcoded ("Config 45%", "Phase 3 of 6") | [page.tsx:60](../app/(app)/page.tsx:60), [:467](../app/(app)/page.tsx:467) |
| KPI sparklines are one fake SVG squiggle under every card | [page.tsx:733](../app/(app)/page.tsx:733) |
| Nav badge counts hardcoded ("3", "2") | [navigation.ts:55](../lib/navigation.ts:55) |
| Identity label hardcoded "Project Manager"/"VP" | [sidebar.tsx:96](../components/sidebar.tsx:96) |

These violated non-negotiables #2 (no fabricated data) and #3 (live store only).
**✅ All four fixed in Phase 1 (2026-06-24):** sparklines removed; phase tracker
computed from live milestones; nav counts dropped; sidebar identity wired to
`useCurrentUser()`. Verified via `pnpm release:verify`.

---

## 11. Per-persona journeys

- **First-time PM (operator) — well served.** Strong launchpad first-run
  ([page.tsx:196](../app/(app)/page.tsx:196)), setup-review banner, executive
  verdict. Friction: dashboard density + EVM jargon.
- **First-time workstream lead — no seat.** My Items scopes to the _single_
  localStorage identity ([my-items/page.tsx:38](../app/(app)/my-items/page.tsx:38));
  no workstream filter anywhere; labelled "Project Manager." (Mostly by-design —
  multi-user deferred under the single-operator GTM.)
- **First-time SteerCo — no audience landing.** Arrives on the operator cockpit;
  the SteerCo report is 3 hops away with no read-only framing. The `sponsor`
  guidance role exists but isn't a landing.

---

## 12. Screen-by-screen

System: **B** = bespoke token CSS, **T** = Tailwind/shadcn. Grades are
indicative; _(scan)_ items need a closer pass.

| Route | Sys | Grade | Top issue |
|---|---|---|---|
| `/` Dashboard | B | B | Fabricated phase/sparklines; density |
| `/truth` Delivery Signals | T | A− | Model surface — copy its patterns |
| `/reports` Reports | T | B+ | Good 3-report split; verify empty states |
| `/setup` New Project | T | B _(scan)_ | Largest surface (164 Tailwind hits); entry burden |
| `/worklist` Worklist | T | B | Project-wide; no workstream scoping |
| `/my-items` My Items | T | B | Identity-scoped to one operator |
| `/readiness` Readiness | T | ? _(scan)_ | — |
| `/plan` Plan | T | ? _(scan)_ | — |
| `/governance` Governance | T | ? _(scan)_ | — |
| `/charter` Charter | B | ? _(scan)_ | Bespoke system; dark-mode risk |
| `/activity` Activity | B | B _(scan)_ | Bespoke; dark-mode risk |
| `/tasks` Tasks | T+grid | B | 1250-line grid; strong drawer |
| `/milestones` Milestones | T+grid | ? _(scan)_ | 940-line grid |
| `/risks` Risks | T+grid | ? _(scan)_ | — |
| `/issues` Issues | T+grid | ? _(scan)_ | — |
| `/decisions` Decisions | T+grid | ? _(scan)_ | — |
| `/costs` Costs | T+grid | ? _(scan)_ | — |
| `/documents` Documents | T+grid | ? _(scan)_ | — |
| `/resources` People & Meetings | T | ? _(scan)_ | — |
| `/projects` Manage Projects | T | ? _(scan)_ | — |
| `/settings` Rules & Settings | T | ? _(scan)_ | No standard page-title pattern; holds identity editor |

---

## 13. Component health / maintainability

- **Very uneven grids:** tasks 1250 / milestones 940 lines vs decisions 242.
  The large ones are a maintainability + interaction-consistency risk; a shared
  `RegisterGrid` could host filtering, focus-row, and empty states once.
- **Duplicated design tokens** (§3) are the highest-leverage debt — they make
  every future visual change a two-place edit.

---

## 14. Prioritized backlog

| P | Item | Perspective | Effort | Ties to | Status |
|---|---|---|---|---|---|
| **P0** | Remove fabricated phase tracker, fake sparklines, hardcoded nav counts | §10 | S | Non-neg #2/#3 | ✅ done (Phase 1) |
| **P0** | Sidebar identity → `useCurrentUser()`; drop "Project Manager" | §10/§11 | XS | G1 | ✅ done (Phase 1) |
| **P1** | Composite-field label association (per-call-site audit) | §8 | S | a11y | ✅ done (2026-06-24) |
| **P1** | Dark mode: light default, dark optional → real dark support deferred into §3 convergence | §5 | M | — | ✅ decided; toggle hidden meanwhile |
| **P1** | Unify primary colour + type identity | §2 | M | brand | ✅ colour (2a) + type (2b) done |
| **P1** | Unify the styling system; bespoke library or Tailwind theme, not both | §3 | L | drift | 🟡 colour/type/temp/status converged (2a–2c); token files still duplicated — single-source refactor pending |
| **P2** | Dashboard progressive disclosure + plain-language EVM | §6 | M | UX #2/#4 | open |
| **P2** | Single home-route name (Dashboard) | §4 | XS | content | open |
| **P2** | Topbar declutter; contrast audit; register-grid consolidation | §4/§8/§13 | M | — | open |

## 15. Recommended sequence

1. **P0 batch now** (small, surgical, restores the honesty invariant + a11y) →
   verify with `pnpm release:verify`.
2. **Dark-mode stopgap** (hide toggle) as a one-liner until §5 is scoped.
3. **System convergence (§2/§3)** as a dedicated initiative — converge _toward
   the Delivery Signals quality bar_, not away from it. This is the big rock and
   resolves brand, consistency, and dark mode together.
