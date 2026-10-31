import { appendExecutionEntry, buildExecutionEntry, executionEffectId } from "./scoringBridge";

const instance = { id: "2026-10-31::cleaning", date: "2026-10-31", actionId: "cleaning", name: "Cleaning", mode: "quantity", unit: "min" };
const action = { id: "cleaning", name: "Cleaning", category: "Life / Systems", scoringType: "per-unit", pointsPerUnit: 0.35, unit: "min", type: "positive" };

test("uses stable command + instance identity for scoring effect", () => {
  expect(executionEffectId({ instanceId: instance.id, commandId: "cmd-1" }))
    .toBe("v3-effect::2026-10-31::cleaning::cmd-1");
});

test("builds a legacy-compatible quantity entry", () => {
  const entry = buildExecutionEntry({ instance, action, amount: 10, commandId: "cmd-1", at: "2026-10-31T16:30:00.000Z" });
  expect(entry.quantity).toBe(10);
  expect(entry.points).toBe(3.5);
  expect(entry.source).toBe("cbe-v3");
  expect(entry.v3InstanceId).toBe(instance.id);
});

test("same effect cannot award CBE twice", () => {
  const first = appendExecutionEntry([], { instance, action, amount: 10, commandId: "cmd-1" });
  const second = appendExecutionEntry(first.entries, { instance, action, amount: 10, commandId: "cmd-1" });
  expect(first.duplicate).toBe(false);
  expect(second.duplicate).toBe(true);
  expect(second.entries).toHaveLength(1);
  expect(second.entries[0].points).toBe(3.5);
});

test("a different command may create a second legitimate log", () => {
  const first = appendExecutionEntry([], { instance, action, amount: 10, commandId: "cmd-1" });
  const second = appendExecutionEntry(first.entries, { instance, action, amount: 5, commandId: "cmd-2" });
  expect(second.entries).toHaveLength(2);
  expect(second.entries.reduce((sum, x) => sum + x.points, 0)).toBe(5.3);
});
