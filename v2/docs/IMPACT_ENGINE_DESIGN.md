# Impact Engine — Design Context (for review)

> Companion to `IMPACT_ENGINE_SPEC.md` (the build plan). This document explains
> the *why* and *how* — the problem, the architecture, the decisions and their
> rationale, what is built vs. pending, the assumptions baked in, and the open
> questions a reviewer should pressure-test.
>
> Status as of this writing: spec steps 1–7 built, plus the trust-&-adjust
> rationale layer and the first perturbation UI trigger (cost-overcharge).
> ~336 unit tests green; verified live on the sample project.

---

## 1. Product context

AivelloStudio is a delivery-governance product for regulated system rollouts
(Veeva RIM, SAP, LIMS, eQMS). Its thesis is **computed delivery truth**: a
project's confidence score and verdict are *derived from real delivery data,
never hand-set*. The differentiator is the engine and its algorithm, not the
register UI (which any PM tool has).

The Impact Engine is the part that makes that thesis *actionable*: it answers
not just "what is true now?" but **"if this changes, what does it cost me?"** —
in go-live, confidence, and money, against the commitment.

---

## 2. The problem it solves

Before this work, the app could **describe** state (EVM score, signals) and
**cascade dates** (a task slip shifts dependent tasks/milestones — already built
in `scheduling.ts`). What it could not do:

- Translate a date slip into its **business consequence** (go-live date,
  forecast cost, confidence).
- Tell the PM **which** shifts actually threaten go-live vs. which are absorbed.
- Account for **organisational walls** (freeze periods, approver absence) the
  dependency math can't see.
- Let the PM **see the rationale and adjust the assumptions**, then re-flow.
- Handle the other disruptions a PM lives with — **scope creep, vendor
  over-charge, approver absence** — through the same reasoning.

The gap between "describe" and "reason about consequences" was the whole
sellable product. This engine closes it.

---

## 3. Architecture

One pipeline, fed by a discriminated **perturbation** union, measured against a
**frozen commitment**, producing one **consequence projection** rendered as one
**story** on multiple surfaces.

```
Perturbation (task-date | scope-add | cost-overcharge | absence)
        │
        ├── schedule arm (if dates move): scheduling.ts cascade
        │     → ScheduleOutcome { affected, milestonePushes, goLiveProjectedUnlocked }
        │     → critical-path.ts → which shifts BIND go-live
        │     → hard-windows.ts → push effective go-live past freezes/absence
        │
        └── cost arm: directCost (+ T&M extension from overrun)
        ▼
projectConsequence()  ── vs. frozen commitment (milestone plannedDate / goLiveDate)
        ▼
ConsequenceProjection { goLive, cost, confidence, chain, windowCollision, benign, summary }
        ▼
ConsequenceStory (shared UI) ── impact drawer (schedule) · ConsequenceModal (cost/absence)
        ▼
Acceptance record → audit log (the slack-ledger seed)
```

### Modules (all pure domain, unit-tested)
- **`lib/domain/consequence.ts`** — the projector. Takes a perturbation +
  optional schedule outcome + baseline + cost lines + EVM snapshot; returns the
  projection. Owns the correctness rules.
- **`lib/domain/critical-path.ts`** — backward binding-trace from go-live: which
  shifted tasks/milestones actually determine the date (vs. absorbed noise).
- **`lib/domain/hard-windows.ts`** — pushes a projected date past freeze /
  absence / roll-off windows to the next clear working day.
- Reuses existing **`scheduling.ts`** (cascade) and **`evm.ts` / `evm-project.ts`**
  (the B4 confidence formula) — no new scoring logic invented.

### UI
- **`components/ui/impact-drawer.tsx`** — the schedule-impact drawer (decision
  card first, editable cascade behind a disclosure) + the shared
  `ConsequenceStory` + `RationalePanel`.
- **`components/ui/consequence-modal.tsx`** — lightweight reusable modal for
  perturbations without a cascade table (cost-overcharge today).
- Triggers live on the entity grids (cost-overcharge on `costs-grid`; task-date
  on `tasks-grid`).

---

## 4. Correctness rules (the product is the honesty)

Each is enforced in the engine and has a test asserting the *wrong* answer never
appears. These are the reasons a PM can trust the numbers in front of a SteerCo.

| # | Rule | Why it matters |
|---|------|----------------|
| **C1** | A disruption can never **raise** confidence. | Confidence routes through real cost; a slip/over-charge can only add cost → lower or hold CPI. If accepting a slip *improved* the score, the engine would be trivially gameable — the opposite of the pitch. |
| **C2** | Go-live ≠ "latest milestone" — it is an explicitly designated gate. | Projects have post-go-live milestones (hypercare/PQ); `max(date)` mislabels. |
| **C3** | A slip with slack moves nothing — "absorbed". | Half the time the honest answer is "relax". Saying so earns trust for the times it says "+5 weeks". |
| **C4** | Critical path is recomputed **after** the edit. | Absorbing slack promotes a previously-safe path to critical. |
| **C5** | Duration-driven cost accrues on **T&M lines only**. | Fixed/Internal lines don't cost more for taking longer. A fabricated "+€X" on a fixed-price project is instantly disbelieved. |
| **C6** | Working days **and** calendar days are both shown. | PMs think in weeks; the engine thinks in working days. Mismatch reads as a bug. |
| **C7** | Never show a number you can't defend. | No T&M rate / no baseline → an honest blank, not a guess. Same discipline as the verdict's coverage-gating. |

**Locked-breach (emergent, caught in live testing):** a *locked* go-live the work
overruns is **not** "absorbed" — the date can't move on paper, so the work
overruns it (miss / compress). Distinguished via an "unlocked projection" — where
go-live *would* land if its lock were ignored.

---

## 5. The trust & adjust model (two tiers)

A reviewer should weigh this as the core sellability decision:

- **Facts the PM owns → adjustable, and the impact re-flows live:** which rows
  shift, dates, the **T&M day-rate**, whether a **freeze applies**.
- **Scoring the engine owns → shown in full but never editable:** the confidence
  formula (40% cost-efficiency + 40% schedule-pace + 20% forecast-headroom) and
  the verdict bands.

The second tier being read-only is deliberate and is the trust guarantee: *a
score you can hand-tune is a score no one can trust.* Every derived number has a
"How is this calculated?" disclosure showing its arithmetic.

---

## 6. Key design decisions & rationale

1. **Frozen baseline via the existing commitment.** v1 measures against the
   project's own committed dates (milestone `plannedDate` / `project.goLiveDate`),
   which are immutable in practice — so no new storage was needed. A persisted,
   re-baselineable snapshot (for trend over time) is deferred to the backend.
2. **Confidence moves only through real cost.** EVM confidence is driven by
   cost + progress, *not task dates*. Rather than fabricate a date-driven drop,
   the engine moves confidence only via the genuine cost mechanism (extension →
   AC → CPI → EAC). This makes C1 structural, not a patch.
3. **One perturbation pipeline.** Scope-add, over-charge, and absence all reduce
   to (schedule outcome) + (cost delta). Building date-only would mean rebuilding
   the consequence chain three more times.
4. **Decision-first UX.** Lead with the clean consequence card; the full editable
   cascade collapses behind "Review & adjust details". Two altitudes, one place —
   not multiple windows.
5. **Named, phase-level causal chain.** Show ~3 named hops (e.g. *Vault
   Configuration → UAT Sign-off → Go-Live*), not 9 raw milestone IDs.
6. **Acceptance record.** Accepting a breach writes the true cost to the audit
   log (slip, cost, confidence, window) — the seed of a "slack ledger". Absorbed
   changes aren't recorded (nothing was traded away).

---

## 7. Data model / inputs

- **Perturbation** — `{ kind, … }` per variant (task name + working-day shift;
  scope item + budget; cost line + over-amount; person + until + gate).
- **ScheduleOutcome** — `{ affected[], milestonePushes[], goLiveProjectedUnlocked }`
  produced by the caller from the existing cascade (caller owns task↔milestone
  id translation).
- **Baseline** — `{ committedGoLive, projectStart, goLiveMilestoneId, goLiveName,
  goLiveLocked }`.
- **Cost lines** — `{ budgetK, contractType }` (contract type drives C5).
- **EVM snapshot** — current `useProjectEvm` snapshot (or null → confidence
  blanks, C7).
- **Hard windows** — `{ label, kind, start, end }` (sample-seeded today).

---

## 8. Built vs. pending

**Built & tested:**
- Consequence projection (go-live / cost / confidence) — spec steps 1, 3, 4.
- Critical-path ranking — step 2.
- Perturbation pipeline — step 5 (all four kinds, engine-level).
- Hard windows — step 6.
- Acceptance record — step 7.
- Locked-breach handling, decision-first UX, named chain, trust-&-adjust layer.
- **cost-overcharge UI trigger** (costs grid) via the reusable modal.

**Pending (engine ready, UI not yet wired):**
- **absence** trigger (people grid → forces gate date → cascade → drawer).
- **scope-add** trigger (tasks/plan → new work + budget).
- **Hard-window authoring UI** (currently a sample-only seed).
- **Persisted baseline / trend** ("remember yesterday" — needs backend).

---

## 9. Known assumptions & limitations (please pressure-test)

1. **Implied linear T&M day-rate** = T&M budget ÷ committed working-day duration.
   Defensible v1, but real burn is rarely linear — hence the PM override.
2. **EV = average task progress × BAC** (single synthetic item). An approximation
   pending per-item budgets.
3. **Hard windows are sample-seeded**, not yet author-able per project.
4. **Single-user, browser-local** (localStorage). No identity/attribution on the
   acceptance record yet — limits the audit pitch until the backend lands.
5. **Gate buffer is a flat 1 working day**; not yet configurable.
6. **Confidence weights (40/40/20) and verdict bands are fixed** by product
   decision — intentionally non-configurable (see §5).

---

## 10. Open questions for the reviewer

1. Is the **two-tier trust model** (adjust facts, never the score) the right line,
   or should any scoring input be exposed?
2. Is the **linear T&M day-rate** a credible default for a first pilot, given the
   override exists?
3. Should the **acceptance record** surface as a visible "decisions accepted"
   ledger now, or wait for the backend/identity?
4. Which perturbation trigger matters most for the **pilot demo** — absence
   (the approver-before-sign-off scenario) or scope-add?
5. Does the **cost-overcharge** framing ("model a vendor over-charge") match how a
   PM would actually reach for this, or should it trigger reactively when a line
   forecasts over budget?
