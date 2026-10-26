import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { todayISO } from "../lib/dateUtils";
import { getSubcategoryPriorityPercent } from "../lib/priorityProfiles";

const round1=n=>Math.round((Number(n)||0)*10)/10;
const uid=()=>`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
function mondayFor(iso){const d=new Date(`${iso}T12:00:00`),day=d.getDay(),diff=day===0?-6:1-day;d.setDate(d.getDate()+diff);return d.toISOString().slice(0,10)}
export default function WeeklyFrogSync(){
 const {settings,actions,dailyPlans,updateDailyPlan,updateSettings}=useApp();
 const d=todayISO(),focus=settings.weeklyFocus||{},weekKey=mondayFor(d);
 useEffect(()=>{
  if(focus.weekKey!==weekKey||!(focus.frogIds||[]).length)return;
  const completed=new Set(focus.completedFrogIds||[]);
  for(const plan of Object.values(dailyPlans||{}))for(const item of plan?.items||[])if(item.weeklyFrog&&item.weeklyFrogWeek===weekKey&&item.status==="done")completed.add(item.actionId);
  const completedIds=[...completed];
  if(completedIds.length!==(focus.completedFrogIds||[]).length||completedIds.some(id=>!(focus.completedFrogIds||[]).includes(id)))updateSettings({weeklyFocus:{...focus,completedFrogIds:completedIds}});
  const current=dailyPlans[d]||{},items=Array.isArray(current.items)?current.items:[],existing=new Set(items.filter(i=>i.weeklyFrogWeek===weekKey).map(i=>i.actionId));
  const urgent=[0,5,6].includes(new Date(`${d}T12:00:00`).getDay());
  const due=(focus.frogIds||[]).filter(id=>!completed.has(id)&&!existing.has(id)).map(id=>{const a=actions.find(x=>x.id===id);if(!a)return null;const pct=getSubcategoryPriorityPercent(settings,a.category,a.subcategory);return{id:uid(),actionId:a.id,name:a.name,category:a.category,subcategory:a.subcategory||null,points:round1((Number(a.points)||0)*pct/100),basePoints:Number(a.points)||0,priorityPct:pct,minutes:Number(a.minutes)||0,type:a.type||"positive",status:"planned",frog:true,weeklyFrog:true,weeklyFrogWeek:weekKey,weeklyFrogUrgent:urgent,createdAt:new Date().toISOString()}}).filter(Boolean);
  if(due.length)updateDailyPlan(d,{items:[...items,...due]});
 },[focus.weekKey,focus.frogIds,focus.completedFrogIds,weekKey,d,actions,dailyPlans,settings.activePriorityProfileId]);
 return null;
}
