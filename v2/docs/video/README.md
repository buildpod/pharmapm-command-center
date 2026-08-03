# Video production — sources, prompts, workflow

## How to make one video (5 minutes of work)

1. Open **NotebookLM** → new notebook.
2. **Upload one file from `scripts/`** as the only source. One source per
   notebook — extra sources dilute the narrative.
3. **Video Overview → Customize** → paste the matching file from `prompts/`.
4. Generate. Watch it critically. If it drifts, regenerate with the prompt plus
   "shorter, and stay strictly on the source's section order".
5. Download the MP4 → YouTube, **Unlisted**.
6. Paste the video id into `v2/lib/guidance/videos.ts` → it appears in the app
   under **Learn → Video guides**.

> `scripts/` files contain **narration only** — no instructions, no meta. That's
> deliberate: anything in the source gets narrated. The instructions live
> separately in `prompts/` because they're for the Customize box, not the video.

## What to upload with what

| Upload this source | Paste this prompt | Audience | Length |
|---|---|---|---|
| `scripts/layman.md` | `prompts/layman.txt` | Non-expert (LinkedIn, investors) | ~3 min |
| `scripts/company.md` | `prompts/company.txt` | Buyers: delivery / PMO / quality leads | 4–5 min |
| `scripts/executive.md` | `prompts/executive.txt` | Sponsors of a *live* engagement | 2–3 min |
| `scripts/EP00_orientation.md` | `prompts/EP00.txt` | Operators — why it exists | 5–7 min |
| `scripts/EP01_setup.md` | `prompts/EP01.txt` | Set up a defensible project | 5–7 min |
| `scripts/EP02_plan_real.md` | `prompts/EP02.txt` | Owners, gates, real structure | 5–7 min |
| `scripts/EP03_money_and_earned_value.md` | `prompts/EP03.txt` | Money and earned value | 5–7 min |
| `scripts/EP04_progress_integrity.md` | `prompts/EP04.txt` | Progress you can trust | 5–7 min |
| `scripts/EP05_absorbing_change.md` | `prompts/EP05.txt` | Absorbing change openly | 5–7 min |
| `scripts/EP06_governance_registers.md` | `prompts/EP06.txt` | Risks / issues / decisions | 5–7 min |
| `scripts/EP07_evidence_and_gates.md` | `prompts/EP07.txt` | Evidence and readiness | 5–7 min |
| `scripts/EP08_reporting.md` | `prompts/EP08.txt` | Reporting from evidence | 5–7 min |
| `scripts/EP09_defending_the_story.md` | `prompts/EP09.txt` | Defending the story | 5–7 min |

**Suggested order to produce:** `layman` → `company` (the two you'll use
commercially first), then EP00–EP09 in sequence.

## Where the content comes from

```
SET A — what the tool IS            SET B — how to USE it
SET_A_WHAT_IT_IS.md                 TRAINING_CURRICULUM.md
(11 concept slides)                 (10 modules: principle → design → steps)
        │                                     │
        ├── scripts/layman.md                 └── scripts/EP00 … EP09
        ├── scripts/company.md
        ├── scripts/executive.md
        └── website / one-pager copy
```

**The rule:** Set A never teaches operation; Set B never pitches. Mixing them
loses both audiences — a buyer doesn't want click paths, and an operator who
already bought doesn't want the pitch.

Edit the **set** when the story changes, then regenerate the scripts beneath it.
Never fork the narrative inside NotebookLM.

## Rules

- Honest content only — nothing may claim a capability the product lacks (same
  no-fabricated-data rule as the UI).
- The in-app Learn section renders only videos that have a real YouTube id: no
  placeholder thumbnails, no "coming soon" theatre.
- Length is set by attention, not by NotebookLM's ~10-minute ceiling. Only the
  training episodes earn 5+ minutes.
- Superseded and removed (recoverable from git): `VIDEO_PITCH.md` (→
  `scripts/company.md`), `VIDEO_PM_MODULE_1/2.md` (→ the EP00–EP09 series).
