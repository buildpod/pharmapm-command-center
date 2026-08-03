# Episode 2 — Make the plan real

## The principle

Two ideas do most of the work here.

First: work decomposes into deliverables, and every deliverable has an
accountable owner. Not a team — a person.

Second: milestones are gates. A gate proves a phase is genuinely complete. It is
not a decorative date on a timeline; it's a checkpoint something has to pass
through.

In regulated delivery this matters more than usual, because your gates are also
where evidence gets produced.

## Why it goes wrong

Two failure patterns, and you'll recognise both.

Unowned work: tasks sitting with a team name, or nothing at all, in the owner
column. When it slips, there's no one to ask.

And orphaned gates: milestones with no supporting tasks underneath them. The
milestone can't roll up, because nothing feeds it. It just sits there until
somebody declares it done.

Both patterns look fine in a Gantt chart. Both mean the plan can't tell you
anything.

## How PharmaPM implements it

Tasks link to the milestone they prove — their proof point. That link is what
makes progress roll up into gate status.

The guided work panel checks this continuously against your live records. If a
gate has no owner, or a task isn't linked to a proof point, it tells you which
one, by name, with a link to fix it.

And when you record dependencies, the tool refuses to create a loop. If task A
waits on B, and you try to make B wait on A, it blocks the save and shows you
the chain — because a circular dependency makes the schedule mathematically
unsolvable.

## Doing it

Go to **Plan, then Milestones**.

Work down the list. Every gate needs an owner and a planned date. Watch the
phase groupings — they should map to how your project actually runs, not to a
generic template.

Now **Plan, then Tasks**.

Tasks are grouped by workstream. For each one, open it and check four things:
the owner, the due date, the workstream, and the milestone it supports.

That last one is the one people skip, and it's the one that makes the plan
work. A task with no milestone contributes to no gate.

While you're in the task drawer, look at **Depends on**. Select only the
upstream work that genuinely must finish before this task can start. The
dependency chips on each row will then show, in plain language, what that task
is waiting on.

## What good looks like

On the dashboard, "Tasks linked to milestones" turns green in the readiness
checklist.

On the tasks page, dependency chips read as real work — "waiting on: Set up user
roles and permission profiles" — not as codes you have to decode.

And every row has a person in the owner column.

## Common mistakes

The most damaging one: recording coordination as a hard dependency.

If two pieces of work merely need to stay in sync, that is not a dependency.
Mark it as one and every date change cascades noisily through your plan, the
impact reviews become full of noise, and people start ignoring them.

Reserve hard dependencies for genuine blockers — work that literally cannot
start until something else finishes.

The second mistake: assigning ownership to a team. "Validation" cannot be asked
for a status update. A person can.

## Next

In episode three we bring in money — and see why measuring progress by counting
tasks quietly flatters almost every project.
