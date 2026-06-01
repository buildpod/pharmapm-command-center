# Component Inventory And Harmonization Plan

Created: 2026-05-26
Purpose: catalogue every shared visual component, identify drift, prescribe the smallest set of changes to bring the app to one visual language. Read alongside `DESIGN_TOKENS.md`.

## What this is not

This is not "add new UI components." The app already has 11,269 lines of UI across `components/`. The job is harmonization — extract patterns, remove drift, do not add surfaces.

## Existing shared primitives (`components/ui/`)

| Component                | File                       | Verdict                                     |
| ------------------------ | -------------------------- | ------------------------------------------- |
| Avatar                   | `avatar.tsx`               | Keep. Used widely.                          |
| Badge                    | `badge.tsx`                | Keep. Sidebar count badges use this.        |
| Button                   | `button.tsx`               | Keep. Variants are shadcn-standard.         |
| Dialog                   | `dialog.tsx`               | Keep.                                       |
| Entity drawer            | `entity-drawer.tsx`        | Keep. Used by risk/task/milestone forms.    |
| Impact drawer            | `impact-drawer.tsx`        | Keep. Used by milestones cascade preview.   |
| Select with custom       | `select-with-custom.tsx`   | Keep. Custom-value-add pattern.             |
| Separator                | `separator.tsx`            | Keep.                                       |
| Sheet                    | `sheet.tsx`                | Keep.                                       |

No new primitives are needed in this pass.

## Patterns that exist inline and should be promoted

These appear in multiple page or component files with small variations. Promote to shared utilities so the next page does not re-invent.

### 1. `StatusPill` — promote

Currently appears as inline maps in:
- `app/(app)/page.tsx` — `briefPill` map
- `app/(app)/truth/page.tsx` — `toneClasses` / `panelToneClasses` / `metricBoxClasses` (three variants)
- `components/risks/risks-grid.tsx` — `bandStyles` and `statusBadge`
- `components/tasks/tasks-grid.tsx` — `priorityStyles`

Proposed shared component: `components/ui/status-pill.tsx`

```typescript
type Tone = "rose" | "amber" | "blue" | "emerald" | "slate";
interface StatusPillProps {
  tone: Tone;
  children: React.ReactNode;
  size?: "xs" | "sm";  // xs=text-[10px], sm=text-[11px]
}
```

Output: `rounded-full border px-2 py-0.5 font-semibold` plus tone classes from `DESIGN_TOKENS.md` section 1. Each usage site replaces its inline map with `<StatusPill tone="rose">Blocked</StatusPill>`.

### 2. `OwnerAvatar` color hash — promote

Currently inline in `app/(app)/page.tsx` (lines 30-37). Move the `AVATAR_COLORS` array and `avatarColor()` function to `lib/ui/avatar-color.ts` and import wherever owner initials are rendered. Examples to update: tasks-grid owner chip, risks-grid owner column, documents-list reviewer chips, resources-panel team cards.

### 3. `ProgressBar` — promote

Appears in:
- `app/(app)/page.tsx` workstream table (uses `bg-primary` — correct)
- `components/tasks/tasks-grid.tsx` (uses status-coloured fill — inconsistent, must change)
- Several other small inline uses

Proposed shared component: `components/ui/progress-bar.tsx`

```typescript
interface ProgressBarProps {
  value: number;          // 0-100
  minWidth?: number;      // default 100px
  showLabel?: boolean;    // default true
}
```

Always uses `bg-primary` fill. No status-coloured variant. If a row needs to convey "blocked" alongside progress, it uses a StatusPill in another cell — see DESIGN_TOKENS section 5.

### 4. `StatCard` (KPI card) — does not exist, would help

The pharmapm-pro v2 dashboard has very clean KPI tiles. The command-center Command Center has its own structure but no dedicated component. Optional: promote a `StatCard` with `{ label, value, delta?, trend?, accent? }` props. Lower-priority than 1-3 above because each KPI usage has slightly different needs (sparkline, multi-line, etc.). Defer unless a second KPI surface appears.

## Page-level inventory

Every page already has rich UI. Listing each with its current state:

| Page                | File                                       | State              |
| ------------------- | ------------------------------------------ | ------------------ |
| Command Center      | `app/(app)/page.tsx` (922 lines)           | Heavily styled. Reference for the design language. |
| Worklist            | `app/(app)/worklist/page.tsx`              | Styled. Verify pills/avatars match tokens.|
| Delivery Signals    | `app/(app)/truth/page.tsx` (16k lines)     | Heavily styled. Three tone-class maps — consolidate to StatusPill. |
| Plan                | `app/(app)/plan/page.tsx`                  | Styled. Verify cards.                     |
| Governance          | `app/(app)/governance/page.tsx`            | Styled. Verify cards.                     |
| Readiness           | `app/(app)/readiness/page.tsx`             | Styled. Verify cards.                     |
| Setup               | `app/(app)/setup/page.tsx` (60k lines)     | Heavily styled wizard. Out of scope for harmonization.|
| Projects            | `app/(app)/projects/page.tsx` (16k lines)  | Styled. Verify table.                     |
| My Items            | `app/(app)/my-items/page.tsx` (13k lines)  | Styled. Verify pills.                     |
| Reports             | `app/(app)/reports/page.tsx`               | Thin wrapper. Component-level work in `components/reports/`. |
| Charter             | `app/(app)/charter/page.tsx`               | Thin wrapper. Delegates to `components/charter/charter-view.tsx`. |
| Milestones          | `app/(app)/milestones/page.tsx`            | Thin wrapper. Delegates to `components/milestones/milestones-grid.tsx`. |
| Tasks               | `app/(app)/tasks/page.tsx`                 | Thin wrapper. Delegates to `components/tasks/tasks-grid.tsx`. |
| Risks               | `app/(app)/risks/page.tsx`                 | Thin wrapper. Delegates to `components/risks/risks-grid.tsx`. |
| Documents           | `app/(app)/documents/page.tsx`             | Thin wrapper. Delegates to `components/documents/documents-list.tsx`. |
| Costs               | `app/(app)/costs/page.tsx`                 | Thin wrapper. Delegates to `components/costs/costs-grid.tsx`. |
| Resources           | `app/(app)/resources/page.tsx`             | Thin wrapper. Delegates to `components/resources/resources-panel.tsx` (1195 lines). |
| Settings            | `app/(app)/settings/page.tsx`              | Thin wrapper. Delegates to `components/settings/settings-panel.tsx`. |

The pattern is consistent: thin page wrapper, real work in `components/{domain}/`. Harmonization touches the component files, not the page files.

## Specific drift to fix

Ordered by visibility, highest first:

### Drift 1: Progress bar color logic in tasks-grid

File: `components/tasks/tasks-grid.tsx` lines ~125-135

Today:
```typescript
const color =
  status === "Complete"    ? "bg-emerald-500" :
  status === "Blocked"     ? "bg-rose-500" :
  status === "In Progress" ? "bg-blue-500" :
  "bg-slate-300";
```

Change to: always `bg-primary`. Status is already conveyed by the status pill on the same row.

### Drift 2: red / green aliases in tasks-grid dependency chips

File: `components/tasks/tasks-grid.tsx` lines ~105-115

Today:
```typescript
done    ? "bg-green-50 text-green-600" :
blocked ? "bg-red-50 text-red-600" :
          "bg-muted text-muted-foreground"
```

Change to:
```typescript
done    ? "bg-emerald-50 text-emerald-700" :
blocked ? "bg-rose-50 text-rose-700" :
          "bg-muted text-muted-foreground"
```

### Drift 3: Three tone-class maps in truth page

File: `app/(app)/truth/page.tsx` lines 27-55 — `toneClasses`, `panelToneClasses`, `metricBoxClasses` all encode similar tone logic three different ways.

Change: extract to `components/ui/status-pill.tsx` (the promoted component above), call it with `variant="panel" | "pill" | "metric"`. Three maps become one.

### Drift 4: Inline avatar color logic

File: `app/(app)/page.tsx` lines 30-37 — `AVATAR_COLORS` array and `avatarColor` function are inline. Other pages that show owners either re-implement or skip.

Change: extract to `lib/ui/avatar-color.ts`. Import in tasks-grid, risks-grid, documents-list, resources-panel.

### Drift 5: Card radius mix

Scan for `rounded-lg` across `components/` and `app/`. Decide per case: hero/panel → `rounded-xl`; content card → `rounded-md`. Anything that does not fit a rule → flag, not silently change.

## Suggested sequence

A: Promote `StatusPill`, `OwnerAvatar` color util, `ProgressBar` to `components/ui/`. Add tests.
B: Replace inline tone maps with `<StatusPill>` in: truth page, risks-grid, tasks-grid, command center.
C: Replace inline avatar color logic in: tasks-grid, risks-grid, documents-list, resources-panel.
D: Fix Drift 1 and Drift 2 in tasks-grid (one-line changes, do alongside C).
E: Scan and rationalize card radius (Drift 5).

A, B, C, D should be one PR. E can be a second pass.

## What we are not doing

- Building any new screens
- Changing routes
- Adding new dependencies
- Touching `lib/domain/` (engine logic)
- Modifying tests beyond adding new unit tests for the promoted components

## Verification

After A-D applied:
- `pnpm test` passes (engine and existing UI tests still green)
- `pnpm build` passes (22 static pages still generate)
- Manual visual check on `/`, `/truth`, `/tasks`, `/risks`, `/documents` — pills, progress bars, owner avatars should look consistent across all five
