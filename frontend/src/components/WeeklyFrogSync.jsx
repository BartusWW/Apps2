import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { todayISO } from "../lib/dateUtils";
import { getSubcategoryPriorityPercent } from "../lib/priorityProfiles";
const round1=n=>Math.round((Number(n)||0)*10)/10,uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
function mondayFor(iso){const d=new Date(`${iso}T12:00:00`),day=d.getDay(),diff=day===0?-6:1-day;d.setDate(d.getDate()+diff);return d.toISOString().slice(0,10)}
export default function WeeklyFrogSync(){
 const {settings,actions,entries,dailyPlans,updateDailyPlan,updateSettings}=useApp(),prompted=useRef(new Set()),d=todayISO(),focus=settings.weeklyFocus||{},weekKey=mondayFor(d);
 useEffect(()=>{
  if(focus.weekKey!==weekKey||!(focus.frogIds||[]).length)return;
  const completed=new Set(focus.completedFrogIds||[]);
  for(const plan of Object.values(dailyPlans||{}))for(const item of plan?.items||[])if(item.weeklyFrog&&item.weeklyFrogWeek===weekKey&&item.status==="done")completed.add(item.actionId);
  for(const e of entries||[])if(e.date>=weekKey&&(focus.frogIds||[]).includes(e.actionId))completed.add(e.actionId);
  const newly=[...completed].filter(id=>!(focus.completedFrogIds||[]).includes(id));
  if(newly.length){let pinned=[...(settings.pinnedActionIds||[])];for(const id of newly){if(prompted.current.has(`${weekKey}:${id}`))continue;prompted.current.add(`${weekKey}:${id}`);const a=actions.find(x=>x.id===id);if(pinned.includes(id)){const keep=window.confirm(`WEEKLY FROG COMPLETE\n\n${a?.name||"Task"}\n\nOK = keep in Favorites\nCancel = remove from Favorites`);if(!keep)pinned=pinned.filter(x=>x!==id)}}updateSettings({weeklyFocus:{...focus,completedFrogIds:[...completed]},pinnedActionIds:pinned});}
  const current=dailyPlans[d]||{},items=Array.isArray(current.items)?current.items:[],existing=new Set(items.filter(i=>i.weeklyFrogWeek===weekKey).map(i=>i.actionId)),urgent=[0,5,6].includes(new Date(`${d}T12:00:00`).getDay());
  const due=(focus.frogIds||[]).filter(id=>!completed.has(id)&&!existing.has(id)).map(id=>{const a=actions.find(x=>x.id===id);if(!a)return null;const pct=getSubcategoryPriorityPercent(settings,a.category,a.subcategory);return{id:uid(),actionId:a.id,name:a.name,category:a.category,subcategory:a.subcategory||null,points:round1((Number(a.points)||0)*pct/100),basePoints:Number(a.points)||0,priorityPct:pct,minutes:Number(a.minutes)||0,type:a.type||"positive",status:"planned",frog:true,weeklyFrog:true,weeklyFrogWeek:weekKey,weeklyFrogUrgent:urgent,createdAt:new Date().toISOString()}}).filter(Boolean);if(due.length)updateDailyPlan(d,{items:[...items,...due]});
 },[focus.weekKey,focus.frogIds,focus.completedFrogIds,weekKey,d,actions,entries,dailyPlans,settings.activePriorityProfileId,settings.pinnedActionIds,updateDailyPlan,updateSettings]);
 useEffect(()=>{const rules=(settings.recurringTasks||[]).filter(r=>r.enabled!==false&&r.frequency==="once-week"),plan=dailyPlans[d];if(!rules.length||!plan?.items?.length)return;const doneRuleIds=new Set((entries||[]).filter(e=>e.date>=weekKey&&e.recurringId).map(e=>e.recurringId));if(!doneRuleIds.size)return;const next=plan.items.filter(i=>i.status==="done"||!i.recurringId||!doneRuleIds.has(i.recurringId));if(next.length!==plan.items.length)updateDailyPlan(d,{items:next})},[d,weekKey,entries,dailyPlans,settings.recurringTasks,updateDailyPlan]);
 return null;
}
