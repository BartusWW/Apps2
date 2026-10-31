import { describe, expect, it } from "vitest";
import { legacyPlanToInstances } from "./legacyAdapter";
import { compareExecutionShadow } from "./shadowCompare";

const date = "2026-10-31";
const actions = [{ id: "clean", name: "Cleaning", scoringType: "fixed" }];
const dailyPlans = { [date]: { items: [{ id: "item-1", actionId: "clean", name: "Cleaning", stackCount: 2, stackDone: 1, status: "planned" }] } };

function stateFromLegacy() {
  return { schemaVersion: 3, instances: legacyPlanToInstances(dailyPlans, actions) };
}

describe("CBE v3 shadow comparison", () => {
  it("reports a match for equivalent v2 and v3 execution", () => {
    const result = compareExecutionShadow({ date, dailyPlans, actions, v3State: stateFromLegacy() });
    expect(result.match).toBe(true);
    expect(result.differences).toEqual([]);
  });

  it("reports progress/status drift instead of hiding it", () => {
    const v3State = stateFromLegacy();
    v3State.instances[0] = { ...v3State.instances[0], progress: 2, status: "completed" };
    const result = compareExecutionShadow({ date, dailyPlans, actions, v3State });
    expect(result.match).toBe(false);
    expect(result.differences[0].type).toBe("mismatch");
    expect(result.differences[0].fields).toEqual(expect.arrayContaining(["status", "progress"]));
  });

  it("reports missing v3 occurrences", () => {
    const result = compareExecutionShadow({ date, dailyPlans, actions, v3State: { instances: [] } });
    expect(result.match).toBe(false);
    expect(result.differences[0].type).toBe("missing-v3");
  });
});
