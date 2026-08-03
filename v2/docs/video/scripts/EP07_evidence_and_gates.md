# Episode 7 — Evidence and readiness gates

## The principle

In a validated environment, "done" means evidenced.

Not asserted, not agreed in a meeting — evidenced. An approved document, a
completed gate, a signature with a name and a date attached to it. If an
inspector asks how you know a phase completed, the answer has to be an artefact.

That is the core of GxP delivery, and it's also why go-live decisions in this
world are so much heavier than in ordinary projects.

## Why it goes wrong

Go-live gets decided on confidence rather than evidence.

The team feels ready. The steering committee agrees. The date holds. And then,
during validation or during an inspection, the gap appears: a protocol never
formally approved, an approval given verbally, a document sitting at draft while
everyone assumed it was signed.

The work may genuinely have been done. But without the artefact, it cannot be
demonstrated — and in regulated delivery, undemonstrable is indistinguishable
from undone.

## How PharmaPM implements it

Readiness gates are computed, not declared.

Each gate looks at the evidence that belongs to it — the documents and
milestones for that phase — and calculates approved evidence over required
evidence. That percentage is arithmetic on your records. Nobody sets it.

Document status derives the same way. When reviewers and approvers record their
decisions, the document's status follows automatically. There is no field where
someone marks a document approved without the approvals existing.

## Doing it

**Governance, then Documents.** Documents are grouped by validation phase. Each
one shows its reviewers and approvers as person chips.

Click a chip to record that person's decision. The document status updates
itself as the chain completes.

Now **Plan, then Readiness Gates.** You'll see gates across the lifecycle —
planning baseline, configuration evidence, validation readiness, training and
adoption, go-live control — each with a percentage and a count of evidence items
ready.

Click into a gate that isn't complete. It opens the exact missing item: the
document that isn't approved, or the milestone that isn't closed.

That's the loop. Don't chase the percentage — click into the gap and go close
the thing.

## What good looks like

The overall readiness banner reads "ready to defend" only when the evidence
supports it.

And when someone asks "are we ready for go-live?", the answer stops being a
judgment call. It becomes: here are the five gates, here is what's outstanding
on each, here is who owns it. The decision is still yours — but it's now an
informed one rather than a hopeful one.

## Common mistakes

Working the percentage instead of the item. Watching a gate sit at sixty percent
and feeling anxious achieves nothing; clicking in and closing the missing
approval moves it.

Recording approvals in bulk at the end. The chips exist so approval happens as
it actually occurs. Retrospective approval is exactly the pattern audits look
for.

And ignoring gates that look far away. Training and go-live control gates depend
on work that starts months earlier. A gate at zero percent in month four is
usually telling you something real.

## Next

Episode eight: turning all of this into a report that writes itself — and that
doesn't contradict the screens it came from.
