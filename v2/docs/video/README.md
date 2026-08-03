# Content architecture — decks, scripts, videos

Two slide sets, one shared spine (the PM principles). Every outward asset
derives from a set — change the set, regenerate the assets.

```
SET A — what the tool IS          SET B — how to USE it
SET_A_WHAT_IT_IS.md               TRAINING_CURRICULUM.md
(11 concept slides)               (10 modules, principle → design → steps)
        │                                   │
        ├── VIDEO_LAYMAN.md  (~3 min)       └── 10-part training series
        ├── VIDEO_COMPANY.md (~4–5 min)         (one module = one episode)
        ├── VIDEO_EXECUTIVE.md (2–3 min)
        └── website / one-pager copy
```

**The rule:** Set A never teaches operation; Set B never pitches. Mixing them
loses both audiences — a buyer doesn't want click paths, and an operator who
already bought doesn't want the pitch.

## The assets

| File | Audience | Length | Purpose |
|---|---|---|---|
| `SET_A_WHAT_IT_IS.md` | — | 11 slides | Source of truth for "what is it" |
| `TRAINING_CURRICULUM.md` | Operators | 10 modules | Source of truth for "how to use it" |
| `VIDEO_LAYMAN.md` | Non-expert (LinkedIn, investors, partners) | ~3 min | Understand it well enough to describe it |
| `VIDEO_COMPANY.md` | Buyers: delivery/PMO/quality leadership | ~4–5 min | Business case + how to start |
| `VIDEO_EXECUTIVE.md` | Sponsors of a *live* engagement | 2–3 min | Why this status is trustworthy |
| `VIDEO_PM_MODULE_1.md` / `_2.md` | Operators | 6–8 min each | Condensed 2-part quick start (the 10-module series is the full depth) |

> `VIDEO_PITCH.md` was removed — `VIDEO_COMPANY.md` covers the same audience and
> purpose, sourced from Set A. Recoverable from git history if needed.

## Generating a video (per script)

1. **New NotebookLM notebook** — add the one script as the only source. One
   source = tight control; extra sources dilute the narrative.
2. **Video Overview → Customize** — paste the instruction block from the top of
   the script verbatim. It pins audience, tone, length, and section order.
3. Generate, watch critically, regenerate with a sharper instruction if it
   drifts ("shorter; stay strictly on the script's section order").
4. Download the MP4 → upload to YouTube as **Unlisted**.
5. Paste the video id into `v2/lib/guidance/videos.ts` — it then appears in the
   app under **Learn → Video guides**.

## Rules

- Scripts are the single source of truth: edit the script (or the set it
  derives from), then regenerate. Never fork the narrative inside NotebookLM.
- Honest content only — nothing may claim a capability the product lacks (same
  no-fabricated-data rule as the UI).
- The in-app section renders only videos with a real YouTube id: no placeholder
  thumbnails, no "coming soon" theatre.
- Length is set by attention, not by NotebookLM's ~10-minute ceiling. Only the
  training modules earn 6+ minutes.
