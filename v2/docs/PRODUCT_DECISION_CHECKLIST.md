# Product Decision Checklist

Use before starting any new module.

## Buyer Test

Answer in one sentence:

- Who is the buyer or evaluator?
- What meeting, report, audit, escalation, or delivery pain are they trying to survive?
- What would make them pay, pilot, or share this with another PM?

If the answer is vague, do not build yet.

## Sellable Slice Test

A useful slice should answer:

- What changed?
- Why does it matter?
- Who owns it?
- What decision is needed?
- What evidence supports the story?
- What should the PM do next?

If a screen cannot answer at least three of these, it is probably not the next screen to improve.

## Build / Pause / Pivot

Build when:

- The user can understand the value in the first viewport.
- The change improves the SteerCo readiness story.
- The implementation uses existing entities and does not require a new platform decision.

Pause when:

- The feature mainly adds configuration, setup depth, or taxonomy.
- The current screen is still not convincing.
- The next step depends on buyer positioning more than code.

Pivot when:

- The product is still explainable only as "a better PM dashboard."
- The demo requires too much narration.
- The app cannot show a credible before-and-after workflow.

## Current Recommendation

Prioritize hardening the SteerCo readiness slice before adding new modules.

Best next product moves:

1. Tighten the first screen visually until it feels like a briefing, not a dashboard.
2. Make each action deep-link to a filtered register or exact evidence item.
3. Make Reports export the same SteerCo story shown on the landing page.
4. Remove retained legacy dashboard code after the new first screen is accepted.
5. Dogfood with one realistic pharma implementation scenario and one non-pharma scenario.

Avoid for now:

- More setup wizard depth.
- More generic dashboards.
- New database work.
- New entity types unless the SteerCo story clearly needs them.
- LLM features without deterministic evidence behind them.
