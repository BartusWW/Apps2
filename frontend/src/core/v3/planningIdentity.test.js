import { legacyPlanToInstances } from "./legacyAdapter";
import { ingestLegacyOccurrences } from "./shadowSync";

describe("CBE 3.1 planning identity",()=>{
  const action={id:"ruck",name:"Ruck",scoringType:"per-unit",unit:"km",pointsPerUnit:2};
  const manualPlan={"2026-11-01":{items:[{id:"manual-ruck",actionId:"ruck",name:"Ruck",habit:true,habitAmount:15,habitUnit:"km",status:"planned"}]}};

  test("manual per-unit LOG is a task, not a habit",()=>{
    const [item]=legacyPlanToInstances(manualPlan,[action]);
    expect(item.mode).toBe("quantity");
    expect(item.kind).toBe("task");
    expect(item.target).toBe(15);
  });

  test("recurring-owned legacy habit keeps habit identity",()=>{
    const plans={"2026-11-01":{items:[{id:"habit-ruck",actionId:"ruck",name:"Ruck",habit:true,recurringId:"r-ruck",habitAmount:15,habitUnit:"km",status:"planned"}]}};
    const [item]=legacyPlanToInstances(plans,[action]);
    expect(item.kind).toBe("habit");
    expect(item.recurringId).toBe("r-ruck");
  });

  test("planning ingress repairs already materialized false-habit identity without resetting progress",()=>{
    const existing={...legacyPlanToInstances(manualPlan,[action])[0],kind:"habit",progress:7};
    const state=ingestLegacyOccurrences({instances:[existing],closedDays:{}},{dailyPlans:manualPlan,actions:[action]});
    expect(state.instances[0].kind).toBe("task");
    expect(state.instances[0].mode).toBe("quantity");
    expect(state.instances[0].progress).toBe(7);
    expect(state.instances[0].target).toBe(15);
  });

  test("weekly quantity occurrence uses its weekly target and aggregates the whole week",()=>{
    const plans={"2026-11-04":{items:[{id:"weekly-ruck",actionId:"ruck",name:"Ruck",weeklyAction:true,weeklyFocusWeek:"2026-11-02",habitAmount:15,habitUnit:"km",status:"planned"}]}};
    const entries=[{date:"2026-11-02",actionId:"ruck",quantity:6,points:12},{date:"2026-11-03",actionId:"ruck",quantity:5,points:10}];
    const [item]=legacyPlanToInstances(plans,[action],entries);
    expect(item.target).toBe(15);
    expect(item.progress).toBe(11);
    expect(item.metadata.executionScope).toBe("weekly");
    expect(item.metadata.allowOverdelivery).toBe(true);
  });

  test("weekly fixed occurrence uses completion count and stays overdeliverable after base",()=>{
    const fixed={id:"publish",name:"Publish",scoringType:"fixed",points:10};
    const plans={"2026-11-04":{items:[{id:"weekly-publish",actionId:"publish",name:"Publish",weeklyAction:true,weeklyFocusWeek:"2026-11-02",stackCount:2,status:"planned"}]}};
    const entries=[{date:"2026-11-02",actionId:"publish",points:10,stack:true},{date:"2026-11-03",actionId:"publish",points:10,stack:true}];
    const [item]=legacyPlanToInstances(plans,[fixed],entries);
    expect(item.target).toBe(2);
    expect(item.progress).toBe(2);
    expect(item.status).toBe("active");
    expect(item.metadata.allowOverdelivery).toBe(true);
  });
});
