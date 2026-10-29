import {useEffect} from "react";
import {useApp} from "../context/AppContext";
import {normalizeAmbition} from "../lib/ambition";

const bonusKey=(planItemId,tier)=>`stack-ambition:${planItemId}:${tier}`;

/**
 * Reconciles Ambition bonuses for fixed Actions against finished stacks.
 * The bonus is a derived ledger entry: it appears once while the threshold
 * is satisfied and is removed again if the stack is reset below the threshold.
 */
export default function StackAmbitionRuntime(){
  const {dailyPlans,actions,entries,logActivity,deleteEntry}=useApp();

  useEffect(()=>{
    if(!dailyPlans||!actions?.length)return;
    const actionMap=Object.fromEntries(actions.map(a=>[a.id,a]));
    const entryByKey=new Map(
      (entries||[]).filter(e=>e?.ambitionBonus&&e?.ambitionKey).map(e=>[e.ambitionKey,e])
    );
    const wanted=new Map();

    Object.entries(dailyPlans).forEach(([date,plan])=>{
      (Array.isArray(plan?.items)?plan.items:[]).forEach(item=>{
        const action=actionMap[item.actionId];
        if(!action||action.scoringType==="per-unit")return;
        const ambition=normalizeAmbition(action.ambition);
        if(!ambition.enabled)return;
        const done=Math.max(0,Number(item.stackDone)||0);
        const tiers=[
          {id:"ambitious",target:ambition.ambitiousTarget,bonus:ambition.ambitiousBonus},
          {id:"very-ambitious",target:ambition.veryAmbitiousTarget,bonus:ambition.veryAmbitiousBonus},
        ];
        tiers.forEach(t=>{
          if(!(t.target>0)||!(t.bonus>0)||done<t.target)return;
          const key=bonusKey(item.id,t.id);
          wanted.set(key,{key,date,item,action,t});
        });
      });
    });

    // Remove stale derived bonuses after a reset/reduction below a threshold.
    entryByKey.forEach((entry,key)=>{
      if(key.startsWith("stack-ambition:")&&!wanted.has(key))deleteEntry(entry.id);
    });

    // Award newly crossed thresholds exactly once.
    wanted.forEach(({key,date,item,action,t})=>{
      if(entryByKey.has(key))return;
      logActivity({
        actionId:item.actionId,
        actionName:item.name||action.name,
        category:item.category||action.category,
        subcategory:item.subcategory||action.subcategory||null,
        type:"positive",
        minutes:0,
        points:Number(t.bonus)||0,
        date,
        quantity:0,
        planItemId:item.id,
        scoringType:"ambition-bonus",
        ambitionBonus:true,
        ambitionTier:t.id,
        ambitionKey:key,
        source:"ambition",
        stackAmbition:true,
      });
    });
  },[dailyPlans,actions,entries,logActivity,deleteEntry]);

  return null;
}
