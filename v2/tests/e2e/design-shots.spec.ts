// Design screenshots — NOT part of the release gate (release-verify targets
// ui-regression.spec.ts only). Run on demand to eyeball the DAP/guidance
// surfaces without a live browser session:
//
//   pnpm exec playwright test tests/e2e/design-shots.spec.ts --project=chromium-desktop
//
// PNGs land in output/design-shots/.

import { test } from "@playwright/test";

const appBase = "/pharmapm-command-center/v2";
const OUT = "output/design-shots";

const ALL_TOURS_SEEN = JSON.stringify(Object.fromEntries(
  ["/", "/truth", "/tasks", "/costs", "/reports", "/setup", "/activity", "/plan",
   "/milestones", "/worklist", "/my-items", "/readiness", "/governance", "/charter",
   "/decisions", "/risks", "/issues", "/documents", "/resources", "/projects", "/settings",
  ].map((route) => [route, true]),
));

function seed(page: import("@playwright/test").Page, opts: { toursSeen?: boolean } = {}) {
  const { toursSeen = true } = opts;
  return page.addInitScript(
    ({ seenMap, markSeen }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem("aivello_sample_optin_v1", "1");
      window.localStorage.setItem("aivello_command_center_journey_seen_v1", "1");
      if (markSeen) window.localStorage.setItem("aivello_tours_seen_v1", seenMap);
    },
    { seenMap: ALL_TOURS_SEEN, markSeen: toursSeen },
  );
}

test.describe("design shots", () => {
  test("dashboard", async ({ page }) => {
    await seed(page);
    await page.goto(`${appBase}/`);
    await page.waitForSelector(".executive-verdict");
    await page.screenshot({ path: `${OUT}/01-dashboard.png` });
  });

  test("guide drawer", async ({ page }) => {
    await seed(page);
    await page.goto(`${appBase}/`);
    await page.waitForSelector(".executive-verdict");
    await page.getByRole("button", { name: /open guide/i }).click();
    await page.waitForSelector(".help-drawer__panel");
    await page.screenshot({ path: `${OUT}/02-guide-drawer.png` });
  });

  test("tour intro and steps", async ({ page }) => {
    await seed(page, { toursSeen: false }); // dashboard tour unseen → intro auto-appears
    await page.goto(`${appBase}/`);
    await page.waitForSelector(".tour-start-card");
    await page.screenshot({ path: `${OUT}/03-tour-intro.png` });
    await page.getByRole("button", { name: /start guided work/i }).click();
    await page.waitForSelector(".tour-step-card");
    await page.waitForTimeout(600); // let scroll + spotlight settle
    await page.screenshot({ path: `${OUT}/04-tour-step-1.png` });
    await page.getByRole("button", { name: /^next$/i }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/05-tour-step-2.png` });
  });

  test("tasks with guidance strip", async ({ page }) => {
    await seed(page);
    await page.goto(`${appBase}/tasks/`);
    await page.waitForSelector("[data-tour-id='tasks-register'], .guided-work", { timeout: 15_000 });
    await page.screenshot({ path: `${OUT}/06-tasks-strip.png` });
  });

  test("learn page", async ({ page }) => {
    await seed(page);
    await page.goto(`${appBase}/learn/`);
    await page.waitForSelector("h1");
    await page.screenshot({ path: `${OUT}/07-learn.png` });
  });

  test("guide drawer with unseen tour badge", async ({ page }) => {
    await seed(page, { toursSeen: false });
    await page.goto(`${appBase}/tasks/`);
    await page.waitForSelector(".tour-start-card"); // intro appears (unseen)
    await page.keyboard.press("Escape");            // dismiss → marks seen, dot clears
    await page.goto(`${appBase}/risks/`);           // risks tour still unseen → dot visible
    await page.waitForSelector("[data-tour-id='risks-board']");
    await page.screenshot({ path: `${OUT}/08-risks-unseen-dot.png` });
  });
});
