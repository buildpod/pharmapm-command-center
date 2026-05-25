# Local Server Registry

Read this file before starting, stopping, or sharing local test URLs for this repo.

## Canonical Local App

| Purpose | Port | URL | Status note |
|---|---:|---|---|
| PharmaPM Command Center v2 dev app | 3000 | `http://localhost:3000/pharmapm-command-center/v2/` | Preferred local preview port. |
| Project Setup page | 3000 | `http://localhost:3000/pharmapm-command-center/v2/setup/` | Use this link when testing setup changes. |
| Tasks Grid page | 3000 | `http://localhost:3000/pharmapm-command-center/v2/tasks/` | Use this link when testing UI components like grids and tasks. |

## Ports To Treat Carefully

| Port | Meaning | Rule |
|---:|---|---|
| 3001 | Previous fallback/stale Next dev server | Do not give this as the test link unless verified fresh. It has previously served raw/unstyled HTML or hung on setup requests. |
| 4173 | BuildPod/Jarvis-style local service in other sessions | Do not stop unless the current task is about that service. |

## Required Checks Before Sharing A Local Link

Run these checks from the repo root or `v2` directory:

```bash
lsof -nP -iTCP -sTCP:LISTEN | rg ':(3000|3001|4173)'
curl -I 'http://localhost:3000/pharmapm-command-center/v2/setup/'
curl -sS -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' 'http://localhost:3000/pharmapm-command-center/v2/_next/static/css/app/layout.css'
curl -sS -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' 'http://localhost:3000/pharmapm-command-center/v2/_next/static/chunks/main-app.js'
```

Expected healthy result:

- setup page returns `200`
- CSS asset returns `200 text/css`
- JS asset returns `200 application/javascript`

Use `GET` checks for CSS/JS assets. In Next dev mode, `HEAD` can return `404` for generated assets even when the browser can load them correctly with `GET`.

If the page shows raw HTML, blue underlined links, missing styling, or controls do not respond, the app probably has stale Next assets.

## Clean Restart Procedure

1. Find listeners:

```bash
lsof -ti :3000
lsof -ti :3001
```

2. Stop stale Next dev processes only after confirming they belong to this repo.

3. If assets still return `404`, move the generated cache aside:

```bash
mv v2/.next /private/tmp/pharmapm-command-center-next-stale
```

4. Restart the app:

```bash
cd v2
pnpm exec next dev -p 3000
```

Shortcut:

```bash
cd v2
pnpm dev:fresh
```

`pnpm dev:fresh` moves `.next` to `/tmp` before starting. It does not delete the cache in place.

5. Re-run the required checks above before giving Vineet a test link.

## Cache Notes

The stale `.next` chunk issue is a local development-server problem. Production builds avoid this class of issue by emitting immutable hashed asset filenames, serving those assets with long-lived cache headers, and updating the HTML shell to point at the new hashes on every deploy. Enterprise apps usually add blue/green or rolling deployment, CDN purge for HTML/API routes, and service-worker version checks when a PWA/service worker exists.

For this repo, do not run `next build` and keep using an already-running dev server without a clean restart. Use `pnpm dev:fresh` when the UI looks stale, raw, or route chunks return missing-module errors.

## Current Known State

Last checked: 2026-05-24 (Next.js build cache cleared).

- `3000` is the intended local test port for this project.
- `3001` should be considered stale unless freshly started and verified.
- The GitHub Pages base path is `/pharmapm-command-center/v2`.
- Do not use `/setup/` or `/tasks/` without the base path for this app.
- Next.js build cache was successfully cleared today to resolve stale rendering.
