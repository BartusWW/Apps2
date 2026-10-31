import { COMMAND, executeCommand } from "./commands";
import { createInstance, INSTANCE_STATUS } from "./engine";
import { planExecutionEffect } from "./writeEffects";

const action = { id: "cleaning", name: "Cleaning", category: "Life / Systems", scoringType: "per-unit", pointsPerUnit: 0.35, unit: "min", type: "positive" };
const state = progress => ({ instances: [{ ...createInstance({ date: "2026-10-31", actionId: action.id, name: action.name, mode: "quantity", target: 30 }), progress }] });

test("scores only the progress Core actually accepted at the target ceiling", () => {
  const before = state(25);
  const command = { type: COMMAND.LOG, instanceId: before.instances[0].id, amount: 20, commandId: "cmd-ceiling", at: "2026-10-31T16:00:00.000Z" };
  const after = executeCommand(before, command);
  const effect = planExecutionEffect({ beforeState: before, afterState: after, command, actions: [action] });
  expect(after.instances[0].progress).toBe(30);
  expect(after.instances[0].status).toBe(INSTANCE_STATUS.COMPLETED);
  expect(effect.quantity).toBe(5);
  expect(effect.points).toBe(1.8);
});

test("terminal instance creates no scoring effect", () => {
  const active = state(30);
  active.instances[0].status = INSTANCE_STATUS.COMPLETED;
  const command = { type: COMMAND.LOG, instanceId: active.instances[0].id, amount: 10, commandId: "cmd-after-complete" };
  const after = executeCommand(active, command);
  expect(planExecutionEffect({ beforeState: active, afterState: after, command, actions: [action] })).toBeNull();
});

test("existing effect id suppresses retry award", () => {
  const before = state(0);
  const command = { type: COMMAND.LOG, instanceId: before.instances[0].id, amount: 10, commandId: "cmd-retry" };
  const after = executeCommand(before, command);
  const first = planExecutionEffect({ beforeState: before, afterState: after, command, actions: [action] });
  const retry = planExecutionEffect({ beforeState: before, afterState: after, command, actions: [action], entries: [first] });
  expect(first).not.toBeNull();
  expect(retry).toBeNull();
});
