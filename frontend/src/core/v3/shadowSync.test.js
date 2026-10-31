import { createInstance, dismissInstance, INSTANCE_STATUS } from "./engine";
import { syncLegacyShadow } from "./shadowSync";

const actions = [{ id:"clean", name:"Cleaning", scoringType:"fixed" }];
const legacy = (status="planned", stackDone=0) => ({
  "2026-10-31": { items:[{ id:"legacy-clean", actionId:"clean", name:"Cleaning", status, stackCount:2, stackDone }] },
});

describe("CBE v3 shadow sync", () => {
  test("adds a newly observed legacy occurrence", () => {
    const next = syncLegacyShadow({ instances:[] }, { dailyPlans:legacy(), actions });
    expect(next.instances).toHaveLength(1);
    expect(next.instances[0].actionId).toBe("clean");
  });

  test("advances active progress from legacy", () => {
    const base = createInstance({ id:"legacy::2026-10-31::legacy-clean", date:"2026-10-31", actionId:"clean", name:"Cleaning", target:2, metadata:{legacyItemId:"legacy-clean"} });
    const next = syncLegacyShadow({ instances:[base] }, { dailyPlans:legacy("planned", 1), actions });
    expect(next.instances[0].progress).toBe(1);
  });

  test("never reopens a dismissed v3 occurrence", () => {
    const base = createInstance({ id:"legacy::2026-10-31::legacy-clean", date:"2026-10-31", actionId:"clean", name:"Cleaning", target:2, metadata:{legacyItemId:"legacy-clean"} });
    const dismissed = dismissInstance(base, "t", "user");
    const next = syncLegacyShadow({ instances:[dismissed] }, { dailyPlans:legacy("planned", 1), actions });
    expect(next.instances[0].status).toBe(INSTANCE_STATUS.DISMISSED);
    expect(next.instances[0].progress).toBe(0);
  });

  test("legacy completion may terminally advance an active v3 occurrence", () => {
    const base = createInstance({ id:"legacy::2026-10-31::legacy-clean", date:"2026-10-31", actionId:"clean", name:"Cleaning", target:2, metadata:{legacyItemId:"legacy-clean"} });
    const next = syncLegacyShadow({ instances:[base] }, { dailyPlans:legacy("done", 2), actions });
    expect(next.instances[0].status).toBe(INSTANCE_STATUS.COMPLETED);
    expect(next.instances[0].progress).toBe(2);
  });
});
