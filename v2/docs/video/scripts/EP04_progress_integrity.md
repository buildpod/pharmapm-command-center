# Episode 4 — Progress you can trust

## The principle

Self-reported completion is the most optimistic number in project management.

That is not a claim about honesty. It's a claim about incentives. Nobody wants
to be the red row in the steering committee pack, so estimates round upward,
and "eighty percent done" quietly becomes "eighty percent of the pleasant work
is done".

Which means verification cannot come from asking harder. It has to come from
signals that are independent of the claim.

## Why it goes wrong

The problem with over-reported progress is subtle, and worth understanding
properly.

If someone overstates completion, it doesn't just inflate the progress bar. It
inflates the earned value. Which inflates cost efficiency, and inflates schedule
pace. The indices move *with* the overstatement.

So the usual metrics can't catch it — they're downstream of the same number. A
project can look better on every dimension precisely because the input was
optimistic.

## How PharmaPM implements it

The Status Integrity check compares the claim against three things that are
independent of it.

Implied cost efficiency: does the claimed progress imply you're earning value at
a rate the spend can't support? Claiming you've earned far more than you've
spent is mathematically the signature of over-reporting.

Gate corroboration: is high claimed completion backed by milestones actually
reached? If sixty percent of work is reported done and no gate has been passed,
completion isn't corroborated.

And spend: near-complete work with almost no money recorded against it.

When those disagree with the claim, the system **flags** — it does not silently
discount. The score stays computed, because the scoring rules are fixed. But the
report carries a caveat saying the inputs may be overstated.

That distinction matters. The tool doesn't overrule you. It tells the reader
what it noticed.

## Doing it

Go to **Plan, then Tasks**.

Click a status badge to advance the status. Click a progress bar to edit the
percentage directly. Both save immediately and both are audit-logged.

Update honestly — including downward, if the last estimate was optimistic.
Downward revisions are normal and the system treats them as such.

Now watch the dashboard. The verdict moves as you update, because it's computed
from what you just entered.

If you want to see the guard work: take several large-budget tasks to a hundred
percent, then open Delivery Signals. The integrity flag appears, explaining that
the claimed progress implies an implausible efficiency and should be verified
against evidence.

## What good looks like

A report that flags its own weak spots.

That feels wrong the first time — you're publishing a caveat about your own
numbers. But consider it from the sponsor's side. They already assume status
packs are edited. A pack that says "this number may be optimistic, here's why"
is the first one they have grounds to believe.

The caveat buys credibility for everything else in the document.

## Common mistakes

Updating progress to make the dashboard look better before a review. It's
audit-logged, the integrity check is designed to notice, and the caveat lands in
the pack.

And treating the flag as an accusation. It isn't. It's the same thing a good
finance function does — reconciling two independent views and asking about the
gap.

## Next

Episode five: what happens when a date genuinely has to move — and how to absorb
it without hiding it.
