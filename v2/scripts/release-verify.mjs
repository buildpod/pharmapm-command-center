import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const checks = [
  {
    id: "unit",
    label: "Unit and domain tests",
    command: "pnpm",
    args: ["test"],
    impact: "Core calculations, stores, import mapping, and shared UI helpers remain stable.",
  },
  {
    id: "build",
    label: "Production build",
    command: "pnpm",
    args: ["build"],
    impact: "Next.js routes compile, type-check, and static pages can be generated for GitHub Pages.",
  },
  {
    id: "ui-regression",
    label: "Browser UI regression",
    command: "pnpm",
    args: ["ui:regression"],
    impact: "Desktop and mobile flows load, navigate, open modals, expose actions, and keep key flows usable.",
  },
];

const startedAt = new Date();
const outputDir = join(process.cwd(), "output", "release-checks");
mkdirSync(outputDir, { recursive: true });

function runCheck(check) {
  const start = Date.now();
  console.log(`\n> ${check.label}`);
  console.log(`  ${check.command} ${check.args.join(" ")}`);

  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? "1" },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const durationMs = Date.now() - start;
  const passed = result.status === 0;
  console.log(`${passed ? "PASS" : "FAIL"} ${check.label} in ${(durationMs / 1000).toFixed(1)}s`);

  return {
    id: check.id,
    label: check.label,
    command: `${check.command} ${check.args.join(" ")}`,
    impact: check.impact,
    status: passed ? "passed" : "failed",
    exitCode: result.status,
    durationMs,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

const results = checks.map(runCheck);
const failed = results.filter((result) => result.status === "failed");
const finishedAt = new Date();

const report = {
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  durationMs: finishedAt.getTime() - startedAt.getTime(),
  status: failed.length ? "failed" : "passed",
  checks: results,
};

const jsonPath = join(outputDir, "latest.json");
const markdownPath = join(outputDir, "latest.md");

writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  markdownPath,
  [
    "# Release Verification Report",
    "",
    `Status: **${report.status.toUpperCase()}**`,
    `Started: ${report.startedAt}`,
    `Finished: ${report.finishedAt}`,
    `Duration: ${(report.durationMs / 1000).toFixed(1)}s`,
    "",
    "## Checks",
    "",
    ...results.flatMap((result) => [
      `### ${result.status === "passed" ? "Passed" : "Failed"}: ${result.label}`,
      "",
      `Command: \`${result.command}\``,
      `Impact: ${result.impact}`,
      `Duration: ${(result.durationMs / 1000).toFixed(1)}s`,
      result.status === "failed"
        ? [
            "",
            "Failure evidence:",
            "",
            "```text",
            `${result.stderr || result.stdout}`.trim().slice(-6000),
            "```",
          ].join("\n")
        : "",
      "",
    ]),
    "## Triage Rule",
    "",
    "Do not patch from the first visible symptom. Read this full report, group failures by shared component or route, patch the smallest shared cause, then rerun `pnpm release:verify`.",
    "",
  ].join("\n")
);

console.log("\nRelease verification summary");
for (const result of results) {
  console.log(`- ${result.status.padEnd(6)} ${result.label}`);
}
console.log(`\nReport: ${markdownPath}`);
console.log(`JSON:   ${jsonPath}`);

if (failed.length) {
  console.error(`\n${failed.length} release check${failed.length === 1 ? "" : "s"} failed. Patch by shared cause, then rerun the full gate.`);
  process.exit(1);
}

console.log("\nAll release checks passed. This build is ready for commit/push review.");
