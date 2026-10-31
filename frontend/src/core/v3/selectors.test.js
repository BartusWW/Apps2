import { applyExecution, createInstance, dismissInstance, markMissed } from "./engine";
import {
  selectDayExecutionSummary,
  selectExecutionDay,
  selectSecondChances,
  selectVisibleDay,
} from "./selectors";

describe("CBE v3 selectors", () => {
  test("dismissed occurrence is retained in state but hidden from execution UI", () => {
    const active = createInstance({ date: "2026-11-01", actionId: "a", name: "Active" });
    const removed = dismissInstance(createInstance({ date: "2026-11-01", actionId: "b", name: "Removed" }), "now");
    const state = { instances: [active, removed] };
    expect(state.instances).toHaveLength(2);
    expect(selectVisibleDay(state, "2026-11-01")).toHaveLength(1);
    expect(selectExecutionDay(state, "2026-11-01")[0].name).toBe("Active");
  });

  test("UI view derives completion and remaining from canonical instance", () => {
    let item = createInstance({ date: "2026-11-01", actionId: "clean", target: 3, recurringId: "r-clean" });
    item = applyExecution(item, 2);
    const view = selectExecutionDay({ instances: [item] }, "2026-11-01")[0];
    expect(view.progress).toBe(2);
    expect(view.remaining).toBe(1);
    expect(view.complete).toBe(false);
    expect(view.recurring).toBe(true);
  });

  test("summary excludes dismissed items from execution denominator", () => {
    let done = createInstance({ date: "2026-11-01", actionId: "done" });
    done = applyExecution(done, 1);
    const dismissed = dismissInstance(createInstance({ date: "2026-11-01", actionId: "drop" }));
    const summary = selectDayExecutionSummary({ instances: [done, dismissed] }, "2026-11-01");
    expect(summary.total).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.completionPct).toBe(100);
  });

  test("only active recovery is exposed as Second Chance", () => {
    const missed = markMissed(createInstance({ date: "2026-10-31", actionId: "read", kind: "habit" }));
    const activeRecovery = createInstance({ date: "2026-11-01", actionId: "read", kind: "habit-recovery", source: "second-chance", secondChanceFor: missed.id });
    const completedRecovery = applyExecution(createInstance({ date: "2026-11-01", actionId: "walk", kind: "habit-recovery", source: "second-chance", secondChanceFor: "old" }), 1);
    expect(selectSecondChances({ instances: [missed, activeRecovery, completedRecovery] }, "2026-11-01")).toEqual([activeRecovery]);
  });
});
