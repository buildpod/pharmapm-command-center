// Coverage gate for the EVM-derived Executive Verdict (CX-1 fix-it).
//
// computeProjectEvm degrades gracefully on empty inputs (safeDiv falls back to
// 1), which means a project with NO cost lines reads as CPI 1 / SPI(t) 1 →
// "On track, 100/100". That is a fabricated score — the exact dark pattern the
// computed verdict exists to prevent, and freshly imported projects (tasks but
// no budget) hit it by default. This module decides whether the verdict may be
// shown at all, and what is missing when it may not.

export interface EvmCoverageInput {
  costLineCount: number;
  taskCount: number;
}

export interface EvmCoverage {
  ready: boolean;
  missing: string[];   // plain-language, e.g. ["budget lines", "tasks"]
}

export function evmCoverage(input: EvmCoverageInput): EvmCoverage {
  const missing: string[] = [];
  if (input.costLineCount === 0) missing.push("budget lines");
  if (input.taskCount === 0) missing.push("tasks");
  return { ready: missing.length === 0, missing };
}

// The dashboard uses a frozen demo status date (matches DEFAULT_TRUTH_DATE
// convention). For projects created AFTER that date (imports, new setups) the
// frozen date precedes projectStart and degenerates the schedule math
// (AT ≤ 0 → SPI(t) falls back to 1). Clamp the status date so it is never
// before the project's own start.
export function effectiveStatusDate(projectStart: string, demoStatusDate: string): string {
  return projectStart > demoStatusDate ? projectStart : demoStatusDate;
}
