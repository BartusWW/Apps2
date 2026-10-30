import {useEffect} from "react";
import {useApp} from "../context/AppContext";
import {normalizeAmbition} from "../lib/ambition";
import {gatedAmbitionReward,liveExecutionScore} from "../lib/ambitionRewards";

const bonusKey=(planItemId,tier)=>`stack-ambition:${planItemId}:${tier}`;

/** Reconciles fixed-stack Ambition rewards with live Daily Execution.
 * AMB below 75% pays 50% and locks the remainder.
 * V.AMB below 75% pays 0 and locks the full reward.
 * Crossing 75% upgrades every reached tier to its full reward.
 */
export default function StackAmbitionRuntime(){
  const {dailyPlans,actions,entries,settings,logActivity,deleteEntry}=useApp();

  useEffect(()=>{
    if(!dailyPlans||!actions?.length)return;
    const actionMap=Object.fromEntries(actions.map(a=>[a.id,a]));
    const existing=new Map((entries||[]).filter(e=>e?.ambitionBonus&&e?.ambitionKey?.startsWith("stack-ambition:")).map(e=>[e.ambitionKey,e]));
    const wanted=new Map();

    Object.entries(dailyPlans).forEach(([date,plan])=>{
      const items=Array.isArray(plan?.items)?plan.items:[];
      const score=liveExecutionScore(date,plan,entries,actions,settings);
      items.forEach(item=>{
        const action=actionMap[item.actionId];
        if(!action||action.scoringType==="per-unit")return;
        const ambition=normalizeAmbition(action.ambition);
        if(!ambition.enabled)return;
        const done=Math.max(0,Number(item.stackDone)||0),baseTarget=Math.max(1,Number(item.stackCount)||1);
        [
          {id:"ambitious",target:ambition.ambitiousTarget,bonus:ambition.ambitiousBonus},
          {id:"very-ambitious",target:ambition.veryAmbitiousTarget,bonus:ambition.veryAmbitiousBonus},
        ].forEach(t=>{
          if(!(t.target>0)||!(t.bonus>0)||done<t.target)return;
          const reward=gatedAmbitionReward(t.id,t.bonus,score),key=bonusKey(item.id,t.id);
          wanted.set(key,{key,date,item,action,t,reward,score,overdeliver:t.target>baseTarget});
        });
      });
    });

    existing.forEach((entry,key)=>{if(!wanted.has(key))deleteEntry(entry.id)});
    wanted.forEach(({key,date,item,action,t,reward,score,overdeliver})=>{
      const old=existing.get(key),same=old&&Number(old.points||0)===Number(reward.earned||0)&&Number(old.ambitionLockedPoints||0)===Number(reward.locked||0);
      if(same)return;
      if(old)deleteEntry(old.id);
      logActivity({actionId:item.actionId,actionName:`${item.name||action.name} · ${t.id==="very-ambitious"?"Very Ambitious":"Ambitious"}`,category:item.category||action.category,subcategory:item.subcategory||action.subcategory||null,type:"positive",minutes:0,points:reward.earned,date,quantity:0,planItemId:item.id,scoringType:"ambition-bonus",ambitionBonus:true,ambitionTier:t.id,ambitionKey:key,ambitionFullBonus:Number(t.bonus)||0,ambitionLockedPoints:reward.locked,ambitionExecutionScore:score,ambitionRewardLocked:reward.locked>0,source:"ambition",stackAmbition:true,overdeliver});
    });
  },[dailyPlans,actions,entries,settings,logActivity,deleteEntry]);
  return null;
}
