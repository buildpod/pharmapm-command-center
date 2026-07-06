# Video pipeline — NotebookLM → YouTube → in-app

Four videos, one script doc each. None should approach NotebookLM's ~10-minute
ceiling — attention, not the tool, is the constraint.

| # | Video | Audience | Target length | Script |
|---|---|---|---|---|
| 1 | From plan to living command center | Project managers | 6–8 min | `VIDEO_PM_MODULE_1.md` |
| 2 | The weekly rhythm | Project managers | 6–8 min | `VIDEO_PM_MODULE_2.md` |
| 3 | Can you trust the plan? | Executives / SteerCo | 2–3 min | `VIDEO_EXECUTIVE.md` |
| 4 | The pitch | Prospects / partners | ~3 min | `VIDEO_PITCH.md` |

## How to generate (per video)

1. **New NotebookLM notebook** — add the one script doc as the only source
   (paste the markdown or upload the file). One source = tight control; extra
   sources dilute the narrative.
2. **Video Overview → Customize** — paste the "NotebookLM instruction" block
   from the top of the script doc verbatim. It pins audience, tone, length,
   and tells it to follow the narration order.
3. Generate, watch critically, regenerate with a sharper instruction if it
   drifts (e.g. "shorter; stay strictly on the script's section order").
4. Download the MP4 → upload to YouTube as **Unlisted**.
5. Paste the YouTube video id into `v2/lib/guidance/videos.ts` — the video
   then appears automatically in the app under **Learn → Video guides**.

## Rules

- Keep scripts as the single source of truth — edit the script doc, then
  regenerate; don't fork the narrative inside NotebookLM.
- Honest content only: nothing in a script may claim a capability the product
  doesn't have (same no-fabricated-data rule as the UI).
- The in-app section renders only videos that have a real YouTube id — no
  placeholder thumbnails, no "coming soon" theatre.
