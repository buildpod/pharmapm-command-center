# PharmaPM training curriculum — principle → design → practice

Ten modules. Each teaches a **project-management principle**, shows the
**design decision** it drove in PharmaPM, then walks the **exact steps** to do
it — and what you should see when it worked.

This is the spine for three things: onboarding a new operator, the training
deck for an audit engagement, and the 10-part video series (one module = one
episode; each module's slides are the narration order for NotebookLM).

**Slide pattern per module** (7 slides, ~6 min):
1. The principle · 2. Why it goes wrong · 3. How PharmaPM implements it ·
4–5. Do it (steps) · 6. What good looks like · 7. Common mistakes

Audience: a delivery PM on a regulated implementation. Not certified. Smart,
time-poor, sceptical of tools.

---

## Module 0 — Why this tool exists

**Principle.** A project plan is a *promise*. Governance is the discipline of
keeping the promise honest as reality moves. (PMBOK integration management;
GAMP 5 lifecycle control.)

**Why it goes wrong.** Most tools record intent but can't defend it — every
date, percentage, and RAG colour is typed by someone with a stake in how it
reads. So three versions of the truth appear: the plan, the story told to
sponsors, and evidence scattered for auditors.

**How PharmaPM implements it.** One record set drives plan, dashboard, and
reports. Financial numbers are computed from earned value and cannot be typed.
Every change is audit-logged. Data stays in your browser — no vendor cloud.

**Do it.** Open the app → note the sidebar lockup (AivelloStudio mark, PharmaPM
product) → open **Guide → Learn the basics** → skim the three tracks.

**What good looks like.** You can name the three surfaces (Dashboard, Delivery
Signals, Reports) and say which records feed them.

**Common mistakes.** Treating it as a nicer Gantt chart. It is a truth layer;
the schedule is only one input.

---

## Module 1 — Set up a project you can defend

**Principle.** Before execution, authority and scope must be explicit —
charter, sponsor, objectives, go-live commitment. (PMBOK §4.1 Develop Project
Charter.)

**Why it goes wrong.** Teams start executing from a task list nobody formally
agreed. When it slips, there's no agreed original to measure against.

**How PharmaPM implements it.** The setup wizard captures project facts first,
then generates a structure you review *before* it exists. The go-live date you
enter becomes the frozen commitment everything is measured against.

**Do it.**
1. **New Project** → step 1 **Discover**: name, client, dates, methodology,
   regions.
2. Step 2 **Choose source**: playbook / import / saved template / blank.
3. Step 3 **Shape model**: tune the generated structure; defer sections you're
   not ready for.
4. Step 4 **Validate**: read what will be created → **Create Command Center**.

**What good looks like.** Dashboard opens with the guided review banner and a
readiness checklist showing *x of 7 ready* — computed, not ticked by hand.

**Common mistakes.** Accepting the generated plan as truth. It's a starting
point; Module 2 is where it becomes yours.

---

## Module 2 — Make the plan real: gates, work, ownership

**Principle.** Work decomposes into deliverables with owners and dependencies;
milestones are *gates* that prove a phase is done, not decorative dates.
(PMBOK scope/schedule management; GAMP 5 phase gates.)

**Why it goes wrong.** Unowned tasks and milestones with no supporting work —
so nothing rolls up, and "who is doing this?" has no answer.

**How PharmaPM implements it.** Tasks link to milestones (their proof point).
Guided work nudges you about unowned gates and unlinked tasks, computed live
from your records.

**Do it.**
1. **Plan → Milestones**: check every gate has an owner and a planned date.
2. **Plan → Tasks**: for each task set owner, due date, workstream, and the
   milestone it proves.
3. Use the **dependency picker** in the task drawer to record only true
   upstream blockers (the tool refuses to create a dependency loop).

**What good looks like.** The readiness checklist's "Tasks linked to
milestones" turns green; dependency chips on task rows name real upstream work.

**Common mistakes.** Recording *coordination* as hard dependencies — it makes
every date edit cascade noisily. Only block on what genuinely must finish first.

---

## Module 3 — Money and earned value

**Principle.** Earned value compares three things: what you planned to have
done by now (PV), what you actually earned (EV), and what you spent (AC).
Everything else — CPI, SPI(t), EAC — is arithmetic on those. (PMI Practice
Standard for EVM.)

**Why it goes wrong.** Progress measured by task *count* — finishing ten
trivial tasks looks like delivery while the expensive work hasn't started.

**How PharmaPM implements it.** Budget comes solely from cost lines (one
financial truth). Give every task a budget and earned value becomes
**budget-weighted**, so a $200k task at 100% outweighs a $2k task. It's
all-or-nothing: if any task lacks a budget, the tool falls back to equal
weighting rather than mixing stated and assumed weights.

**Do it.**
1. **Finance → Costs**: enter budget and actuals per category.
2. **Plan → Tasks** → open each task → set **Budget ($k)**.
3. **Delivery Signals**: read the score's arithmetic with your live values.

**What good looks like.** Confidence changes when you add budgets — and can
move *either* direction. Accuracy, not pessimism.

**Common mistakes.** Expecting task budgets to equal the total budget. They're
weights; licence and vendor lines often carry no task work.

---

## Module 4 — Progress you can trust

**Principle.** Self-reported completion is the most optimistic number in
project management. Verification must come from signals *independent* of the
claim.

**Why it goes wrong.** Nobody wants to be the red row. "80% complete" quietly
means 80% of the pleasant work.

**How PharmaPM implements it.** The Status Integrity check compares claimed
progress against independent signals — implied cost efficiency, gates actually
reached, spend recorded. It **flags, never silently discounts**: the score
stays computed, but the report carries the caveat.

**Do it.**
1. **Plan → Tasks**: click a status badge to advance; click a progress bar to
   edit the percentage.
2. Watch the dashboard verdict move.
3. *Demo the guard:* set several large tasks to 100% and refresh Delivery
   Signals — the integrity flag appears.

**What good looks like.** A report that flags its own weak spots. Sponsors
trust it more, not less.

**Common mistakes.** Updating progress to make the dashboard look better. It's
audit-logged, and the integrity check is designed to notice.

---

## Module 5 — Absorbing change without hiding it

**Principle.** Change is normal; *undisclosed* change is the failure. Impact
must be understood before commitment, and the decision recorded. (PMBOK
integrated change control; GxP change management.)

**Why it goes wrong.** A date is edited in a spreadsheet. Nothing downstream
updates, nobody is told, and the slip surfaces months later.

**How PharmaPM implements it.** Editing a date opens the **schedule impact
review before saving**: downstream tasks, milestone movement, whether the
frozen go-live is breached, and hard-window collisions (e.g. regulatory
freeze). Accepting records a decision, writes the audit log, and puts the
change in the next report.

**Do it.**
1. **Plan → Milestones** (or Tasks) → click a planned date → move it later.
2. Read the impact drawer: affected downstream work, milestone shifts, breach.
3. Choose **Adjust** or **Accept** — accepting names you as the decision owner.

**What good looks like.** The weekly report's "Accepted changes" section lists
the slip, who accepted it, and when.

**Common mistakes.** Dismissing the impact drawer as a confirmation dialog.
It's the analysis — read it.

---

## Module 6 — Governance registers that survive an audit

**Principle.** Risks are what *might* happen; issues are what *is* happening;
decisions record choices made and alternatives weighed. Keeping them separate
keeps all three honest. (PMBOK risk management; RAID discipline.)

**Why it goes wrong.** One "RAID log" where live problems hide behind
probability scores, and decisions are reconstructed from meeting minutes a year
later — which convinces nobody.

**How PharmaPM implements it.** Three separate registers. Risks are scored
probability × impact with owner and mitigation. Issues carry severity and a
resolution plan. Decisions capture context, alternatives considered, rationale,
and supersession chains. Every save is audit-logged.

**Do it.**
1. **Governance → Risks**: click a matrix dot to open its card.
2. **Governance → Issues**: record a live problem — owner, severity, plan.
3. **Governance → Decisions**: record a choice *when you make it*, with the
   alternatives you rejected.

**What good looks like.** A stranger can read any register and know what to do
next, who owns it, and why past choices were made.

**Common mistakes.** Logging a live problem as a risk. If it's happening, it's
an issue.

---

## Module 7 — Evidence and readiness gates

**Principle.** In validated environments, "done" means *evidenced* — approved
documents and completed gates, not assertions. (GAMP 5; 21 CFR Part 11 audit
trail and approvals.)

**Why it goes wrong.** Go/no-go decided on opinion, then the evidence gap
surfaces during audit.

**How PharmaPM implements it.** Readiness gates are computed from live document
approvals and milestone completion — approved evidence over required evidence.
Document status derives from reviewer/approver decisions; it's never hand-set.

**Do it.**
1. **Governance → Documents**: click a reviewer/approver chip to record their
   decision.
2. **Plan → Readiness Gates**: read each gate's percentage.
3. Click a gate to open the exact missing evidence item.

**What good looks like.** "Ready to defend" appears only when the evidence
supports it.

**Common mistakes.** Chasing the percentage instead of the missing item. Click
into the gap.

---

## Module 8 — Reporting from evidence

**Principle.** A status report should be a *view* of the records, never a
re-typing of them. Otherwise the pack and the working plan drift apart.

**Why it goes wrong.** The deck is assembled by hand the night before, from
memory and optimism.

**How PharmaPM implements it.** Three reports read the same records: Weekly
Status (working level), Steering Committee (executive), Workstream (leads).
Each carries the governed history — accepted changes, baseline changes, the
integrity caveat, and trend since the last capture point. Print to PDF, export
to multi-sheet Excel.

**Do it.**
1. **Command → Reports** → pick the audience tab.
2. Press **Capture point** to record this week's trend snapshot.
3. Export to Excel or print to PDF.

**What good looks like.** Nothing in the pack was typed by you, and every claim
traces to a record.

**Common mistakes.** Forgetting the weekly capture point — trend needs a
previous point to compare against.

---

## Module 9 — Defending the story

**Principle.** Traceability is what converts a claim into evidence: any number
must lead to the records that produced it, and history must show who changed
what, when, and why. (21 CFR Part 11 audit trail; ALCOA+ data integrity.)

**Why it goes wrong.** "Says who?" takes a week of email archaeology to answer.

**How PharmaPM implements it.** Every number is a door — KPI cards, signals,
and governance controls all deep-link to source records. The Activity feed is
the humanized audit log. Re-baselines record who/when/why and appear in the
report's Baseline Changes section.

**Do it.**
1. **Delivery Signals** → open a signal → click a **trace** chip to jump to the
   source record.
2. **Command → Activity**: read what changed since the last conversation.
3. **Plan → Milestones**: use the commitment banner to re-baseline *with a
   reason* when genuinely needed.

**What good looks like.** In a review, every challenge is answered with one
click rather than a follow-up action.

**Common mistakes.** Re-baselining to make drift disappear. It's recorded and
reported — the target can move, but never quietly.

---

## Using this for video

One module = one episode. The seven slides are the narration order. Add this to
the NotebookLM instruction:

> Audience: delivery project managers on regulated implementations, not
> certified PM experts. Tone: calm, practical, instructional — this is training,
> not marketing. Length: 5–7 minutes. Follow the seven slides in order:
> principle, why it goes wrong, how the tool implements it, the steps, what good
> looks like, common mistakes. Do not add features not described here.
