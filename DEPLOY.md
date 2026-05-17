# Deployment Guide — PharmaPM Command Center

This is a **zero-build static web app**. No bundler, no transpiler, no `npm install` required for production. Deploy by copying files to any static host.

---

## Option 1 — GitHub Pages (recommended for testing & demos)

### One-time setup

1. **Create repository:** `https://github.com/new` → name it `pharmapm-command-center` → **Public** → tick "Add a README file" → **Create repository**.

2. **Upload code:**
   - In the new repo, click **Add file → Upload files**.
   - Drag the **contents** of this folder (not the folder itself) into the upload area.
   - Important: `index.html` must end up at the repository root, not inside a subfolder.
   - Scroll down → **Commit changes**.

3. **Enable Pages:**
   - **Settings** → **Pages**.
   - Source: **Deploy from a branch**.
   - Branch: **main** / **/ (root)** → **Save**.
   - Wait 1–2 minutes for first deploy.

4. **Open the URL** that GitHub Pages displays:
   ```
   https://YOUR_USERNAME.github.io/pharmapm-command-center/
   ```

### Subsequent deploys

After the initial setup, every push to `main` redeploys automatically:

```bash
git add .
git commit -m "describe change"
git push
```

GitHub typically redeploys within 30–90 seconds.

---

## Option 2 — Local development server

If you have Python installed:

```bash
cd pharmapm-command-center
python3 -m http.server 8000
```

Open `http://localhost:8000`.

If you have Node.js:

```bash
cd pharmapm-command-center
npx serve
```

If you have VS Code: install the **Live Server** extension, right-click `index.html` → **Open with Live Server**.

---

## Option 3 — Any other static host

The same files work on Netlify, Vercel, Cloudflare Pages, S3 + CloudFront, or any web server that can serve plain HTML/CSS/JS. No build step. No special config required.

---

## Verifying a successful deploy

After deploy, run these checks. All should pass.

| # | URL | Expected |
|---|---|---|
| 1 | `/` | Welcome screen with three options (Start New / Import / Demo) |
| 2 | `/` → click "Load demo project" | Shell renders with sidebar, top bar, DEMO banner |
| 3 | Click each sidebar item (Milestones, Tasks, Risks, Documents, Costs, Dashboard, SteerCo) | Each view renders without console errors |
| 4 | Click a row in any grid | Detail pane opens on the right |
| 5 | Edit a cell → click elsewhere → refresh page | Edit persists |
| 6 | `/verify.html` → click "Run all tests" | **197/197 passed** |
| 7 | Click "SteerCo" → "Print / Save as PDF" | Print preview shows only the report (no chrome) |

If any step fails, open the browser DevTools Console (F12) and check for errors. Most likely causes:

- **404 on `src/...` files:** `index.html` is in a subfolder, not the repo root. Move it up.
- **`PPM is not defined`:** browsers may block local `file://` script loading. Use a real HTTP server (Option 1, 2, or 3).
- **Tests show fewer than 197 passed:** something regressed. Inspect the failure labels and compare against `tools/run_tests.js` output (run locally if needed).

---

## Running the headless test runner (for CI or pre-deploy verification)

The Node-based runner verifies all backend logic + UI architecture compliance without a browser:

```bash
node tools/run_tests.js              # short output, exit 0 = green
node tools/run_tests.js --verbose    # also print all 197 passing tests
```

Exit codes: `0` = all pass, `1` = at least one failure, `2` = could not load a module.

This runner does NOT verify visual rendering, click handlers, or CSS. Those still require a real browser and the URL from your deploy.

---

## Custom domain (optional, when you want a polished URL)

GitHub Pages supports custom domains free of charge.

1. **Buy domain** at any registrar (Namecheap, Cloudflare, etc).
2. In your DNS provider, add either:
   - **Apex** (e.g. `pharmapmpro.com`): four `A` records pointing to GitHub's Pages IPs (current list at `https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site`).
   - **Subdomain** (e.g. `app.pharmapmpro.com`): one `CNAME` record pointing to `YOUR_USERNAME.github.io`.
3. In repo: **Settings → Pages → Custom domain** → enter the domain → **Save**.
4. Tick **Enforce HTTPS** once GitHub provisions the certificate (5–60 minutes).

---

## Production deployment checklist (before pointing customers at the URL)

This list is for when you decide to ship to paying customers, not for testing/preview.

- [ ] All 197 tests passing locally (`node tools/run_tests.js`)
- [ ] Manual acceptance test against the 25 criteria in `PROD-002B_UserJourney_IA_v2.0.md` (Section 11)
- [ ] Tested on actual mobile device (not just resized browser) on Chrome iOS, Safari iOS, Chrome Android
- [ ] Demo project loads cleanly; export/import roundtrip preserves all fields
- [ ] DEMO banner visible whenever demo data is loaded; not visible when real project is created
- [ ] SteerCo print preview produces a clean A4 PDF with no chrome elements
- [ ] No `console.error` or `console.warn` in any flow
- [ ] No personally identifiable info from your test sessions in the demo data baked into `projectService.js`
- [ ] HTTPS enforced (GitHub Pages does this automatically once enabled)
- [ ] `README.md` does not reveal anything you don't want public (the repo is Public for free Pages)

---

## Rollback

To revert to a previous version:

```bash
git log --oneline                              # find the commit hash to revert to
git revert <hash>                              # creates a new commit that undoes the bad one
git push                                       # GitHub Pages redeploys
```

Or reset hard (destructive — only if no one else has cloned):

```bash
git reset --hard <hash>
git push --force
```

---

## What's in this build

- **Phase 1:** schema v1.1, immutability guards, lifecycle state machine, crypto.randomUUID
- **Multi-file split:** 30+ modules across config / schema / domain / adapters / services / ui
- **Section 2 (UI):** welcome, wizard, shell, 5 grid views, detail pane, dashboard, SteerCo report
- **Tests:** 197 assertions covering all logic + UI architecture compliance (filesystem scan)
- **Architecture:** strict layering, UI consumes services + schema only, enforced by automated source scan

---

## What's deferred to v2 (per ADR pack)

Not in this deploy. Documented in `PROD-002B_ADR_Pack_v1.0.md`:

- Backend API + Postgres
- Authentication / SSO / RBAC
- Multi-tenant
- Audit trail emission
- Optimistic locking for concurrent edits
- Connectors (Jira, SharePoint, Veeva Vault)
- Observability stack
