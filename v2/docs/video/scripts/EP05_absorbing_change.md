# Episode 5 — Absorbing change without hiding it

## The principle

Change is normal. Undisclosed change is the failure.

Every methodology says roughly the same thing: assess the impact before you
commit to the change, then record the decision. In regulated delivery this is
formal — change control exists precisely because unrecorded change destroys
traceability.

The discipline is simple to state and almost never practised: understand what a
change costs before you accept it.

## Why it goes wrong

Someone edits a date in a spreadsheet.

Nothing downstream updates, because a spreadsheet has no dependency model. No
one is notified, because there's no mechanism. The change is invisible to
everyone except the person who made it — and they've moved on.

Six weeks later a milestone is missed, and the reconstruction begins. The slip
didn't happen at the missed milestone. It happened at that edit, quietly, weeks
earlier.

## How PharmaPM implements it

Editing a date opens the schedule impact review **before** anything saves.

It shows you four things. Which downstream tasks shift, because dependencies are
modelled. Which milestones move as a result. Whether the frozen go-live
commitment is breached. And whether anything now collides with a hard window —
a regulatory freeze, a validation lock, a business blackout.

Then you choose. Adjust the plan, or accept the consequence.

Accepting is not a confirmation dialog. It records a decision with your name on
it, writes the audit log entry, and places the change in the next report under
accepted changes.

Slips still happen. They just can't happen silently.

## Doing it

Go to **Plan, then Milestones** — or Tasks; both work the same way.

Click a planned date and move it later. The impact drawer opens.

Read it properly. The downstream list is the real content: these are the pieces
of work that just became later because of what you did. Check whether a
milestone moved. Check the breach indicator — that tells you whether your
commitment is now at risk.

If the consequence is acceptable, press accept, and give the reason when
prompted. If it isn't, adjust — shorten something downstream, or reduce scope,
and re-run.

## What good looks like

Open the weekly report afterwards and find the change listed under accepted
changes: what moved, who accepted it, when, and why.

That is the artefact that makes a difference in a review. Not "the date moved",
but "the date moved, here is who decided that and on what basis". The
conversation shifts from blame to judgment.

## Common mistakes

Dismissing the impact drawer as a confirmation step and clicking through it.

It isn't a confirmation. It's the analysis — the only moment where the full
downstream consequence of your edit is visible in one place. Clicking past it
discards the entire value of the mechanism.

And the second: absorbing repeated small slips without escalating. The tool will
faithfully record every acceptance, and a pattern of accepted slips is itself a
signal. If you're accepting weekly, the plan is wrong, not the dates.

## Next

Episode six covers the registers that carry your governance story — risks,
issues, and decisions — and the distinction that keeps all three honest.
