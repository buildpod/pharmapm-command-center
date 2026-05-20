# Delivery Truth Engine

## 1. Purpose

The Delivery Truth Engine answers one operating question:

> Is the project promise still credible, and what is changing that promise?

It is not a reporting widget. It is a deterministic layer that reads the current project state and produces a traceable view of delivery confidence, forecast pressure, budget pressure, readiness compression, and the next decisions needed.

## 2. Inputs

The engine reads only project-local data:

- `Project`: start date, go-live date, methodology, project id.
- `Milestone[]`: planned date, forecast date, phase, status, owner.
- `Task[]`: workstream, priority, status, progress, due date, owner, milestone link.
- `Risk[]`: probability, impact, score, status, owner.
- `Document[]`: phase, status, due date, owner, reviewers, approvers.
- `CostLine[]`: budget and actual spend by category.
- `currentDate`: supplied by caller; defaults to the demo project date.

All inputs are passed to the pure function. No browser APIs, stores, localStorage, or React state are used inside the engine.

## 3. Outputs

`calculateDeliveryTruth(input)` returns:

- `confidenceScore`: 0-100 score after signal deductions.
- `confidenceBand`: `credible`, `watch`, `at-risk`, or `unlikely`.
- `targetDate`: project go-live date.
- `forecastDate`: forecast completion date derived from milestones.
- `scheduleDeltaDays`: calendar-day delta from target to forecast.
- `budget`: budget, actual, burn percentage, expected elapsed percentage, and variance.
- `signals`: ordered list of delivery-truth signals.
- `decisionOptions`: deterministic next-decision prompts derived from the active signals.

Signals contain plain-language `title`, `summary`, `whyItMatters`, `nextAction`, `severity`, `tone`, and traceable `sources`.

## 4. Signal Rules

### Schedule Drift

Raised when incomplete milestones forecast later than plan. The engine reports the largest drift and traces the affected milestones.

Severity:

- `critical`: forecast completion is later than target go-live.
- `high`: any incomplete milestone is drifting by 10+ days.
- `medium`: any incomplete milestone is drifting by 5+ days.
- `low`: any incomplete milestone is drifting by 1-4 days.

### Cost Pressure

Raised when actual spend is above budget or burn percentage materially exceeds elapsed project time.

Severity:

- `critical`: actual spend exceeds budget.
- `high`: burn is 85%+.
- `medium`: burn is at least 60% or 15 percentage points ahead of elapsed time.

### Decision And Document Debt

Raised when review or approval decisions are pending on overdue or near-due documents. Draft controlled documents near a delivery gate also count as debt.

Severity:

- `high`: overdue decisions/documents exist.
- `medium`: near-due pending decisions exist.
- `low`: pending decisions exist but are not yet near due.

### Readiness Compression

Raised when validation, training, or go-live readiness work is incomplete close to its due date or close to project go-live.

Severity:

- `high`: critical/high readiness tasks are overdue or blocked.
- `medium`: critical/high readiness tasks are due within 30 days and less than half complete.
- `low`: readiness work is incomplete but not urgent.

### Blocked Work

Raised when tasks are blocked, especially critical or high-priority tasks.

Severity:

- `high`: any blocked task is critical or high priority.
- `medium`: any blocked task exists.

### Risk Pressure

Raised when open risks have high probability-impact scores.

Severity:

- `high`: any open risk has score 15+.
- `medium`: any open risk has score 8-14.

## 5. Scoring

The engine starts at 100 and deducts by severity:

- `critical`: 18
- `high`: 12
- `medium`: 7
- `low`: 3

Deductions are capped by the number and severity of active signals. The result is clamped to 0-100.

Bands:

- `credible`: 75-100 and no critical signal.
- `watch`: 55-74.
- `at-risk`: 35-54.
- `unlikely`: below 35 or any critical signal with score below 55.

## 6. Non-Goals

This module does not:

- Predict outcomes with an LLM.
- Run Monte Carlo simulation.
- Persist impact records.
- Replace the scheduling/cascade engine.
- Model full enterprise/portfolio hierarchy.
- Calculate real agent token economics.

Those belong to later modules once the deterministic truth layer is trusted.

## 7. Test Coverage

`delivery-truth.test.ts` covers:

- Clean project produces high confidence and no signals.
- Schedule drift creates a schedule signal.
- Cost overrun creates a cost signal.
- Overdue pending decisions create a document/decision debt signal.
- Incomplete readiness tasks create readiness compression.
- Blocked high-priority work creates a blocked-work signal.
- Open high-score risks create a risk-pressure signal.
- Multiple signals lower confidence and generate decision options.
