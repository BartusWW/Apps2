import {
  INSTANCE_STATUS,
  applyExecution,
  closeDay,
  createInstance,
  dismissInstance,
  ensureScheduledInstances,
  remaining,
  selectDay,
} from "./engine";

describe("CBE Core v3 lifecycle invariants", () => {
  test("fixed recurring task has a hard ceiling and completes", () => {
    let task = createInstance({ date: "2026-10-31", actionId: "clean", recurringId: "r-clean", target: 2 });
    task = applyExecution(task, 1, "t1");
    expect(task.progress).toBe(1);
    expect(task.status).toBe(INSTANCE_STATUS.ACTIVE);
    task = applyExecution(task, 1, "t2");
    expect(task.progress).toBe(2);
    expect(task.status).toBe(INSTANCE_STATUS.COMPLETED);
    expect(remaining(task)).toBe(0);
    expect(applyExecution(task, 1, "t3")).toEqual(task);
  });

  test("quantity recurring completes at target and cannot over-log through core", () => {
    let task = createInstance({ date: "2026-10-31", actionId: "reels", recurringId: "r-reels", mode: "quantity", target: 60, unit: "reels" });
    task = applyExecution(task, 25);
    task = applyExecution(task, 35, "done");
    expect(task.progress).toBe(60);
    expect(task.status).toBe(INSTANCE_STATUS.COMPLETED);
    expect(applyExecution(task, 100).progress).toBe(60);
  });

  test("dismissed recurring occurrence stays dismissed after scheduler runs again", () => {
    const original = createInstance({ date: "2026-10-31", actionId: "clean", recurringId: "r-clean" });
    const dismissed = dismissInstance(original, "now");
    const regenerated = createInstance({ date: "2026-10-31", actionId: "clean", recurringId: "r-clean" });
    const result = ensureScheduledInstances([dismissed], [regenerated]);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(INSTANCE_STATUS.DISMISSED);
  });

  test("missed habit creates exactly one Second Chance next day", () => {
    const habit = createInstance({ date: "2026-10-31", actionId: "read", kind: "habit", target: 1 });
    let state = closeDay([habit], "2026-10-31", "2026-11-01", "close");
    state = closeDay(state, "2026-10-31", "2026-11-01", "close-again");
    const oldHabit = selectDay(state, "2026-10-31")[0];
    const next = selectDay(state, "2026-11-01");
    expect(oldHabit.status).toBe(INSTANCE_STATUS.MISSED);
    expect(next).toHaveLength(1);
    expect(next[0].source).toBe("second-chance");
    expect(next[0].secondChanceFor).toBe(oldHabit.id);
  });

  test("completed habit does not create Second Chance", () => {
    let habit = createInstance({ date: "2026-10-31", actionId: "read", kind: "habit" });
    habit = applyExecution(habit, 1, "done");
    const state = closeDay([habit], "2026-10-31", "2026-11-01", "close");
    expect(selectDay(state, "2026-11-01")).toHaveLength(0);
  });
});
