# Impact Engine Spec — Consequence Projection

> Status: SPEC (no code yet). Approve the ranking/sequence before implementation.
> Author intent: turn a date/scope/cost/absence change into its *true downstream
> consequence* — go-live, confidence, cost, and window collisions — measured
> against a frozen baseline, told as a story a PM understands in three seconds.

## 0. Why this exists (the one-line thesis)

Today the engine answers **"what other dates move?"** (`previewTaskCascade`,
`previewTaskToMilestonePush` — both solid). It does **not** answer
**"what does that cost me?"** This spec builds the second half: the consequence
chain. The product's whole claim — *truth you cannot fake* — lives or dies here,
so correctness of the math comes before UI polish.

```
PERTURBATION                 →   CONSEQUENCE PROJECTION (one engine, frozen-baseline relative)
• task date slips                → schedule → GO-LIVE → confidence → cost → window collision
• scope item added               ↗
• cost line over-charges         ↗
• resource / approver absent     ↗
```

Build the chain **once** as `projectConsequence(perturbation, baseline)`. A date
slip is trigger #1; scope/cost/absence reuse the same pipeline. Building it
date-only means rebuilding it three more times.

---

## 1. Non-negotiable correctness rules (these are the product)

These are the ways a naive implementation lies. Each is a hard requirement and
each gets a test that asserts the *wrong* answer never appears.

| # | Rule | Why a naive build gets it wrong | Test scenario |
|---|------|--------------------------------|---------------|
| C1 | **A slip never raises confidence.** Impact is measured vs. a **frozen baseline**, never the rebased plan. | EVM SPI(t) compares earned schedule to *planned* dates. Move the plan → SPI(t) rises → "I delayed it and the score improved." Fatal. | Slip a critical task 10d → confidence delta must be ≤ 0. Assert never positive. |
| C2 | **Go-live ≠ latest milestone.** Go-live is an explicitly designated gate. | Projects have post-go-live milestones (hypercare, PQ). `max(date)` mislabels. | Project with a hypercare milestone after go-live → headline tracks the designated go-live, not hypercare. |
| C3 | **A slip with slack moves nothing.** Headline is conditional on float. | FS+1 cascade shifts dates, but if the task is on a slack branch, go-live is unchanged. Showing "+10d" is fabrication. | Slip a task with 4d float by 3d → "Go-live unchanged — absorbed by 1 day remaining slack." |
| C4 | **Critical path is recomputed *after* the edit.** | Absorbing slack promotes a previously-safe path to critical. Pre-edit path is the wrong filter. | Slip consumes all float on path A → path B becomes critical → drawer flags B's tasks. |
| C5 | **Cost depends on contract type.** Time-&-materials lines accrue with duration; fixed-fee lines do not (penalty only). Never double-count the CPI overrun already in EAC. | "+10d × burn" on a fixed-price project is a number the PM knows is fake → trust dies. | Fixed-fee-only project → cost impact = "not estimable from duration" (or penalty if modelled), never a fabricated €. |
| C6 | **Working days AND calendar date, always paired.** | PM thinks "2 weeks"; engine thinks "10 working days." Mismatch reads as a bug. | "+10 working days → 14 Jul (≈ 2 calendar weeks)". |
| C7 | **Never show a number you can't defend.** No rate data → "cost impact: not estimable." No baseline → impact disabled, not guessed. | Coverage-gating, applied to impact. Same discipline as the verdict score. | Project with zero cost lines → cost line reads "not estimable — no rate data", confidence/schedule still compute. |

**C1 implies a prerequisite:** an honest slip number is impossible without a
frozen baseline to measure against. See §4.

---

## 2. The consequence chain — what each line shows & what feeds it

One readout, computed in this order. Each line names the function that feeds it
and what is genuinely new.

| Line | Shows | Fed by | New work |
|------|-------|--------|----------|
| **0. What you did** | "You slipped *SIT Cycle 2* by 5 working days." | the perturbation itself | none |
| **1. Does it matter?** | "On the critical path." OR "Absorbed — N days slack, nothing downstream moves." | NEW task-level float + recomputed critical path (C3/C4) | **task float** (engine has milestone slack only) |
| **2. Go-live headline** | "**Go-live 30 Jun → 14 Jul** (+10 working days ≈ 2 weeks)." | `previewTaskToMilestonePush` transitive chain → designated go-live gate | go-live designation (C2); calendar pairing (C6) |
| **3. The chain (traceable)** | "SIT Cycle 2 → Gate 3 (UAT sign-off) → Go-live" — each link a clickable `?focus=` row | existing push traceability (`drivenByTaskId`) | render as a causal path, reuse `useFocusRow` |
| **4. Confidence delta** | "Confidence 72 → **66**." (never up — C1) | `useProjectEvm` run on proposed dates **vs. frozen baseline** | baseline-relative EVM (C1) |
| **5. Cost delta** | "Forecast cost +€180k (T&M lines only)" OR "not estimable" | cost lines + EAC, contract-typed | cost-line type tagging (C5) |
| **6. Window collision** | "⚠ Lands inside the **Q3 validation freeze**." | NEW hard-window calendar | **hard windows** (freeze / absence / roll-off) |
| **7. Decision frame** | "Accepting this = a 5-week go-live slip and €180k. **This goes on the record.**" | composed from above + audit write | record entry on accept |

Lines 0–4 are mostly **wiring existing engines** (high payoff, low risk).
Lines 6 and the float in line 1 are the **genuinely new, uncopyable** parts.

---

## 3. UI — telling the story (so a PM gets it in 3 seconds)

Not a dashboard. A **causal sentence first, evidence drawer underneath.** Extends
the existing `impact-drawer.tsx`; does not replace the schedule review.

Storytelling spine (top to bottom): **what you did → does it matter → the one
headline → why (the chain) → the true cost → the honest choice.**

Three tone/honesty rules (reuse `tone-discipline`, coverage-gating):
1. **Confidence moves the way the PM's gut expects** — a slip never improves it (C1).
2. **Amber, not rose.** An accepted slip is a *governed tradeoff*, not a failure.
   Tone says "you chose this knowingly," not "you broke something."
3. **Honest blanks.** A line that can't be computed says so plainly (C7) — it does
   not disappear and is never faked.

Half the time the honest headline is **"Absorbed — relax."** Saying that out loud
(C3) is what earns trust for the times it says "+5 weeks."

The decision frame (line 7) writes an **acceptance record** — this is the seed of
the slack-ledger / "true cost of acceptance" the product promises, and the first
real audit-trail entry.

---

## 4. Dependency: the frozen baseline (prerequisite, build first)

C1 is impossible without a baseline to measure against. Minimum viable form:

- On project creation / first plan-commit, snapshot `{ goLiveDate, milestone
  dates, BAC, planned-value curve }` as the **frozen baseline** (localStorage is
  fine for now; same store as projects).
- Impact deltas (confidence, go-live, cost) are computed **proposed-vs-baseline**,
  not proposed-vs-current-plan.
- This is also the seed of "remember yesterday" (trend/slope) from the product
  review — one mechanism, two payoffs.

Without this, ship lines 2–3 (schedule/go-live, which are plan-relative and
honest on their own) and **gate lines 4–5 behind the baseline** rather than
showing a fakeable number.

---

## 5. Build sequence (ranked — approve this)

1. **Frozen baseline snapshot** (§4) — prerequisite for honest deltas.
2. **Task float + post-edit critical path** (C3, C4) — unlocks the "does it
   matter / absorbed?" line, the highest-trust message.
3. **Go-live designation + headline + chain** (lines 2–3, C2, C6) — the
   single most sellable line; mostly wiring existing push output.
4. **Baseline-relative confidence + contract-typed cost** (lines 4–5, C1, C5, C7).
5. **`projectConsequence` refactor** — fold the above into one perturbation
   pipeline so scope/cost/absence triggers reuse it.
6. **Hard-window calendar** (line 6) — freeze periods, approver absence, resource
   roll-off. The uncopyable part; do it last and as its own module.
7. **Acceptance record** (line 7) — audit entry, seed of the slack ledger.

Ship 1–3 first: they make the pitch *partly true* with low risk. 4–7 make it
*fully* true.

## 6. Definition of done (per step)

- Each rule C1–C7 has a test asserting the *wrong* answer never appears.
- Each consequence line either shows a defensible number or an honest blank.
- `pnpm release:verify` green; live route checked before commit (CLAUDE.md gate).
- One module per session; durable decisions logged in the operating doc.
