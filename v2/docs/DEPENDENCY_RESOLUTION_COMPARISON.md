# Dependency Resolution Comparison

## Context

This spike compares the existing one-loop-at-a-time workbench with a fresh "waiting-link repair" approach. The goal is not only better graph theory; it is whether a PM can resolve blocked schedule previews at real project scale without learning graph vocabulary.

## Algorithm

| Dimension | Current M23 / M23.1 | Fresh implementation |
| --- | --- | --- |
| Method | DFS/topology failure path surfaces one blocked loop at a time. | Tarjan strongly connected components over task `dependsOn` links, then ranks every internal waiting link. |
| Output | One loop, with a suggested final edge. | All blocked areas in one pass, each with task count, link count, workstreams, ranked per-link actions, and a recommended first repair. |
| Multi-loop behavior | Iterative: fix one, recompute, then see the next. | Proactive: independent blocked areas are visible immediately, while the UI still focuses on one area at a time. |
| Complexity | O(V + E) for detection. | O(V + E) time and O(V + E) space; no all-simple-loops enumeration, so 1000+ links remain practical. |
| Weakness | Simpler mental model, but can hide the amount of cleanup still waiting. | More metadata and ranking logic; the recommendation is a heuristic, not a guarantee of business correctness. |

Preference: use the fresh algorithm as the engine-side diagnostic because it gives the UI enough structured data to scale beyond one loop. Keep the existing one-at-a-time save semantics so PMs are not forced into a bulk repair workflow.

## UI

| Dimension | Current workbench | Fresh workbench |
| --- | --- | --- |
| Primary pattern | Overview line, filters, suggested-fix card, compact rows. | What/why/what-to-do amber panel, one recommended repair, then searchable/filterable link list capped at 8 rows by default. |
| Scale behavior | Good for small loops; larger loops still become a long list. | Handles 80-link loops by showing summary first and disclosing the full list only on request. |
| Language | Mostly plain language, but still centered on loop membership. | Uses "tasks point back", "waiting link", "coordination note", and avoids graph terms in visible copy. |
| Actions | Change to parallel, remove, add note. | Make coordination note or remove waiting link; actions update only the command-center repo data model. |
| Weakness | More direct for a single obvious loop. | Slightly more UI surface; should be A/B tested with PMs before replacing the current workbench. |

UX rationale:
- Shneiderman's information-seeking mantra supports summary first, filter/search next, details on demand for complex information spaces: https://drum.lib.umd.edu/items/155a868e-fb83-4115-9899-9187ea8c0498
- NN/g's progressive disclosure guidance supports showing the important repair first and deferring the full link list until requested: https://www.nngroup.com/articles/progressive-disclosure/
- NN/g's recognition-over-recall guidance supports visible repair choices instead of asking PMs to infer the correct graph operation: https://www.nngroup.com/articles/recognition-and-recall/
- NN/g's error-message guidance supports plain-language what happened, why it matters, and constructive next action: https://www.nngroup.com/articles/error-message-guidelines/

## Recommendation

These are merge-able. Keep the existing partial-success behavior: the edited task still saves and downstream cascade is skipped. Replace the diagnostic core with the fresh Tarjan-based repair plan, then keep the current workbench as the compact mode and use the new waiting-link repair section when loops exceed roughly 12 links or when more than one blocked area exists.

For command-center comparison, I would ship both together: current amber callout first, fresh repair workbench immediately below it. That lets Vineet test whether the new pattern actually changes PM behavior before we delete the older UI.
