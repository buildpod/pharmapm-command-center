import { readFileSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_PATH = "/pharmapm-command-center/v2";
const BASE_URL = process.env.APP_URL ?? `http://localhost:${PORT}${BASE_PATH}`;

const routes = [
  "/",
  "/charter/",
  "/milestones/",
  "/tasks/",
  "/risks/",
  "/documents/",
  "/costs/",
  "/reports/",
  "/projects/",
  "/setup/",
];

const sourceChecks = [
  {
    name: "drawer uses dynamic viewport height",
    file: "app/styles/components.css",
    mustInclude: ["height: 100dvh", "max-height: 100dvh"],
  },
  {
    name: "drawer footer has safe bottom padding",
    file: "app/styles/components.css",
    mustInclude: ["padding-bottom: max(var(--space-3), env(safe-area-inset-bottom))"],
  },
  {
    name: "cost line form uses wide modal chrome",
    file: "components/costs/cost-line-form.tsx",
    mustInclude: ['variant="modal"'],
  },
];

async function probeRoute(route) {
  const url = `${BASE_URL}${route}`;
  try {
    const response = await fetch(url, { method: "GET" });
    const contentType = response.headers.get("content-type") ?? "";
    return {
      route,
      ok: response.status === 200 && contentType.includes("text/html"),
      detail: `${response.status} ${contentType}`.trim(),
    };
  } catch (error) {
    return {
      route,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function runSourceChecks() {
  return sourceChecks.map((check) => {
    const body = readFileSync(join(process.cwd(), check.file), "utf8");
    const missing = check.mustInclude.filter((needle) => !body.includes(needle));
    return {
      name: check.name,
      ok: missing.length === 0,
      detail: missing.length ? `missing ${missing.join(", ")}` : "ok",
    };
  });
}

function printResult(ok, label, detail) {
  console.log(`${ok ? "ok  " : "fail"} ${label} ${detail}`);
}

const routeResults = await Promise.all(routes.map(probeRoute));
const sourceResults = runSourceChecks();

console.log("Route health");
for (const result of routeResults) {
  printResult(result.ok, result.route.padEnd(14), result.detail);
}

console.log("");
console.log("UI source guards");
for (const result of sourceResults) {
  printResult(result.ok, result.name.padEnd(38), result.detail);
}

console.log("");
console.log("Note: this catches route availability and known source-level layout guards.");
console.log("For real pixel/layout regression, add Playwright and screenshot assertions.");

const failed = [...routeResults, ...sourceResults].some((result) => !result.ok);
process.exit(failed ? 1 : 0);
