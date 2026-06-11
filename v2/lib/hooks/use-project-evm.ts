"use client";

// Phase-2 shared EVM wiring: ONE place computes the project's EVM snapshot so
// the dashboard verdict and Delivery Signals can never disagree about the
// number. Coverage-gated (no cost lines / no tasks → no snapshot, never a
// fabricated score) and status-date-clamped (frozen demo date never precedes
// a newer project's start).

import { useMemo } from "react";
import { budgetTrend } from "@/lib/mockData";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { computeProjectEvm, type ProjectEvm } from "@/lib/domain/evm-project";
import { evmCoverage, effectiveStatusDate, type EvmCoverage } from "@/lib/domain/evm-coverage";

// Frozen demo status date — matches DEFAULT_TRUTH_DATE in delivery-truth.
export const PROJECT_STATUS_DATE = "2026-05-19";

export interface ProjectEvmContext {
  coverage: EvmCoverage;
  evm: ProjectEvm | null;   // null when coverage is not ready
  statusDate: string;
}

export function useProjectEvm(): ProjectEvmContext {
  const { activeProjectId, activeProject } = useProject();
  const tasks = useEntityStore((s) => s.tasks);
  const costLines = useEntityStore((s) => s.costLines);

  return useMemo(() => {
    const projectTasks = tasks.filter((task) => task.projectId === activeProjectId);
    const projectCostLines = costLines.filter((line) => line.projectId === activeProjectId);
    const coverage = evmCoverage({ costLineCount: projectCostLines.length, taskCount: projectTasks.length });
    const statusDate = effectiveStatusDate(activeProject.startDate, PROJECT_STATUS_DATE);
    const evm = coverage.ready
      ? computeProjectEvm({
          costLines: projectCostLines,
          plannedCurve: budgetTrend.map((point) => ({ month: point.month, planned: point.planned })),
          tasks: projectTasks,
          projectStart: activeProject.startDate,
          statusDate,
          curveYear: new Date(`${activeProject.startDate}T00:00:00`).getFullYear(),
        })
      : null;
    return { coverage, evm, statusDate };
  }, [activeProjectId, activeProject.startDate, tasks, costLines]);
}
