import { expect, type Locator, type Page, test } from "@playwright/test";

const routes = [
  { path: "/", nav: "Dashboard", heading: /Veeva RIM Command Center|Dashboard/ },
  { path: "/truth/", nav: "Delivery Signals", heading: /Delivery Signals/ },
  { path: "/reports/", nav: "Reports", heading: /Reports/ },
  { path: "/setup/", nav: "New Project", heading: /Project Discovery|Project Setup|Review & Create/ },
  { path: "/worklist/", nav: "Worklist", heading: /Worklist/ },
  { path: "/my-items/", nav: "My Items", heading: /My Items/ },
  { path: "/readiness/", nav: "Readiness Gates", heading: /Readiness Gates/ },
  { path: "/plan/", nav: "Plan", heading: /Plan/ },
  { path: "/governance/", nav: "Governance", heading: /Governance/ },
  { path: "/charter/", nav: "Charter", heading: /Project Charter/ },
  { path: "/milestones/", nav: "Milestones", heading: /Milestones/ },
  { path: "/tasks/", nav: "Tasks", heading: /Tasks/ },
  { path: "/risks/", nav: "Risks", heading: /Risks/ },
  { path: "/documents/", nav: "Documents", heading: /Documents/ },
  { path: "/costs/", nav: "Costs", heading: /Costs/ },
  { path: "/resources/", nav: "People & Meetings", heading: /People|Meetings|Resources/ },
  { path: "/projects/", nav: "Manage Projects", heading: /Projects/ },
  { path: "/settings/", nav: "Rules & Settings", heading: /Rules|Settings/ },
];

const appBase = "/pharmapm-command-center/v2";

const modalFlows = [
  { path: "/milestones/", trigger: "Add Milestone", dialog: /Add milestone/, primary: "Add milestone" },
  { path: "/tasks/", trigger: "Add Task", dialog: /Add task/, primary: "Add task" },
  { path: "/risks/", trigger: "Add Risk", dialog: /Add risk/, primary: "Add risk" },
  { path: "/documents/", trigger: "Add Document", dialog: /Add document/, primary: "Add document" },
  { path: "/costs/", trigger: "Add Cost Line", dialog: /Add cost line/, primary: "Add cost line" },
  { path: "/resources/", trigger: "Add Member", dialog: /Add team member/, primary: "Add member" },
  {
    path: "/resources/",
    trigger: "Add Meeting",
    dialog: /Add meeting/,
    primary: "Add meeting",
    prepare: async (page: Page) => {
      await page.getByRole("button", { name: /meeting cadence/i }).click();
    },
  },
];

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await gotoApp(page, "/");
  (page as Page & { __errors?: string[] }).__errors = errors;
});

test.afterEach(async ({ page }) => {
  const errors = (page as Page & { __errors?: string[] }).__errors ?? [];
  const ignored = errors.filter((error) =>
    !error.includes("favicon") &&
    !error.includes("ResizeObserver loop") &&
    !error.includes("Failed to fetch RSC payload")
  );
  expect(ignored).toEqual([]);
});

test("all primary routes load without blank pages or horizontal overflow", async ({ page, isMobile }) => {
  for (const route of routes) {
    await gotoApp(page, route.path);
    await expect(page.locator("body")).toContainText(route.heading);
    if (isMobile) {
      await expect(page.getByRole("button", { name: /open menu/i })).toBeVisible();
    } else {
      await expect(page.locator(".app-nav")).toBeVisible();
    }
    await expect(page.locator(".app-topbar")).toBeVisible();
    await expect(page.locator("main, .app-content").first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
  }
});

test("sidebar navigation covers every main product area", async ({ page, isMobile }) => {
  for (const route of routes) {
    await gotoApp(page, "/");
    if (isMobile) await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("link", { name: new RegExp(route.nav, "i") }).first().click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegex(appBase + route.path)}$`));
    await expect(page.locator("body")).toContainText(route.heading);
    await assertNoHorizontalOverflow(page);
  }
});

test("topbar search, theme, notifications, and project switcher are usable", async ({ page, isMobile }) => {
  await gotoApp(page, "/");

  await page.getByRole("button", { name: /open search/i }).click();
  const search = page.getByPlaceholder(/search pages/i);
  await expect(search).toBeVisible();
  await search.fill("tasks");
  await expect(page.getByRole("option", { name: /tasks/i })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /switch to dark mode|switch to light mode/i }).click();
  await expect(page.locator("html")).toHaveAttribute("class", /dark|light|/);

  await page.getByRole("button", { name: /notifications|alerts/i }).click();
  await expect(page.locator("body")).toContainText(/Alerts|No alerts|active/i);
  await page.keyboard.press("Escape");

  if (isMobile) await page.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("button", { name: /switch project|project/i }).first().click();
  await expect(page.locator("body")).toContainText(/Manage projects|Create or import project|Veeva/i);
});

test("project search filters the switcher and manage projects list", async ({ page, isMobile }) => {
  await gotoApp(page, "/");

  if (isMobile) await page.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("button", { name: /switch project|project/i }).first().click();
  const switcherSearch = page.getByRole("textbox", { name: /search projects/i }).first();
  await expect(switcherSearch).toBeVisible();
  await switcherSearch.fill("veeva");
  await expect(page.getByRole("button", { name: /veeva/i }).first()).toBeVisible();
  await switcherSearch.fill("not-a-real-project");
  await expect(page.getByText(/no matching projects/i)).toBeVisible();
  await page.keyboard.press("Escape");

  await gotoApp(page, "/projects/");
  const pageSearch = page.getByRole("textbox", { name: /search projects/i });
  await expect(pageSearch).toBeVisible();
  await pageSearch.fill("veeva");
  await expect(page.locator("main").getByRole("heading", { name: /veeva/i }).first()).toBeVisible();
  await expect(page.locator("main").getByText(/\d+ of \d+ projects/i)).toBeVisible();
  await pageSearch.fill("missing project code");
  await expect(page.getByText(/no matching projects/i)).toBeVisible();
  await page.getByRole("button", { name: /clear search/i }).click();
  await expect(page.locator("main").getByRole("heading", { name: /veeva/i }).first()).toBeVisible();
});

test("entity create modals keep close, cancel, and primary actions visible", async ({ page }) => {
  for (const flow of modalFlows) {
    await gotoApp(page, flow.path);
    if ("prepare" in flow && flow.prepare) await flow.prepare(page);

    await page.getByRole("button", { name: new RegExp(flow.trigger, "i") }).first().click();
    const dialog = page.getByRole("dialog", { name: flow.dialog });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(flow.dialog);

    await expectActionVisibleInViewport(page, dialog.getByRole("button", { name: /cancel/i }));
    await expectActionVisibleInViewport(page, dialog.getByRole("button", { name: new RegExp(flow.primary, "i") }));
    await expectActionVisibleInViewport(page, dialog.getByRole("button", { name: /close/i }));

    await assertNoHorizontalOverflow(page);
    await dialog.getByRole("button", { name: /cancel/i }).click();
    await expect(dialog).toBeHidden();
  }
});

test("schedule impact review opens as a centered modal window", async ({ page, isMobile }) => {
  await gotoApp(page, "/tasks/");

  await page.getByRole("button", { name: "Set up user roles & permission profiles" }).click();
  const editDialog = page.getByRole("dialog", { name: /edit/i });
  await expect(editDialog).toBeVisible();
  await editDialog.getByLabel(/due date/i).fill("2026-06-05");
  await editDialog.getByRole("button", { name: /save changes/i }).click();

  const impactDialog = page.getByRole("dialog", { name: /review schedule impact/i });
  await expect(impactDialog).toBeVisible();
  await expect(impactDialog).toContainText(/affected downstream|downstream tasks|linked milestones/i);
  await expectActionVisibleInViewport(page, impactDialog.getByRole("button", { name: /discard changes/i }));
  await expectActionVisibleInViewport(page, impactDialog.getByRole("button", { name: /save/i }));

  const modalPanel = page.locator(".impact-modal-panel");
  await expect(modalPanel).toBeVisible();
  if (!isMobile) {
    const box = await modalPanel.boundingBox();
    const viewport = page.viewportSize();
    expect(box, "schedule impact should have a measurable modal window").not.toBeNull();
    expect(viewport, "viewport must be available").not.toBeNull();
    if (box && viewport) {
      expect(box.width, "schedule impact should be wider than a drawer").toBeGreaterThan(760);
      expect(box.x, "schedule impact should not be right-anchored").toBeGreaterThan(80);
      expect(viewport.width - (box.x + box.width), "schedule impact should be centered").toBeGreaterThan(80);
    }
  }

  await impactDialog.getByRole("button", { name: /save/i }).click();
  await expect(impactDialog).toBeHidden();
  await expectTaskRowDue(page, "Configure submission workspace settings", "08 Jun");
  await expectTaskRowDue(page, "Set up workflow lifecycle rules", "08 Jun");
  await expectTaskRowDue(page, "Configure document templates & renditions", "09 Jun");
});

test("charter template flow opens with useful prefilled content", async ({ page }) => {
  await gotoApp(page, "/charter/");

  const templateButton = page.getByRole("button", { name: /load standard template/i });
  if (await templateButton.isVisible()) {
    await templateButton.click();
    const dialog = page.getByRole("dialog", { name: /create charter/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/standard template loaded/i)).toBeVisible();
    await expect(dialog.getByDisplayValue(/controlled delivery path/i)).toBeVisible();
    await expectActionVisibleInViewport(page, dialog.getByRole("button", { name: /create charter/i }));
    await dialog.getByRole("button", { name: /cancel/i }).click();
  } else {
    await page.getByRole("button", { name: /edit/i }).click();
    const dialog = page.getByRole("dialog", { name: /edit charter/i });
    await expect(dialog).toBeVisible();
    await expectActionVisibleInViewport(page, dialog.getByRole("button", { name: /save changes/i }));
    await dialog.getByRole("button", { name: /cancel/i }).click();
  }
});

test("guided setup keeps actions visible and offers a review tour after create", async ({ page }) => {
  await gotoApp(page, "/setup/");

  await expectActionVisibleInViewport(page, page.getByRole("button", { name: /continue/i }));
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByRole("heading", { name: /build method/i })).toBeVisible();
  await expectActionVisibleInViewport(page, page.getByRole("button", { name: /continue/i }));
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByRole("heading", { name: /template recommendation/i })).toBeVisible();
  await expectActionVisibleInViewport(page, page.getByRole("button", { name: /review/i }));
  await page.getByRole("button", { name: /review/i }).click();

  await expect(page.getByRole("heading", { name: /review & create/i })).toBeVisible();
  await expectActionVisibleInViewport(page, page.getByRole("button", { name: /create command center/i }));
  await page.getByRole("button", { name: /create command center/i }).click();

  await expect(page).toHaveURL(new RegExp(`${escapeRegex(appBase)}/$`));
  await expect(page.getByRole("region", { name: /project setup review/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /review setup/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /skip for now/i })).toBeVisible();
});

test("SAP template creates an SAP-specific command center from the guided setup", async ({ page, isMobile }) => {
  await gotoApp(page, "/setup/");

  await page.getByLabel(/project name/i).fill("SAP S/4HANA UAT Implementation");
  await page.getByLabel(/project code/i).fill("SAP-UAT-2026");
  await page.getByLabel(/system family/i).selectOption("sap");
  await page.getByLabel(/target go-live/i).fill("2027-01-30");
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByRole("heading", { name: /build method/i })).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(page.getByRole("heading", { name: /template recommendation/i })).toBeVisible();
  await expect(page.locator("body")).toContainText(/SAP S\/4HANA implementation/i);
  await expect(page.locator("body")).toContainText(/SAP Activate/i);
  await expect(page.locator("body")).toContainText(/30 tasks/i);
  await page.getByRole("button", { name: /review/i }).click();

  await expect(page.getByRole("heading", { name: /review & create/i })).toBeVisible();
  await expect(page.locator("body")).toContainText(/SAP S\/4HANA UAT Implementation/i);
  await page.getByRole("button", { name: /create command center/i }).click();

  await expect(page).toHaveURL(new RegExp(`${escapeRegex(appBase)}/$`));
  await expect(page.getByRole("heading", { name: /SAP S\/4HANA UAT Implementation/i })).toBeVisible();

  await navigateBySidebar(page, isMobile, "Tasks", /tasks\/$/);
  await expect(page.locator("body")).toContainText(/fit-to-standard workshops/i);
  await expect(page.locator("body")).toContainText(/Mock data load 1/i);
  await expect(page.locator("body")).toContainText(/cutover runbook/i);

  await navigateBySidebar(page, isMobile, "Documents", /documents\/$/);
  await expect(page.locator("body")).toContainText(/Fit-to-Standard Outcome Log/i);
  await expect(page.locator("body")).toContainText(/Security and Controls Matrix/i);
  await expect(page.locator("body")).toContainText(/Hypercare Playbook/i);

  await navigateBySidebar(page, isMobile, "Risks", /risks\/$/);
  await expect(page.locator("body")).toContainText(/Master data quality blocks mock loads/i);
  await expect(page.locator("body")).toContainText(/Fit-to-standard decisions reopen/i);
});

test("reports tabs and evidence links are navigable without losing the report context", async ({ page }) => {
  await gotoApp(page, "/reports/");
  await expect(page.getByRole("heading", { name: /reports/i })).toBeVisible();

  await page.getByRole("button", { name: /weekly status/i }).click();
  await expect(page.getByRole("heading", { name: /Evidence trail/i })).toBeVisible();
  await page.getByRole("link", { name: /open risks/i }).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegex(appBase)}/risks/$`));

  await gotoApp(page, "/reports/");
  await page.getByRole("button", { name: /steering committee/i }).click();
  await expect(page.locator("body")).toContainText(/Steering|SteerCo|Executive/i);

  await page.getByRole("button", { name: /workstream/i }).click();
  await expect(page.locator("body")).toContainText(/Workstream/i);
});

async function expectActionVisibleInViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, "button must have a measurable bounding box").not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport, "viewport must be available").not.toBeNull();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function expectTaskRowDue(page: Page, taskName: string, dueText: string) {
  const row = page.locator("tr").filter({ has: page.getByRole("button", { name: taskName }) });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(dueText);
}

async function navigateBySidebar(page: Page, isMobile: boolean, navName: string, pathPattern: RegExp) {
  if (isMobile) await page.getByRole("button", { name: /open menu/i }).click();
  await page.getByRole("link", { name: new RegExp(navName, "i") }).first().click();
  await expect(page).toHaveURL(pathPattern);
}

async function gotoApp(page: Page, path: string) {
  await page.goto(`${appBase}${path}`);
  await page.waitForLoadState("domcontentloaded");
  await page.locator(".app-shell").waitFor({ state: "visible" });
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, "page should not horizontally overflow").toBeLessThanOrEqual(2);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
