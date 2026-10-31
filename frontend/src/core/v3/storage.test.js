import { applyExecution, createInstance, dismissInstance } from "./engine";
import { closeExecutionDay } from "./dayClose";
import { bootstrapV3State, loadV3State, saveV3State, V3_STATE_KEY } from "./storage";
import { scheduleRecurringForDate } from "./scheduler";

const memoryStorage = () => {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
  };
};

describe("CBE v3 persistence", () => {
  test("completed recurring occurrence stays completed after reload and scheduler rerun", () => {
    const storage = memoryStorage(), date = "2026-10-31";
    const rule = { id:"clean", actionId:"cleaning", schedule:"daily", target:2 };
    const action = { id:"cleaning", name:"Cleaning", scoringType:"fixed" };
    let instances = scheduleRecurringForDate([], [rule], [action], date);
    instances[0] = applyExecution(applyExecution(instances[0]));
    saveV3State({ instances, migratedAt:"x" }, storage, "t1");
    const loaded = loadV3State(storage);
    const rerun = scheduleRecurringForDate(loaded.instances, [rule], [action], date);
    expect(rerun).toHaveLength(1);
    expect(rerun[0].status).toBe("completed");
  });

  test("dismissed recurring occurrence is not resurrected after reload", () => {
    const storage = memoryStorage(), date = "2026-10-31";
    const rule = { id:"clean", actionId:"cleaning", schedule:"daily" };
    const action = { id:"cleaning", name:"Cleaning", scoringType:"fixed" };
    let instances = scheduleRecurringForDate([], [rule], [action], date);
    instances[0] = dismissInstance(instances[0], "t", "user-dismissed");
    saveV3State({ instances, migratedAt:"x" }, storage, "t1");
    const rerun = scheduleRecurringForDate(loadV3State(storage).instances, [rule], [action], date);
    expect(rerun).toHaveLength(1);
    expect(rerun[0].status).toBe("dismissed");
  });

  test("bootstrap from legacy happens once only", () => {
    const storage = memoryStorage();
    const legacy = { "2026-10-31": { items:[{ id:"a", actionId:"x", name:"X", status:"planned" }] } };
    const actions = [{ id:"x", name:"X", scoringType:"fixed" }];
    const first = bootstrapV3State({ dailyPlans:legacy, actions, storage, at:"first" });
    expect(first.instances).toHaveLength(1);
    const changedLegacy = { "2026-10-31": { items:[...legacy["2026-10-31"].items,{ id:"b", actionId:"y", name:"Y" }] } };
    const second = bootstrapV3State({ dailyPlans:changedLegacy, actions:[...actions,{id:"y",scoringType:"fixed"}], storage, at:"second" });
    expect(second.instances).toHaveLength(1);
    expect(JSON.parse(storage.getItem(V3_STATE_KEY)).migratedAt).toBe("first");
  });

  test("closed day ledger survives reload and prevents a second recovery", () => {
    const storage = memoryStorage();
    const habit = createInstance({ date:"2026-10-31", actionId:"read", name:"Read", kind:"habit", target:1 });
    const closed = closeExecutionDay({ instances:[habit], closedDays:{} }, { date:"2026-10-31", at:"close-1" });
    saveV3State(closed, storage, "save-1");
    const loaded = loadV3State(storage);
    expect(loaded.closedDays["2026-10-31"]).toBeTruthy();
    const closedAgain = closeExecutionDay(loaded, { date:"2026-10-31", at:"close-2" });
    expect(closedAgain.instances.filter(x => x.source === "second-chance")).toHaveLength(1);
  });
});
