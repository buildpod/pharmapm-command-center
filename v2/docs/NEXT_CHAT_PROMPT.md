# Next Chat Prompt

Paste this into a fresh Codex chat when the current thread feels stretched.

```text
Continue work on PharmaPM Command Center.

Repo: pharmapm-command-center
Path: /Users/vineetpathak/Documents/Codex/2026-05-17/can-you-connect-to-my-ithub/pharmapm-command-center

Important project rules:
- Read COMMAND_CENTRE_PHARMAPM_PRO.md first.
- Read v2/docs/CONTEXT_RESET_PLAYBOOK.md.
- Read v2/docs/CODEBASE_INDEX.md before searching broadly.
- Do not touch the original pharmapm-pro repo unless I explicitly ask.
- When I say "commit", stage intended changes, commit, and push to GitHub origin/main.
- Always give me a link to test after app changes, commits, pushes, or deploy work.
- Use the local dev URL when the dev server is running:
  http://localhost:3000/pharmapm-command-center/v2/
- Use the GitHub Pages URL after pushed/deployed work:
  https://buildpod.github.io/pharmapm-command-center/v2/

Current product direction:
We are trying to make the app sellable by focusing on one painful workflow:
Can a PM walk into SteerCo with a credible project story, the required leadership decision, and the evidence behind it?

Current product priority:
Make first-run project creation and setup review clearly useful, then harden the sellable dashboard/report story.

Before proposing code, do this:
1. Summarize what the product is trying to sell.
2. Summarize what exists now.
3. List what feels weak or unsellable.
4. Suggest the smallest next move.
5. Ask whether to stay in strategy mode or execute.

Do not jump straight into implementation unless I explicitly say "execute" or ask for a concrete code change.
```

## Short Version

Use this when you want less ceremony:

```text
Read COMMAND_CENTRE_PHARMAPM_PRO.md, v2/docs/CONTEXT_RESET_PLAYBOOK.md, and v2/docs/CODEBASE_INDEX.md.
Strategy mode first, no code.
Tell me whether the current SteerCo readiness slice feels sellable, what is weak, and the smallest next move.
```
