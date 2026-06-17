# Operational UAT — Test Script (the living project)

> Setup UAT (`USER_JOURNEY_UAT.md`) proves you can stand a project up. THIS
> script proves the product works in the **operating rhythm** — the recurring,
> real-world scenarios after go-live of the command center: weekly maintenance,
> disruptions (slip / scope creep / over-charge / absence), understanding impact,
> and reporting. A product can pass Setup UAT and still fail here.
>
> Same conventions: `[must]` blocks, `[should]` is friction. Verify tags:
> `AUTO` (preview-drivable), `VISUAL` (screenshot impression), `HUMAN` (your eye).
>
> The operating LOOP each scenario is judged against:
> **change happens → impact is shown → user understands it → decision is made →
> it's recorded → it flows into the report.** A break anywhere fails the loop.
>
> Status: DRAFT for review.

---

## O1 — Weekly maintenance by a workstream lead
**Scenario:** Monday status update. A lead (e.g. KM) opens the tool to update only their workstream.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O1.1 | The lead can filter to **their own** items (not the whole plan). *Today "Mine" = VP hardcoded — known gap G1.* | must | AUTO |
| O1.2 | Updating a task's % and status is ≤ 2 clicks and persists. | must | AUTO |
| O1.3 | Updating several items in a sitting isn't punishing (bulk / fast path). *Known gap G2.* | should | HUMAN |
| O1.4 | After updates, the verdict/signals reflect the new reality (no manual recompute). | must | AUTO |
| O1.5 | The lead is never shown another workstream's data as if it were theirs. | should | AUTO |

## O2 — Task slips → does the user understand the FULL impact?
**Scenario:** a lead pushes a task's date a few weeks.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O2.1 | Moving the date opens the impact drawer automatically. | must | AUTO |
| O2.2 | It states, in plain language: does go-live move, by how much, cost, confidence. | must | AUTO |
| O2.3 | It distinguishes "absorbed (relax)" from "this moves go-live" — not every slip alarms. | must | AUTO |
| O2.4 | The causal chain (task → gate → go-live) is shown and traceable. | should | AUTO |
| O2.5 | "How is this calculated" exposes the math + lets the user adjust assumptions (T&M rate, freeze). | should | AUTO |
| O2.6 | A non-expert PM can restate what just happened and what it costs. | should | HUMAN |

## O3 — Milestone / gate slips
**Scenario:** a gate's planned date moves.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O3.1 | Cascade preview shows which downstream gates/tasks move and which hold. | must | AUTO |
| O3.2 | Impact on go-live + the "drive go-live" markers are shown. | must | AUTO |
| O3.3 | The user can exclude/override specific rows before applying. | should | AUTO |

## O4 — Scope creep
**Scenario:** new work is added mid-flight (a change request).
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O4.1 | There is a clear way to model added scope (work + its budget). | must | AUTO |
| O4.2 | The impact shows go-live and/or cost + confidence effect of the addition. | must | AUTO |
| O4.3 | Accepting the scope records it (cost added, decision logged). | must | AUTO |
| O4.4 | The PM understands the true cost of saying "yes" before committing. | should | HUMAN |

## O5 — Vendor over-charge (cost pressure)
**Scenario:** a vendor is forecasting over budget on a cost line.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O5.1 | The cost line offers a "model over-charge / impact" path. | must | AUTO |
| O5.2 | Impact shows forecast-cost rise + confidence drop; go-live correctly holds. | must | AUTO |
| O5.3 | The over-charge is recorded to the audit log when accepted. | should | AUTO |

## O6 — Approver / owner absence
**Scenario:** a gate's owner is unavailable until a date.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O6.1 | There is a way to mark/model the owner unavailable until a return date. | must | AUTO |
| O6.2 | If the gate is on the go-live path, the breach/slip + cost + confidence are shown. | must | AUTO |
| O6.3 | A locked go-live is shown as a breach (miss/compress), not silently "absorbed". | must | AUTO |

## O7 — Over-claimed progress (integrity)
**Scenario:** a lead marks everything near-done optimistically.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O7.1 | The status-integrity signal fires ("reported progress may be overstated") with reasons. | must | AUTO |
| O7.2 | The confidence score is shown WITH the caveat, not silently inflated. | must | AUTO |
| O7.3 | The PM can see which evidence is missing to corroborate the claim. | should | HUMAN |

## O8 — Accepting a new date / re-baseline
**Scenario:** the PM accepts a slip and sets a new go-live.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O8.1 | The true cost being accepted (slip + €) is restated before commit ("you're accepting…"). | must | AUTO |
| O8.2 | Acceptance is recorded (audit log). | must | AUTO |
| O8.3 | A later silent edit of the go-live date does NOT erase the original slip — impact still measures against the frozen commitment (F2). | must | AUTO |
| O8.4 | A re-baseline is visible (who/when/why), not hidden. *Visibility nicety not yet built — flag.* | should | AUTO |

## O9 — Reporting: is ALL meaningful info captured?
**Scenario:** PM produces the weekly/SteerCo report.
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O9.1 | Report is live + project-scoped (verdict, schedule, cost, risks, decisions). | must | AUTO |
| O9.2 | It captures **the decisions/slips accepted this period** (from the audit log), not just current state. | must | AUTO |
| O9.3 | It surfaces the integrity caveat when progress may be overstated. | should | AUTO |
| O9.4 | Every key claim has an evidence trail; missing data shown honestly. | must | AUTO |
| O9.5 | Export (PDF/Excel) matches the screen and is board-ready. | must | VISUAL |
| O9.6 | A sponsor reading only the report can make decisions without the app. | should | HUMAN |

## O10 — "What changed since last time" (trend)
**Scenario:** the sponsor asks "is this getting better or worse?"
| # | Acceptance criterion | Pri | Verify |
|---|----------------------|-----|--------|
| O10.1 | The report/dashboard shows the delta since the last reporting point (confidence/go-live trend). | must | AUTO |
| O10.2 | Direction of travel (improving/declining) is explicit. | should | VISUAL |
| *Note* | *Known gap: no time-series snapshots yet — O10 is expected to FAIL today and defines the build.* | — | — |

---

## How we run it
Same as Setup UAT: confirm criteria → I execute every `AUTO` with evidence →
`VISUAL` flagged impressions → `HUMAN` left for you. Output: a pass/fail matrix
per scenario = the operational gap list, mapped to the operating loop.
