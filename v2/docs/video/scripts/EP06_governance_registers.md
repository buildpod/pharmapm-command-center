# Episode 6 — Governance registers that survive an audit

## The principle

Three registers, three different questions.

A risk is something that **might** happen. It has a probability, an impact, an
owner, and a mitigation.

An issue is something that **is** happening. It has a severity, an owner, and a
resolution plan. Probability is meaningless — it already occurred.

A decision records a **choice you made**: the context, the options you weighed,
which one you took, and why.

Keeping them separate is what keeps all three honest.

## Why it goes wrong

Most projects run one combined log, and two things go wrong immediately.

Live problems hide behind probability scores. An issue that is actively blocking
work gets logged as a "high risk" and sits in a queue being reviewed monthly,
because that's the cadence risks get.

And decisions go unrecorded entirely — until an audit or a post-mortem asks who
approved something and what the alternatives were. Reconstructing that a year
later, from meeting minutes and memory, convinces nobody. It is also the single
most common finding in delivery audits.

## How PharmaPM implements it

Three separate registers, each shaped for its job.

Risks carry probability and impact, scored, with owner and mitigation, displayed
on a matrix so exposure is visible at a glance.

Issues carry severity, owner, and a resolution plan, with critical items
surfaced first.

Decisions carry the full record: context, the alternatives considered, the
rationale, the person accountable, and the supersession chain — so when a later
decision replaces an earlier one, both remain readable and the reasoning is
preserved.

Every save on all three is audit-logged.

## Doing it

**Governance, then Risks.** The matrix on the left and the cards on the right
are linked — click any dot to jump to that risk's full context. Check each open
risk has a named owner and a mitigation that describes an action, not an
intention.

**Governance, then Issues.** When something is actively blocking delivery, log
it here. Severity, owner, resolution plan. If you find yourself writing a
probability, it belongs in Risks instead.

**Governance, then Decisions.** This is the habit worth building. When a choice
gets made — in a steering committee, in a corridor, in an email thread — record
it the same day. Context, the options you rejected, why you chose what you
chose.

It takes four minutes at the time. It takes days to reconstruct later.

## What good looks like

The test is simple: could a stranger read any of these registers and know what
to do next, who owns it, and why previous choices were made?

If a new PM inherited this project tomorrow, the decision log is what tells them
why the project is shaped the way it is. Everything else tells them what; only
decisions tell them why.

## Common mistakes

Logging a live problem as a risk. If it has already happened, it is an issue.
The distinction sounds pedantic until you notice your issue register is empty
while the project is on fire.

Mitigations that aren't actions. "Monitor closely" is not a mitigation. "Weekly
vendor call, escalation to sponsor if no fix by the fifteenth" is.

And recording decisions only when they're contentious. The uncontroversial ones
are exactly the ones nobody remembers the reasoning for.

## Next

Episode seven: evidence and readiness gates — how "done" gets proven rather than
asserted.
