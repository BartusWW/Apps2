import { COMMAND, executeCommand } from "./commands";
import { createInstance, INSTANCE_STATUS } from "./engine";
import { DAY_CLOSE_SOURCE } from "./dayClose";

const stateWith = instance => ({ schemaVersion: 3, instances: [instance], closedDays: {} });

describe("CBE v3 command boundary", () => {
  test("LOG is capped and terminal completion ignores later logs", () => {
    const task = createInstance({ date: "2026-10-31", actionId: "clean", target: 2 });
    let state = stateWith(task);
    state = executeCommand(state, { type: COMMAND.LOG, instanceId: task.id, amount: 1, at: "t1" });
    state = executeCommand(state, { type: COMMAND.LOG, instanceId: task.id, amount: 99, at: "t2" });
    expect(state.instances[0].progress).toBe(2);
    expect(state.instances[0].status).toBe(INSTANCE_STATUS.COMPLETED);
    const completed = state.instances[0];
    state = executeCommand(state, { type: COMMAND.LOG, instanceId: task.id, amount: 1, at: "t3" });
    expect(state.instances[0]).toEqual(completed);
  });

  test("COMPLETE finishes only an active occurrence", () => {
    const task = createInstance({ date: "2026-10-31", actionId: "clean", target: 3 });
    const state = executeCommand(stateWith(task), { type: COMMAND.COMPLETE, instanceId: task.id, at: "done" });
    expect(state.instances[0].progress).toBe(3);
    expect(state.instances[0].status).toBe(INSTANCE_STATUS.COMPLETED);
  });

  test("DISMISS is durable terminal state", () => {
    const task = createInstance({ date: "2026-10-31", actionId: "clean" });
    let state = executeCommand(stateWith(task), { type: COMMAND.DISMISS, instanceId: task.id, reason: "not-today", at: "x" });
    expect(state.instances[0].status).toBe(INSTANCE_STATUS.DISMISSED);
    const dismissed = state.instances[0];
    state = executeCommand(state, { type: COMMAND.COMPLETE, instanceId: task.id, at: "later" });
    expect(state.instances[0]).toEqual(dismissed);
  });

  test("CLOSE_DAY uses unified lifecycle and records source", () => {
    const habit = createInstance({ date: "2026-10-31", actionId: "read", kind: "habit" });
    const state = executeCommand(stateWith(habit), {
      type: COMMAND.CLOSE_DAY,
      date: "2026-10-31",
      source: DAY_CLOSE_SOURCE.AUTO,
      at: "midnight",
    });
    expect(state.closedDays["2026-10-31"].source).toBe(DAY_CLOSE_SOURCE.AUTO);
    expect(state.instances.find(x => x.id === habit.id).status).toBe(INSTANCE_STATUS.MISSED);
    expect(state.instances.filter(x => x.secondChanceFor === habit.id)).toHaveLength(1);
  });

  test("unknown instance cannot silently create or mutate state", () => {
    expect(() => executeCommand({ instances: [] }, {
      type: COMMAND.LOG,
      instanceId: "missing",
      amount: 1,
    })).toThrow("instance not found");
  });
});
