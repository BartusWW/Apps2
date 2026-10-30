import {useMemo,useState} from "react";
import {ChevronDown,ChevronRight,Flame,Star,Target} from "lucide-react";
import {useApp} from "../context/AppContext";
import {localISO} from "../lib/dateUtils";

const R=n=>Math.round((Number(n)||0)*10)/10;
function mondayISO(){const d=new Date(),day=d.getDay(),diff=day===0?-6:1-day;d.setDate(d.getDate()+diff);return localISO(d)}
function sundayISO(start){const d=new Date(`${start}T12:00:00`);d.setDate(d.getDate()+6);return localISO(d)}

export default function WeeklyExecutionSummary(){
 const{settings,actions,entries,goals}=useApp(),[open,setOpen]=useState(false),weekKey=mondayISO(),end=sundayISO(weekKey),wf=settings.weeklyFocus?.weekKey===weekKey?settings.weeklyFocus:{frogIds:[],actionIds:[],actionTargets:{}};
 const weekEntries=useMemo(()=>entries.filter(e=>e.date>=weekKey&&e.date<=end),[entries,weekKey,end]);
 const progress=id=>{const a=actions.find(x=>x.id===id);if(!a)return 0;const es=weekEntries.filter(e=>e.actionId===id&&Number(e.points)>=0);return a.scoringType==="per-unit"?R(es.reduce((s,e)=>s+(Number(e.quantity)||0),0)):es.length};
 const weekly=(wf.actionIds||[]).map(id=>{const a=actions.find(x=>x.id===id);if(!a)return null;const target=wf.actionTargets?.[id]??1,value=progress(id),done=target!=="infinite"&&value>=Number(target);return{a,target,value,done}}).filter(Boolean);
 const frogs=(wf.frogIds||[]).map(id=>{const a=actions.find(x=>x.id===id);if(!a)return null;return{a,done:weekEntries.some(e=>e.actionId===id&&Number(e.points)>0)}}).filter(Boolean);
 const finite=weekly.filter(x=>x.target!=="infinite"),taskPct=finite.length?finite.reduce((s,x)=>s+Math.min(1,x.value/Math.max(1,Number(x.target))),0)/finite.length*100:100,frogPct=frogs.length?frogs.filter(x=>x.done).length/frogs.length*100:100,score=R((finite.length&&frogs.length)?taskPct*.6+frogPct*.4:finite.length?taskPct:frogs.length?frogPct:100);
 const taskOfWeek=weekly.find(x=>x.a.id===wf.taskOfWeekActionId),goalOfWeek=goals.find(g=>g.id===wf.goalOfWeekId&&g.status==="active"),daysLeft=Math.max(0,Math.ceil((new Date(`${end}T23:59:59`)-new Date())/86400000));
 if(!weekly.length&&!frogs.length&&!goalOfWeek)return null;
 return <section className="border-t theme-tertiary-border bg-neutral-950/35">
  <button onClick={()=>setOpen(v=>!v)} className="w-full px-4 py-3 flex items-center gap-3 text-left"><div className="flex-1"><p className="text-[9px] uppercase tracking-[.18em] theme-primary-text font-bold">Week in progress</p><p className="font-display font-extrabold text-lg uppercase">Weekly Execution</p></div><div className="text-right"><p className="font-display font-extrabold text-2xl theme-primary-text">{score}</p><p className="text-[8px] uppercase text-neutral-500">Live score</p></div>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button>
  <div className="px-4 pb-3 grid grid-cols-3 gap-2"><Mini label="Tasks" value={`${finite.filter(x=>x.done).length}/${finite.length}`}/><Mini label="Weekly FROG" value={`${frogs.filter(x=>x.done).length}/${frogs.length}`}/><Mini label="Days left" value={daysLeft}/></div>
  {open&&<div className="px-4 pb-4 space-y-2">{frogs.map(x=><Row key={`f-${x.a.id}`} icon={Flame} label="Weekly FROG" name={x.a.name} value={x.done?"DONE":"ACTIVE"}/>) }{taskOfWeek&&<Row icon={Star} label="Task of the Week" name={taskOfWeek.a.name} value={`${taskOfWeek.value}/${taskOfWeek.target}`}/>} {goalOfWeek&&<Row icon={Target} label="Goal of the Week" name={goalOfWeek.name} value="FOCUS"/>}</div>}
 </section>
}
function Mini({label,value}){return <div className="rounded-lg border border-white/5 bg-neutral-950 p-2 text-center"><p className="font-display font-extrabold text-lg">{value}</p><p className="text-[8px] uppercase text-neutral-600">{label}</p></div>}
function Row({icon:Icon,label,name,value}){return <div className="rounded-xl border theme-tertiary-border bg-neutral-900 p-3 flex items-center gap-3"><Icon size={15} className="theme-primary-text"/><div className="flex-1 min-w-0"><p className="text-[8px] uppercase theme-primary-text font-bold">{label}</p><p className="text-xs font-semibold truncate">{name}</p></div><span className="text-[9px] uppercase text-neutral-500">{value}</span></div>}
