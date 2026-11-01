import {createInstance,dismissInstance,ensureScheduledInstances} from "./engine";
import {scheduleRecurringForDate} from "./scheduler";
import {targetForDate} from "../../lib/habitV2";

describe("CBE 3.1 habit definition reconciliation",()=>{
  test("current habit amount is canonical even when target history contains an older target",()=>{
    const habit={amount:10,targetHistory:[{effectiveDate:"2026-10-01",target:15,previousTarget:10}]};
    expect(targetForDate(habit,"2026-11-01")).toBe(10);
  });

  test("editing a current habit target reconciles the existing occurrence without resetting progress",()=>{
    const action={id:"meditation",name:"Meditation",scoringType:"per-unit",unit:"min"};
    const oldRule={id:"meditation-rule",actionId:"meditation",days:[0,1,2,3,4,5,6],frequency:"each",habit:{enabled:true,amount:10,unit:"min",targetHistory:[]}};
    const newRule={...oldRule,habit:{...oldRule.habit,amount:15}};
    let state=scheduleRecurringForDate([],[oldRule],[action],"2026-11-01");
    expect(state[0].target).toBe(10);
    state[0]={...state[0],progress:4};
    state=scheduleRecurringForDate(state,[newRule],[action],"2026-11-01");
    expect(state).toHaveLength(1);
    expect(state[0].target).toBe(15);
    expect(state[0].progress).toBe(4);
  });

  test("editing a Habit target remains canonical when an occurrence already exists",()=>{
    const action={id:"meditation",name:"Meditation",scoringType:"per-unit",unit:"min"};
    const rule10={id:"meditation-rule",actionId:"meditation",days:[0,1,2,3,4,5,6],frequency:"each",habit:{enabled:true,amount:10,unit:"min"}};
    const rule15={...rule10,habit:{...rule10.habit,amount:15}};
    const first=scheduleRecurringForDate([],[rule10],[action],"2026-11-01");
    const second=scheduleRecurringForDate(first,[rule15],[action],"2026-11-01");
    expect(second).toHaveLength(1);
    expect(second[0].target).toBe(15);
    expect(second[0].recurringId).toBe("meditation-rule");
  });

  test("deleting and recreating a Habit for the same Action replaces stale terminal ownership",()=>{
    const action={id:"meditation",name:"Meditation",scoringType:"per-unit",unit:"min"};
    const oldRule={id:"old-meditation-rule",actionId:"meditation",days:[0,1,2,3,4,5,6],frequency:"each",habit:{enabled:true,amount:15,unit:"min"}};
    const newRule={id:"new-meditation-rule",actionId:"meditation",days:[0,1,2,3,4,5,6],frequency:"each",habit:{enabled:true,amount:10,unit:"min"}};
    let state=scheduleRecurringForDate([],[oldRule],[action],"2026-11-01");
    state=[dismissInstance(state[0],"test")];
    state=scheduleRecurringForDate(state,[newRule],[action],"2026-11-01");
    expect(state).toHaveLength(1);
    expect(state[0].recurringId).toBe("new-meditation-rule");
    expect(state[0].status).toBe("active");
    expect(state[0].target).toBe(10);
  });

  test("removed or disabled untouched recurring occurrence is unscheduled from today",()=>{
    const action={id:"meditation",name:"Meditation",scoringType:"per-unit",unit:"min"};
    const rule={id:"meditation-rule",actionId:"meditation",days:[0,1,2,3,4,5,6],frequency:"each",habit:{enabled:true,amount:15,unit:"min"}};
    let state=scheduleRecurringForDate([],[rule],[action],"2026-11-01");
    expect(state).toHaveLength(1);
    state=scheduleRecurringForDate(state,[],[action],"2026-11-01");
    expect(state).toHaveLength(0);
  });

  test("Core upsert uses canonical occurrence identity instead of a second local identity rule",()=>{
    const existing=createInstance({id:"old-id",date:"2026-11-01",actionId:"read",kind:"habit",mode:"quantity",target:10,recurringId:"old-rule"});
    const candidate=createInstance({id:"new-id",date:"2026-11-01",actionId:"read",kind:"habit",mode:"quantity",target:10,recurringId:"new-rule"});
    const result=ensureScheduledInstances([existing],[candidate]);
    expect(result).toHaveLength(1);
  });
});
