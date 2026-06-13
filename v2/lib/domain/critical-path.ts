// Impact Engine — critical chain to go-live (IMPACT_ENGINE_SPEC.md step 2).
//
// After a date change cascades, many tasks and milestones shift. Most of them
// don't matter: they move but still have slack before go-live. Only the ones on
// the BINDING chain — the path whose dates actually determine when go-live can
// happen — threaten the commitment. This module finds that chain so the drawer
// can mark "these 3 shifts are why go-live moves; ignore the other 7."
//
// Method: a backward binding trace from go-live over the POST-CASCADE state.
// At each node we follow the driver with the latest date (the binding one):
//   • milestone → its predecessor milestone OR its latest linked task
//   • task      → its latest upstream dependency
// Ties (equal dates) follow ALL maxima — parallel critical paths are real.
//
// Pure domain module: no store/UI imports. Operates on already-cascaded dates.

import { compare } from "./dates";

export interface CpTask {
  id: string;
  dueDate: string;            // cascaded (post-edit) finish date
  dependsOn?: string[];
  milestoneId?: string;       // links the task to the milestone it feeds
}

export interface CpMilestone {
  id: string;
  plannedDate: string;        // projected (post-edit, unlocked) date
  predecessor?: string;       // upstream milestone id
}

export interface CriticalChain {
  taskIds: Set<string>;       // shifted tasks on the binding chain
  milestoneIds: Set<string>;  // milestones on the binding chain (incl. go-live)
}

// Returns the binding chain that determines the go-live milestone's date.
export function criticalChainToGoLive(args: {
  tasks: CpTask[];
  milestones: CpMilestone[];
  goLiveMilestoneId: string;
}): CriticalChain {
  const { tasks, milestones, goLiveMilestoneId } = args;
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const msById = new Map(milestones.map((m) => [m.id, m]));
  // milestoneId → tasks that feed it
  const tasksByMilestone = new Map<string, CpTask[]>();
  tasks.forEach((t) => {
    if (!t.milestoneId) return;
    const list = tasksByMilestone.get(t.milestoneId) ?? [];
    list.push(t);
    tasksByMilestone.set(t.milestoneId, list);
  });

  const taskIds = new Set<string>();
  const milestoneIds = new Set<string>();
  const visited = new Set<string>(); // "m:<id>" / "t:<id>" — cycle/diamond guard

  function latestDate(dates: string[]): string | null {
    if (dates.length === 0) return null;
    return dates.reduce((a, b) => (compare(a, b) >= 0 ? a : b));
  }

  function visitMilestone(id: string) {
    if (visited.has(`m:${id}`)) return;
    visited.add(`m:${id}`);
    const m = msById.get(id);
    if (!m) return;
    milestoneIds.add(id);

    // Candidate drivers: the predecessor milestone, and each linked task.
    const predDate = m.predecessor ? msById.get(m.predecessor)?.plannedDate : undefined;
    const linkedTasks = tasksByMilestone.get(id) ?? [];
    const candidateDates: string[] = [];
    if (predDate) candidateDates.push(predDate);
    linkedTasks.forEach((t) => candidateDates.push(t.dueDate));

    const binding = latestDate(candidateDates);
    if (binding == null) return;

    // Follow ALL drivers whose date equals the binding date (parallel paths).
    if (m.predecessor && predDate && compare(predDate, binding) === 0) {
      visitMilestone(m.predecessor);
    }
    linkedTasks
      .filter((t) => compare(t.dueDate, binding) === 0)
      .forEach((t) => visitTask(t.id));
  }

  function visitTask(id: string) {
    if (visited.has(`t:${id}`)) return;
    visited.add(`t:${id}`);
    const t = taskById.get(id);
    if (!t) return;
    taskIds.add(id);

    const deps = (t.dependsOn ?? [])
      .map((depId) => taskById.get(depId))
      .filter((d): d is CpTask => !!d);
    const binding = latestDate(deps.map((d) => d.dueDate));
    if (binding == null) return;
    deps
      .filter((d) => compare(d.dueDate, binding) === 0)
      .forEach((d) => visitTask(d.id));
  }

  visitMilestone(goLiveMilestoneId);
  return { taskIds, milestoneIds };
}
