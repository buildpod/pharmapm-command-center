import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = "http://localhost:3000/pharmapm-command-center/v2";
const outDir = "/Users/vineetpathak/projects/pharmapm-command-center/v2/docs/uat-artifacts";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = {};

async function reset({ sample = false } = {}) {
  await page.addInitScript((useSample) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem("aivello_command_center_journey_seen_v1", "1");
    window.localStorage.setItem("aivello_tours_seen_v1", JSON.stringify({
      "/": true, "/activity": true, "/charter": true, "/costs": true,
      "/decisions": true, "/documents": true, "/governance": true,
      "/issues": true, "/milestones": true, "/my-items": true,
      "/plan": true, "/projects": true, "/readiness": true,
      "/reports": true, "/resources": true, "/risks": true,
      "/settings": true, "/setup": true, "/tasks": true,
      "/truth": true, "/worklist": true,
    }));
    if (useSample) window.localStorage.setItem("aivello_sample_optin_v1", "1");
  }, sample);
}

async function goto(path) {
  await page.goto(`${base}${path}`);
  await page.waitForLoadState("domcontentloaded");
  await page.locator(".app-shell").waitFor({ state: "visible", timeout: 15000 });
}

async function screenshot(name) {
  const path = join(outDir, name);
  await page.screenshot({ path, fullPage: true });
  return `v2/docs/uat-artifacts/${name}`;
}

async function bodyText() {
  return page.locator("body").innerText();
}

async function dismissGuideIfVisible() {
  const skip = page.getByRole("button", { name: "Skip" }).first();
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
}

await reset();
await goto("/");
results.launchpad = {
  hasPurpose: await page.getByText("Run regulated implementation projects with live delivery evidence").isVisible(),
  hasStartOptions: await page.getByText("Explore sample project").isVisible()
    && await page.getByText("Create from playbook").isVisible()
    && await page.getByText("Import existing plan").isVisible()
    && await page.getByText("Start blank skeleton").isVisible(),
  screenshot: await screenshot("uat-j0-launchpad.png"),
};

await reset();
await goto("/setup/?start=import");
await dismissGuideIfVisible();
await page.getByRole("button", { name: "Continue to source" }).first().click();
const importSourceText = await bodyText();
await page.getByRole("button", { name: "Continue to model" }).first().click();
results.importMapping = {
  heading: await page.getByRole("heading", { name: /Import & Map Existing Plan/i }).isVisible(),
  hasColumnMapper: /Map your columns/i.test(importSourceText) && /Task name/i.test(importSourceText),
  hasPreview: await page.getByText("Import preview").isVisible(),
};

await reset();
await goto("/setup/?start=playbook");
await dismissGuideIfVisible();
await page.getByRole("button", { name: "Continue to source" }).first().click();
await page.getByRole("button", { name: "Continue to model" }).first().click();
results.setupBeforeCommitScreenshot = await screenshot("uat-j1-next-before-commit.png");
await page.getByRole("button", { name: "Review generated model" }).first().click();
const reviewText = await bodyText();
results.review = {
  hasReview: await page.getByRole("heading", { name: /Review & Create/i }).isVisible(),
  hasGeneratedModel: await page.getByText("Generated Operating Model").isVisible(),
  hasCategoryCounts: /Milestones\s+\d+/i.test(reviewText) && /Tasks\s+\d+/i.test(reviewText),
};
await dismissGuideIfVisible();
await page.waitForTimeout(250);
await page.getByRole("button", { name: "Create Command Center" }).scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Create Command Center" }).click();
await page.waitForTimeout(1000);
await page.waitForLoadState("domcontentloaded");
await page.locator(".app-shell").waitFor({ state: "visible", timeout: 15000 });
const createText = await bodyText();
results.createProject = {
  url: page.url(),
  landsDashboard: /PROJECT DASHBOARD/i.test(createText) || /EXECUTIVE VERDICT/i.test(createText),
  hasProjectName: /Veeva RIM Global Implementation|Veeva RIM Implementation/i.test(createText),
};

await reset({ sample: true });
await goto("/");
results.dashboardNavScreenshot = await screenshot("uat-j4-dashboard-nav.png");
results.dashboard = {
  hasVerdict: await page.getByText(/Executive Verdict|Verdict pending/i).first().isVisible(),
  hasGuidedWork: await page.getByText("Project readiness checklist").isVisible().catch(() => false),
};

await goto("/reports/");
await page.getByRole("button", { name: /Weekly Status/i }).click();
results.reportsScreenshot = await screenshot("uat-j6-o9-weekly-report.png");
results.reports = {
  hasEvidenceTrail: await page.getByRole("heading", { name: /Evidence trail/i }).isVisible(),
  hasExport: await page.getByRole("button", { name: /Export Excel/i }).isVisible().catch(() => false)
    || await page.getByText(/Excel/i).isVisible().catch(() => false),
};

results.trendScreenshot = await screenshot("uat-o10-trend-missing.png");

writeFileSync(join(outDir, "uat-browser-check.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
