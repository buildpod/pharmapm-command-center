// Critical-chain-to-go-live tests. The product promise: tell the PM WHICH
// shifts threaten go-live and which are noise. These assert the binding chain
// is exactly the path that determines go-live's date — nothing more.

import { describe, it, expect } from "vitest";
import { criticalChainToGoLive, type CpTask, type CpMilestone } from "./critical-path";

describe("criticalChainToGoLive", () => {
  it("follows the latest (binding) task, ignores the earlier sibling", () => {
    // Go-live ← m1. m1 fed by t1 (late) and t2 (early). t1 binds, t2 has slack.
    const tasks: CpTask[] = [
      { id: "t1", dueDate: "2026-08-20", milestoneId: "m1" },
      { id: "t2", dueDate: "2026-07-01", milestoneId: "m1" },
    ];
    const milestones: CpMilestone[] = [
      { id: "m1", plannedDate: "2026-08-21" },
      { id: "gl", plannedDate: "2026-09-01", predecessor: "m1" },
    ];
    const r = criticalChainToGoLive({ tasks, milestones, goLiveMilestoneId: "gl" });
    expect(r.milestoneIds.has("gl")).toBe(true);
    expect(r.milestoneIds.has("m1")).toBe(true);
    expect(r.taskIds.has("t1")).toBe(true);   // binding
    expect(r.taskIds.has("t2")).toBe(false);  // slack — not critical
  });

  it("walks a task dependency chain, taking the latest upstream at each step", () => {
    const tasks: CpTask[] = [
      { id: "t1", dueDate: "2026-08-20", milestoneId: "m1" },
      { id: "t1a", dueDate: "2026-08-10", dependsOn: undefined },
      { id: "t1b", dueDate: "2026-08-15" },
    ];
    // t1 depends on t1a (early) and t1b (late) → t1b binds
    tasks[0].dependsOn = ["t1a", "t1b"];
    const milestones: CpMilestone[] = [
      { id: "m1", plannedDate: "2026-08-21" },
      { id: "gl", plannedDate: "2026-09-01", predecessor: "m1" },
    ];
    const r = criticalChainToGoLive({ tasks, milestones, goLiveMilestoneId: "gl" });
    expect(r.taskIds.has("t1")).toBe(true);
    expect(r.taskIds.has("t1b")).toBe(true);   // latest upstream binds
    expect(r.taskIds.has("t1a")).toBe(false);  // earlier upstream has slack
  });

  it("includes parallel critical paths when dates tie", () => {
    const tasks: CpTask[] = [
      { id: "t1", dueDate: "2026-08-20", milestoneId: "m1" },
      { id: "t2", dueDate: "2026-08-20", milestoneId: "m1" }, // tie → both critical
    ];
    const milestones: CpMilestone[] = [
      { id: "m1", plannedDate: "2026-08-21" },
      { id: "gl", plannedDate: "2026-09-01", predecessor: "m1" },
    ];
    const r = criticalChainToGoLive({ tasks, milestones, goLiveMilestoneId: "gl" });
    expect(r.taskIds.has("t1")).toBe(true);
    expect(r.taskIds.has("t2")).toBe(true);
  });

  it("follows a predecessor milestone when it binds over the linked task", () => {
    // gl ← m2 (predecessor, late) and a task t-late (earlier) → m2 chain binds
    const tasks: CpTask[] = [
      { id: "tx", dueDate: "2026-06-01", milestoneId: "gl" },
      { id: "ty", dueDate: "2026-08-25", milestoneId: "m2" },
    ];
    const milestones: CpMilestone[] = [
      { id: "m2", plannedDate: "2026-08-26" },
      { id: "gl", plannedDate: "2026-09-01", predecessor: "m2" },
    ];
    const r = criticalChainToGoLive({ tasks, milestones, goLiveMilestoneId: "gl" });
    expect(r.milestoneIds.has("m2")).toBe(true);  // predecessor binds
    expect(r.taskIds.has("ty")).toBe(true);       // and its driving task
    expect(r.taskIds.has("tx")).toBe(false);      // earlier go-live-linked task: slack
  });

  it("is cycle-safe and returns at least go-live itself", () => {
    const tasks: CpTask[] = [
      { id: "a", dueDate: "2026-08-01", dependsOn: ["b"], milestoneId: "gl" },
      { id: "b", dueDate: "2026-08-02", dependsOn: ["a"] }, // cycle a↔b
    ];
    const milestones: CpMilestone[] = [{ id: "gl", plannedDate: "2026-09-01" }];
    const r = criticalChainToGoLive({ tasks, milestones, goLiveMilestoneId: "gl" });
    expect(r.milestoneIds.has("gl")).toBe(true);
  });
});
