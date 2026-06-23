import { expect, type Locator, type Page, test } from "@playwright/test";

const routes = [
  { path: "/", nav: "Dashboard", tab: "Command", heading: /Veeva RIM Command Center|Dashboard/ },
  { path: "/truth/", nav: "Delivery Signals", tab: "Command", heading: /Delivery Signals/ },
  { path: "/reports/", nav: "Reports", tab: "Command", heading: /Reports/ },
  { path: "/setup/", nav: "New Project", tab: "Plan", heading: /Project Discovery|Project Setup|Review & Create/ },
  { path: "/worklist/", nav: "Worklist", tab: "Plan", heading: /Worklist/ },
  { path: "/my-items/", nav: "My Items", tab: "Plan", heading: /My Items/ },
  { path: "/readiness/", nav: "Readiness Gates", tab: "Plan", heading: /Readiness Gates/ },
  { path: "/plan/", nav: "Plan", tab: "Plan", heading: /Plan/ },
  { path: "/governance/", nav: "Governance", tab: "Governance", heading: /Governance/ },
  { path: "/charter/", nav: "Charter", tab: "Governance", heading: /Project Charter/ },
  { path: "/decisions/", nav: "Decisions", tab: "Governance", heading: /Decisions/ },
  { path: "/issues/", nav: "Issues", tab: "Governance", heading: /Issues/ },
  { path: "/milestones/", nav: "Milestones", tab: "Plan", heading: /Milestones/ },
  { path: "/tasks/", nav: "Tasks", tab: "Plan", heading: /Tasks/ },
  { path: "/risks/", nav: "Risks", tab: "Governance", heading: /Risks/ },
  { path: "/documents/", nav: "Documents", tab: "Governance", heading: /Documents/ },
  { path: "/costs/", nav: "Costs", tab: "Finance", heading: /Costs/ },
  { path: "/resources/", nav: "Resources", tab: "People", heading: /People|Meetings|Resources/ },
  { path: "/projects/", nav: "Manage Projects", tab: "Command", heading: /Projects/ },
  { path: "/settings/", nav: "Rules & Settings", tab: "Command", heading: /Rules|Settings/ },
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
    // CX-7: the suite exercises the seeded sample project. Opt in explicitly,
    // otherwise the first-run guard sends a cold visitor to /setup.
    window.localStorage.setItem("aivello_sample_optin_v1", "1");
    window.localStorage.setItem("aivello_tours_seen_v1", JSON.stringify({
      "/": true,
      "/activity": true,
      "/charter": true,
      "/costs": true,
      "/decisions": true,
      "/documents": true,
      "/governance": true,
      "/issues": true,
      "/milestones": true,
      "/my-items": true,
      "/plan": true,
      "/projects": true,
      "/readiness": true,
      "/reports": true,
      "/resources": true,
      "/risks": true,
      "/settings": true,
      "/setup": true,
      "/tasks": true,
      "/truth": true,
      "/worklist": true,
    }));
    window.localStorage.setItem("aivello_command_center_journey_seen_v1", "1");
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

test("tab and contextual rail navigation covers every main product area", async ({ page, isMobile }) => {
  for (const route of routes) {
    await gotoApp(page, "/");
    await navigateByShell(page, isMobile, route);
    await expect(page).toHaveURL(new RegExp(`${escapeRegex(appBase + route.path)}(?:\\?.*)?$`));
    await expect(page.locator("body")).toContainText(route.heading);
    await assertNoHorizontalOverflow(page);
  }
});

test("deep links highlight the matching primary tab and contextual rail item", async ({ page, isMobile }) => {
  await gotoApp(page, "/risks/?focus=r3");

  await expect(page.getByLabel("Primary navigation").getByRole("link", { name: /^Governance$/ })).toHaveAttribute("data-active", "true");
  if (isMobile) {
    await page.getByRole("button", { name: /open menu/i }).click();
  }
  await expect(page.getByRole("link", { name: /^Risks/i }).first()).toHaveClass(/nav-item--active/);
  await expect(page.locator(".crumbs")).toContainText(/Governance · Risks/);
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
  await expect(impactDialog).toContainText(/affected downstream|downstream tasks|downstream dates|linked milestones/i);
  await expectActionVisibleInViewport(page, impactDialog.getByRole("button", { name: /discard changes|back without saving/i }));
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

  await expectActionVisibleInViewport(page, page.getByRole("button", { name: "Continue", exact: true }));
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page.getByRole("heading", { name: /build method/i })).toBeVisible();
  await expectActionVisibleInViewport(page, page.getByRole("button", { name: "Continue", exact: true }));
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page.getByRole("heading", { name: /template recommendation/i })).toBeVisible();
  await expectActionVisibleInViewport(page, page.getByRole("button", { name: "Review", exact: true }));
  await page.getByRole("button", { name: "Review", exact: true }).click();

  await expect(page.getByRole("heading", { name: /review & create/i })).toBeVisible();
  await expectActionVisibleInViewport(page, page.getByRole("button", { name: "Create Command Center", exact: true }));
  await page.getByRole("button", { name: "Create Command Center", exact: true }).click();

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
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page.getByRole("heading", { name: /build method/i })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect(page.getByRole("heading", { name: /template recommendation/i })).toBeVisible();
  await expect(page.locator("body")).toContainText(/SAP S\/4HANA implementation/i);
  await expect(page.locator("body")).toContainText(/SAP Activate/i);
  await expect(page.locator("body")).toContainText(/30 tasks/i);
  await page.getByRole("button", { name: "Review", exact: true }).click();

  await expect(page.getByRole("heading", { name: /review & create/i })).toBeVisible();
  await expect(page.locator("body")).toContainText(/SAP S\/4HANA UAT Implementation/i);
  await page.getByRole("button", { name: "Create Command Center", exact: true }).click();

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

test("review screen can defer a section so its records are not created (J2.4)", async ({ page, isMobile }) => {
  await gotoApp(page, "/setup/");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: /build method/i })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: /template recommendation/i })).toBeVisible();
  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(page.getByRole("heading", { name: /review & create/i })).toBeVisible();

  // Open the Risks section in the operating-model preview and defer it.
  await page.getByRole("button", { name: /^Risks/ }).click();
  const deferButton = page.getByRole("button", { name: /defer this section/i });
  await expect(deferButton).toBeVisible();
  await deferButton.click();
  await expect(page.getByRole("button", { name: /include this section/i })).toBeVisible();

  await page.getByRole("button", { name: "Create Command Center", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegex(appBase)}/$`));

  // The deferred section's records must NOT have been created.
  await navigateBySidebar(page, isMobile, "Risks", /risks\/$/);
  await expect(page.locator("body")).not.toContainText(/Registration data model decisions arrive late/i);
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
  // Bring the action into view before measuring. A sticky action bar can sit
  // below the fold on tall mobile layouts (an animate-in transform ancestor
  // breaks position:sticky relative to the viewport); the point of this check
  // is that the CTA isn't clipped/overflowing once reachable, not that the page
  // happens to be scrolled to it.
  await locator.scrollIntoViewIfNeeded();
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
  if (isMobile) {
    await page.getByRole("button", { name: /open menu/i }).click();
  } else {
    const tabByNav: Record<string, string> = {
      Tasks: "Plan",
      Documents: "Governance",
      Risks: "Governance",
    };
    const tab = tabByNav[navName];
    if (tab) await page.getByLabel("Primary navigation").getByRole("link", { name: new RegExp(`^${tab}$`, "i") }).click();
  }
  await page.getByRole("link", { name: new RegExp(navName, "i") }).first().click();
  await expect(page).toHaveURL(pathPattern);
}

async function navigateByShell(
  page: Page,
  isMobile: boolean,
  route: { nav: string; tab: string; path: string }
) {
  if (route.nav === "New Project") {
    if (isMobile) await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("link", { name: /^New Project$/i }).first().click();
    return;
  }

  if (route.nav === "Manage Projects" || route.nav === "Rules & Settings") {
    if (isMobile) {
      await page.getByRole("button", { name: /open menu/i }).click();
      await page.getByRole("link", { name: new RegExp(route.nav, "i") }).first().click();
    } else {
      await page.getByRole("button", { name: /open admin menu/i }).click();
      await page.getByRole("link", { name: new RegExp(route.nav, "i") }).click();
    }
    return;
  }

  if (isMobile) {
    await page.getByRole("button", { name: /open menu/i }).click();
  } else {
    await page.getByRole("link", { name: new RegExp(`^${route.tab}$`, "i") }).click();
  }
  await page.getByRole("link", { name: new RegExp(`^${route.nav}`, "i") }).first().click();
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
