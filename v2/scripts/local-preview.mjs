import { existsSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn } from "node:child_process";

const PORT = 3000;
const BASE_PATH = "/pharmapm-command-center/v2";
const APP_URL = `http://localhost:${PORT}${BASE_PATH}/`;
const CSS_URL = `http://localhost:${PORT}${BASE_PATH}/_next/static/css/app/layout.css`;
const JS_URL = `http://localhost:${PORT}${BASE_PATH}/_next/static/chunks/main-app.js`;

function moveNextCache() {
  const cachePath = join(process.cwd(), ".next");
  if (!existsSync(cachePath)) return "No .next cache found.";

  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const target = join(tmpdir(), `pharmapm-command-center-next-stale-${stamp}`);
  renameSync(cachePath, target);
  return `Moved .next cache to ${target}`;
}

async function probe(url, expectedType, method = "GET") {
  try {
    const response = await fetch(url, { method });
    const contentType = response.headers.get("content-type") ?? "";
    return {
      ok: response.status === 200 && (!expectedType || contentType.includes(expectedType)),
      status: response.status,
      contentType,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: "",
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkHealth() {
  const page = await probe(APP_URL, "text/html", "HEAD");
  const css = await probe(CSS_URL, "text/css");
  const js = await probe(JS_URL, "application/javascript");
  return { page, css, js, healthy: page.ok && css.ok && js.ok };
}

function formatProbe(name, result) {
  const status = result.ok ? "ok" : "fail";
  const detail = result.error ? result.error : `${result.status} ${result.contentType}`.trim();
  return `${status.padEnd(4)} ${name.padEnd(4)} ${detail}`;
}

async function printHealth() {
  const health = await checkHealth();
  console.log(formatProbe("page", health.page));
  console.log(formatProbe("css", health.css));
  console.log(formatProbe("js", health.js));
  console.log("");

  if (health.healthy) {
    console.log(`Ready: ${APP_URL}`);
    return true;
  }

  console.log(`Not ready: ${APP_URL}`);
  return false;
}

async function waitForHealthy(timeoutMs = 45_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const health = await checkHealth();
    if (health.healthy) return health;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  return checkHealth();
}

function output(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function repoListenersOnPort() {
  const pids = output("lsof", ["-ti", `:${PORT}`])
    .split("\n")
    .map((pid) => pid.trim())
    .filter(Boolean);

  return pids.filter((pid) => output("lsof", ["-p", pid]).includes(process.cwd()));
}

async function stopRepoListeners() {
  const pids = repoListenersOnPort();
  if (!pids.length) return;

  console.log(`Stopping stale ${process.cwd()} listener${pids.length === 1 ? "" : "s"} on port ${PORT}: ${pids.join(", ")}`);
  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      // Ignore processes that have already exited.
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}

async function startVerified() {
  const existing = await checkHealth();
  if (existing.healthy) {
    console.log(`Existing verified server is already ready: ${APP_URL}`);
    return;
  }

  await stopRepoListeners();
  console.log(moveNextCache());
  const child = spawn("pnpm", ["exec", "next", "dev", "-p", String(PORT)], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  const health = await waitForHealthy();
  if (health.healthy) {
    console.log("");
    console.log(`Verified local app: ${APP_URL}`);
    console.log("Keep this terminal running while testing.");
    return;
  }

  child.kill();
  console.error("");
  console.error("Could not verify local app after starting dev server.");
  console.error(formatProbe("page", health.page));
  console.error(formatProbe("css", health.css));
  console.error(formatProbe("js", health.js));
  process.exit(1);
}

const command = process.argv[2] ?? "doctor";

if (command === "doctor" || command === "check") {
  const healthy = await printHealth();
  process.exit(healthy ? 0 : 1);
}

if (command === "start") {
  await startVerified();
} else {
  console.error("Usage: node scripts/local-preview.mjs [doctor|start]");
  process.exit(2);
}
