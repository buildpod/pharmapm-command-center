# Context Reset Playbook

Purpose: keep long Codex sessions from drifting into shallow execution when the product needs strategic thinking.

Use this when:

- The chat has become long.
- Codex starts jumping straight to implementation.
- Product direction feels uncertain.
- The app feels less sellable despite more work.
- A new thread is started after a major module.

## What Usually Goes Wrong

Long implementation threads collect code diffs, logs, screenshots, tool outputs, rules, and small tactical decisions. That can make the assistant overweight repo mechanics and underweight buyer logic.

This is not fatigue. It is context pressure.

## Reset Sequence

1. Read `AIVELLO_OPERATING_DOC.md`.
2. Read this file.
3. Read `v2/docs/NEXT_CHAT_PROMPT.md`.
4. Before editing code, answer these four questions:
   - What buyer pain are we solving right now?
   - What is the smallest demo that proves value?
   - What should we explicitly not build in this pass?
   - What evidence would make us stop or pivot?
5. Only after that, inspect the relevant files.

## Default Product Posture

Do not treat PharmaPM Command Center as a generic PM dashboard.

The current sellable wedge is:

> Can a PM walk into SteerCo with a credible project story, the leadership decision needed, and the evidence behind it?

If a change does not strengthen that wedge, challenge it before building.

## Conversation Modes

Use these exact phrases with Codex:

- `Strategy mode, no code`: critique product direction and buyer logic only.
- `Brainstorm only`: generate options and tradeoffs, do not edit files.
- `Execution mode`: implement the agreed plan.
- `Review mode`: inspect what exists and list issues first.
- `Reset before answering`: summarize product goal, current state, risks, and assumptions before proposing work.

## Context Hygiene Rules

- Prefer short summaries over dumping long files.
- Do not paste large diffs unless needed.
- Keep durable decisions in `AIVELLO_OPERATING_DOC.md`.
- Keep deep design notes in `v2/docs`.
- Start a new thread after each major commit or product-direction decision.

## Stop Conditions

Pause implementation and return to strategy if:

- The first screen does not explain value in 30 seconds.
- The next module is mostly setup, taxonomy, or configuration.
- The work adds another register without improving the SteerCo story.
- The user says the product feels unsellable, vague, or not useful.
