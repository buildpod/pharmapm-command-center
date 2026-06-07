import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3000";
const origin = process.env.PLAYWRIGHT_ORIGIN ?? `http://localhost:${port}`;
const appBase = "/pharmapm-command-center/v2";
const appURL = process.env.PLAYWRIGHT_BASE_URL ?? `${origin}${appBase}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  reporter: [
    ["list"],
    ["html", { outputFolder: "output/playwright-report", open: "never" }],
  ],
  use: {
    baseURL: origin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev:verified",
    url: `${appURL}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium-size",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
