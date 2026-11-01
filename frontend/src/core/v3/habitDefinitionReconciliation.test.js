import {createInstance,ensureScheduledInstances} from "./engine";
import {scheduleRecurringForDate} from "./scheduler";
import {targetForDate} from "../../lib/habitV2";

describe("CBE 3.1 habit definition reconciliation",()=>{
  test("current habit amount is canonical even when target history contains an older target",()=>{
    const habit={amount:10,targetHistory:[{effectiveDate:"2026-10-01",target:15,previousTarget:10}]};
    expect(targetForDate(habit,"2026-11-01")).toBe(10);
  });

  test("editing a current habit target reconciles the existing occurrence without resetting progress",()=>{
    const action={id:"meditation",name:"Meditation",scoringType:"per-unit",unit:"min"};
    const oldRule={id:"meditation-rule",actionId:"meditation",days:[0,1,2,3,4,5,6],frequency:"each",habit:{enabled:true,amount:15,unit:"min",targetHistory:[{effectiveDate:"2026-10-01",target:15}]}};
    const newRule={...oldRule,habit:{...oldRule.habit,amount:10}};
    let state=scheduleRecurringForDate([],[oldRule],[action],"2026-11-01");
    state[0]={...state[0],progress:4};
    state=scheduleRecurringForDate(state,[newRule],[action],"2026-11-01");
    expect(state).toHaveLength(1);
    expect(state[0].target).toBe(10);
    expect(state[0].progress).toBe(4);
  });

  test("Core upsert uses canonical occurrence identity instead of a second local identity rule",()=>{
    const existing=createInstance({id:"old-id",date:"2026-11-01",actionId:"read",kind:"habit",mode:"quantity",target:10,recurringId:"old-rule"});
    const candidate=createInstance({id:"new-id",date:"2026-11-01",actionId:"read",kind:"habit",mode:"quantity",target:10,recurringId:"new-rule"});
    const result=ensureScheduledInstances([existing],[candidate]);
    expect(result).toHaveLength(1);
  });
});
