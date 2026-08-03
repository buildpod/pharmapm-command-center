# Episode 3 — Money and earned value

## The principle

Earned value sounds technical. It rests on three numbers, and once you see them
the rest is arithmetic.

What you planned to have finished by today. What you have actually finished.
And what you have spent finishing it.

Compare the second to the third and you get cost efficiency: for every pound
spent, how much planned work did you actually earn? Compare the second to the
first and you get schedule pace: are you earning work as fast as the plan
assumed?

Every other term — CPI, SPI, estimate at completion — is derived from those
three. You do not need the vocabulary. You need the comparison.

## Why it goes wrong

Here is the trap almost every project falls into: progress measured by counting
tasks.

Ten tasks done out of forty, so we're twenty-five percent complete. But those
ten were the cheap ones — the kickoff deck, the workshop, the status reports.
The expensive work, the configuration and migration and validation, hasn't
started.

Counting tasks says twenty-five percent. Reality says considerably less. And
that gap is where projects hide.

## How PharmaPM implements it

Two decisions.

First, one financial truth. Your budget comes solely from cost lines. Nothing
else can define it, so no two screens can disagree about the money.

Second, budget-weighted earned value. Give every task a budget, and progress is
weighted by what the work is actually worth. A two hundred thousand pound task
at a hundred percent counts for far more than a two thousand pound task at a
hundred percent.

And it's all-or-nothing by design. If even one task lacks a budget, the tool
falls back to equal weighting rather than silently mixing numbers you stated
with numbers it assumed. Half-weighted data is worse than either honest option.

## Doing it

Start at **Finance, then Costs**. Enter your budget and actuals per category —
implementation, validation, migration, licences, internal. This is your budget
at completion.

Then **Plan, then Tasks**. Open each task and set **Budget in thousands**. Map
them to the cost structure: if configuration is six hundred and fifty thousand
across four tasks, distribute it across those four.

Not every cost line will have task work. Licences and vendor fees often don't.
That's expected — task budgets are weights, not a second budget.

Finally, open **Delivery Signals**. The score's arithmetic is shown with your
live values substituted in. Read it. It is not a black box, and you should be
able to explain it to a sponsor.

## What good looks like

When you add budgets, the confidence number moves — and it can move in either
direction.

That surprises people. Budget weighting is not a pessimism tool. If your most
expensive workstream is genuinely the most advanced, weighting will show the
project is further along than task-counting suggested. If your finished work is
the cheap work, it will show the opposite.

Either way, the number is now about value rather than volume.

## Common mistakes

Expecting task budgets to sum to the total budget. They won't, and they
shouldn't — vendor and licence lines carry no task work.

And leaving a handful of tasks without budgets, then wondering why weighting
isn't applying. It's all-or-nothing. Check every task.

## Next

Episode four is about the number everyone quietly doubts: percent complete —
and what it takes to make it trustworthy.
