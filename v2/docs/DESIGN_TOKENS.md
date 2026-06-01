# Design Tokens And Visual Language

Created: 2026-05-26
Purpose: single source of truth for the command-center visual language. Use this when touching any UI file. Do not introduce token values outside this document.

This is not a new design system. It documents what already exists in `app/globals.css`, fills the gaps where pages drifted, and makes one rule per decision so further work converges instead of fanning out.

## 1. Palette

The base palette lives in `app/globals.css` as HSL CSS variables and stays untouched. The shadcn slate-neutral base with a deep indigo primary (HSL 224 71% 36%) is the enterprise feel the dashboard already has.

### Status tones — five, not more

| Tone     | When to use                          | Background    | Text         | Border        | Solid dot   |
| -------- | ------------------------------------ | ------------- | ------------ | ------------- | ----------- |
| rose     | Blocking, blocked, critical          | bg-rose-50    | text-rose-700| border-rose-200 | bg-rose-500 |
| amber    | Attention, at-risk, pressure         | bg-amber-50   | text-amber-700| border-amber-200| bg-amber-500|
| blue     | Information, in-progress, in-review  | bg-blue-50    | text-blue-700| border-blue-200 | bg-blue-500 |
| emerald  | Resolved, complete, approved, stable | bg-emerald-50 | text-emerald-700| border-emerald-200 | bg-emerald-500 |
| slate    | Neutral, pending, draft, low priority| bg-slate-100  | text-slate-600| border-slate-200| bg-slate-300 |

Use `text-700` for filled pill text on `bg-50` backgrounds. Use `text-800` for solid-tinted panels (the dashboard SteerCo brief uses this — `bg-rose-50 text-rose-800`). Pick one or the other per component, do not mix within one component.

### Forbidden aliases

Do not use `red-*`, `green-*`, or `yellow-*`. Use `rose-*`, `emerald-*`, or `amber-*` respectively. Today, `components/tasks/tasks-grid.tsx` line ~109 uses `bg-red-50 text-red-600` and `bg-green-50 text-green-600` for dependency chips. These need to move to `bg-rose-50 text-rose-700` and `bg-emerald-50 text-emerald-700` for consistency.

## 2. Typography

The base is set in `app/globals.css` (14px body, tight heading line-height, tabular-nums on tables). No new font stack. Two rules to follow:

- **Page header**: `text-2xl font-bold tracking-tight text-foreground` for h1, `text-sm text-muted-foreground` for the descriptive line below. Every page does this already — keep it.
- **Eyebrow label**: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`. Today some places use `text-[10px]` — standardize on `text-[11px]` unless inside a dense pill (`text-[10px]` allowed there).

## 3. Card and panel system

Two card sizes only:

- **Hero / KPI / panel**: `rounded-xl border border-border bg-card p-5 shadow-sm`
- **Content card / table wrapper**: `rounded-md border border-border bg-card shadow-sm`

The dashboard already does this. `components/risks/risks-grid.tsx` uses `rounded-xl` for the matrix — correct. Anywhere a panel currently uses `rounded-lg` without justification, move it to one of these two.

Header strip inside a card (when the card has a labeled top section):

```
flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3
```

Body padding inside a card without a header strip: `p-5` for hero, `p-4` for content.

## 4. Pills, badges, dots

One pill class to remember:

```
rounded-full border px-2 py-0.5 text-[10px] font-semibold {tone-bg} {tone-text} {tone-border}
```

The dashboard's `briefPill` map is the canonical example. Risks-grid's `bandStyles` map is the same idea with slightly larger sizing (`px-2 py-0.5 text-[11px]`) — acceptable variation for high-density risk pills.

Dependency chips in tasks-grid currently use `rounded px-1.5 py-0.5 text-[9px]` — keep this smaller variant for inline dependency annotations only, no other use.

Solid dot indicator: `h-2 w-2 rounded-full {tone-dot}` (e.g. `bg-rose-500`).

## 5. Progress bars

Two patterns exist today. Standardize:

**Workstream / aggregate progress** (neutral progress, not status-bearing): `bg-primary` fill.
```
<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
</div>
```

**Task / item progress** (where the row already conveys status elsewhere): also use `bg-primary` fill. The status-coloured fill currently in `tasks-grid.tsx` (`bg-emerald-500` for Complete, `bg-rose-500` for Blocked, `bg-blue-500` for In Progress) is redundant — status is already shown in the status pill on the same row. Change to `bg-primary`. This is the single most visible inconsistency in the app right now.

Track background: `bg-muted` (light context) or `bg-slate-100 dark:bg-slate-800` (dark-aware). Prefer `bg-muted`.

Height: `h-1.5` everywhere. No `h-2` or `h-3` variants unless the bar is the primary visual (e.g. the Risk Matrix score bar).

## 6. Avatar colors

The dashboard has the canonical avatar hash function:

```typescript
const AVATAR_COLORS = [
  "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-fuchsia-500", "bg-pink-500",
];
function avatarColor(initials: string) {
  const hash = initials.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
```

This belongs in `lib/utils.ts` or `lib/ui/avatar-color.ts`, not inlined in `app/(app)/page.tsx`. Every component that renders owner initials should import from there. Today the dashboard owns this and other pages roll their own — that is the second most visible inconsistency.

## 7. Shell dimensions

From `components/sidebar.tsx` and `components/topbar.tsx`:

- Sidebar logo strip: `h-14` with `border-b border-border px-4`
- Sidebar nav group label: `text-[10px] font-semibold uppercase tracking-widest text-muted-foreground` with `mb-1 px-2`
- Sidebar item: `flex items-center gap-3 rounded-md px-2 py-1.5 text-sm` — active state `bg-primary/10 text-primary font-medium`, inactive `text-muted-foreground hover:bg-muted hover:text-foreground`

These work. Do not add a second sidebar variant.

## 8. Tables

The Command Center workstream table is the canonical pattern:

- Header row: `border-b border-border bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`
- Body: `divide-y divide-border`, row `transition-colors hover:bg-muted/20`
- Cell padding: `px-4 py-3`
- Numeric cells: add `tabular-nums`

Match this in tasks-grid, risks register, documents list, costs table. Today they diverge slightly — that is the third visible inconsistency.

## 9. What is explicitly out of scope

- New color palette
- Dark mode rework (current dark mode is wired and works)
- New font selection
- New iconography (lucide-react is sufficient)
- New chart library (recharts is already installed)
- Motion / animation system (transitions on hover are enough)

## 10. Honest open questions

These were not resolvable from the code alone. Decide before applying tokens to large surfaces:

1. **Eyebrow label size** — `text-[10px]` vs `text-[11px]`. I picked `text-[11px]` as the standard above; the sidebar group label uses `text-[10px]`. Either is fine, but pick one and apply.
2. **Card body padding** — `p-4` vs `p-5`. Hero cards use `p-5` today; content cards mix `p-4` and `p-5`. I picked p-5 hero / p-4 content above. Confirm.
3. **Primary button style** — Today most CTAs use `inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm`. Confirm this is the canonical primary button before promoting to shared component.
