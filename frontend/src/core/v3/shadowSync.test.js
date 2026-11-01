import { closeDay, createInstance, INSTANCE_STATUS, selectDay } from "./engine";
import { ingestLegacyOccurrences } from "./shadowSync";

const action={id:"read",name:"Read",scoringType:"per-unit",unit:"pages"};
const planItem={id:"legacy-read",actionId:"read",name:"Read",habit:true,recurringId:"habit-read",habitAmount:10,habitUnit:"pages",status:"planned"};

describe("CBE 3.1 planning ingress identity",()=>{
  test("legacy projection cannot duplicate a Core recurring occurrence",()=>{
    const recurring=createInstance({id:"2026-11-01::read::recurring:habit-read",date:"2026-11-01",actionId:"read",name:"Read",kind:"habit",mode:"quantity",target:10,unit:"pages",recurringId:"habit-read",source:"recurring",metadata:{allowOverdelivery:true}});
    const state=ingestLegacyOccurrences({instances:[recurring],closedDays:{}},{dailyPlans:{"2026-11-01":{items:[planItem]}},actions:[action]});
    expect(selectDay(state.instances,"2026-11-01")).toHaveLength(1);
    expect(state.instances[0].source).toBe("recurring");
  });

  test("existing duplicate recurring projections are collapsed before day close and create one Second Chance",()=>{
    const recurring=createInstance({id:"core-read",date:"2026-11-01",actionId:"read",name:"Read",kind:"habit",mode:"quantity",target:10,unit:"pages",recurringId:"habit-read",source:"recurring",metadata:{allowOverdelivery:true}});
    const legacy={...createInstance({id:"legacy-read",date:"2026-11-01",actionId:"read",name:"Read",kind:"habit",mode:"quantity",target:10,unit:"pages",recurringId:"habit-read",source:"legacy-v2",metadata:{legacyItemId:"legacy-read",allowOverdelivery:true}}),status:INSTANCE_STATUS.ACTIVE};
    const normalized=ingestLegacyOccurrences({instances:[recurring,legacy],closedDays:{}},{dailyPlans:{},actions:[action]});
    expect(selectDay(normalized.instances,"2026-11-01")).toHaveLength(1);
    const closed=closeDay(normalized.instances,"2026-11-01","2026-11-02","close");
    const next=selectDay(closed,"2026-11-02");
    expect(next).toHaveLength(1);
    expect(next[0].source).toBe("second-chance");
    expect(next[0].target).toBe(20);
  });
});
