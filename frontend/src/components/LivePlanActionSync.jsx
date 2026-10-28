import {useEffect} from "react";
import {useApp} from "../context/AppContext";

const r=n=>Math.round((Number(n)||0)*10)/10;

export default function LivePlanActionSync(){
 const {actions,dailyPlans,updateDailyPlan}=useApp();
 useEffect(()=>{
  const byId=Object.fromEntries((actions||[]).map(a=>[a.id,a]));
  for(const [date,plan] of Object.entries(dailyPlans||{})){
   if(plan?.dayStatus==="closed-complete")continue;
   const items=Array.isArray(plan?.items)?plan.items:[];
   let changed=false;
   const next=items.map(item=>{
    const a=byId[item.actionId];
    if(!a)return item;
    const pct=Number(item.priorityPct)||100;
    const patch={
     name:a.name,
     category:a.category,
     subcategory:a.subcategory||null,
     type:a.type||"positive",
     minutes:Number(a.minutes)||0,
     basePoints:Number(a.points)||0,
     points:r((Number(a.points)||0)*pct/100),
     ...(a.scoringType==="per-unit"?{habitUnit:a.unit||item.habitUnit||"unit"}:{})
    };
    if(Object.entries(patch).every(([k,v])=>item[k]===v))return item;
    changed=true;
    return {...item,...patch};
   });
   if(changed)updateDailyPlan(date,{items:next});
  }
 },[actions,dailyPlans,updateDailyPlan]);
 return null;
}
