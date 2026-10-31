import { useMemo,useState } from "react";
import { CheckCircle2,Circle,RotateCcw,Repeat2,Check,Plus,XCircle,LockKeyhole,ArrowRight,Trash2 } from "lucide-react";
import { useV3Execution } from "../context/V3ExecutionContext";
import { useApp } from "../context/AppContext";
import { todayISO } from "../lib/dateUtils";

const ACC={red:"#ef4444",emerald:"#10b981",green:"#22c55e",sky:"#38bdf8",blue:"#3b82f6",violet:"#a78bfa",amber:"#f59e0b",orange:"#f97316",yellow:"#eab308",cyan:"#06b6d4",pink:"#ec4899",indigo:"#6366f1",neutral:"#a3a3a3",white:"#e5e7eb"};
const colorOf=v=>/^#[0-9a-f]{6}$/i.test(v||"")?v:ACC[v]||null;

export default function V3ExecutionReadView({date=todayISO(),fields=[]}){
  const v3=useV3Execution();
  const {actions,settings}=useApp();
  const items=useMemo(()=>v3.day(date),[v3,v3.revision,date]);
  const summary=useMemo(()=>v3.summary(date),[v3,v3.revision,date]);
  const state=useMemo(()=>v3.read(),[v3,v3.revision]);
  const actionMap=useMemo(()=>Object.fromEntries((actions||[]).map(a=>[a.id,a])),[actions]);
  const categoryMap=useMemo(()=>Object.fromEntries((settings.categories||[]).map(c=>[c.name,c])),[settings.categories]);
  const [closing,setClosing]=useState(false);
  const [resolutions,setResolutions]=useState({});
  const canWrite=v3.isEnabled("executionWrite"),canClose=v3.isEnabled("dayClose"),closed=!!state?.closedDays?.[date];
  const unresolved=items.filter(x=>x.active&&x.kind!=="habit"&&x.kind!=="habit-recovery");
  const active=items.filter(x=>x.active);
  const finished=items.filter(x=>x.complete);
  const choiceFor=item=>resolutions[item.id]||"tomorrow";
  const setChoice=(item,value)=>setResolutions(p=>({...p,[item.id]:value}));

  const log=item=>{if(!canWrite||!item.active)return;const left=Math.max(0,Number(item.remaining||0));if(item.mode!=="quantity")return v3.complete(item.id);const raw=window.prompt(`Log ${item.unit||"units"} · ${left} remaining`,String(Math.min(left||1,1)));if(raw==null)return;const amount=Number(raw);if(Number.isFinite(amount)&&amount>0)v3.log(item.id,amount);};
  const requestClose=()=>{if(!canClose||closed)return;if(unresolved.length){setClosing(true);return;}v3.closeDay(date,"manual",new Date().toISOString(),{});};
  const confirmClose=()=>{const decided=Object.fromEntries(unresolved.map(item=>[item.id,choiceFor(item)]));v3.closeDay(date,"manual",new Date().toISOString(),decided);setClosing(false);};

  return <section className="space-y-3 px-4 py-3" data-testid="v3-execution-read-view">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest theme-primary-text font-bold">Today's Actions</p>{closed&&<p className="text-[9px] uppercase tracking-wide text-neutral-600">Day closed · lifecycle frozen</p>}</div><p className="text-[10px] text-neutral-500">{summary.completed||0}/{summary.total||0}</p></div>
    {active.length===0&&!finished.length?<div className="rounded-xl border border-white/5 bg-neutral-950/40 px-3 py-4 text-xs text-neutral-500">No execution items for today.</div>:<div className="space-y-2">{active.map(item=><ExecutionCard key={item.id} item={item} action={actionMap[item.actionId]} category={categoryMap[actionMap[item.actionId]?.category]} closed={closed} canWrite={canWrite} onLog={log} onDismiss={()=>v3.dismiss(item.id,"wont-do")}/>)}</div>}
    {finished.length>0&&<details className="rounded-xl border border-white/10 bg-neutral-950/30"><summary className="cursor-pointer px-3 py-2 text-[9px] uppercase font-bold text-neutral-500">Finished · {finished.length}</summary><div className="space-y-2 px-2 pb-2">{finished.map(item=><ExecutionCard key={item.id} item={item} action={actionMap[item.actionId]} category={categoryMap[actionMap[item.actionId]?.category]} closed canWrite={false} onLog={log}/>)}</div></details>}
    {closing&&!closed&&<div className="rounded-xl border theme-primary-border bg-neutral-950 p-3 space-y-3"><div><p className="text-[9px] uppercase theme-primary-text font-bold">Resolve unfinished tasks</p><p className="text-[10px] text-neutral-500">Choose what happens before the day is frozen.</p></div>{unresolved.map(item=><div key={item.id} className="rounded-lg border border-white/10 p-2"><p className="text-xs font-semibold mb-2">{item.name}</p><div className="grid grid-cols-3 gap-1">{[["tomorrow","Tomorrow",ArrowRight],["drop","Drop",Trash2],["wont-do","Won't do",XCircle]].map(([value,label,Icon])=><button key={value} type="button" onClick={()=>setChoice(item,value)} className={`rounded-lg border py-2 text-[9px] uppercase font-bold ${choiceFor(item)===value?"theme-primary-border theme-primary-text":"border-white/10 text-neutral-600"}`}><Icon size={11} className="inline mr-1"/>{label}</button>)}</div></div>)}<div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setClosing(false)} className="rounded-lg border border-white/10 py-2 text-[10px] uppercase text-neutral-400">Cancel</button><button type="button" onClick={confirmClose} className="theme-primary-bg rounded-lg py-2 text-[10px] uppercase font-bold">Confirm & Freeze</button></div></div>}
    {canClose&&!closing&&<button type="button" disabled={closed} onClick={requestClose} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[10px] font-bold uppercase text-neutral-400 disabled:opacity-40"><LockKeyhole size={12}/>{closed?"Day closed":"Close Day"}</button>}
  </section>;
}

function ExecutionCard({item,action,category,closed,canWrite,onLog,onDismiss}){
  const habit=item.kind==="habit"||item.kind==="habit-recovery";
  const accent=habit?"#38bdf8":colorOf(category?.color)||"#ef4444";
  const pct=item.target>0?Math.min(100,Math.max(0,(Number(item.progress||0)/Number(item.target))*100)):0;
  const points=Number(action?.points)||0;
  return <article className="overflow-hidden rounded-xl border bg-neutral-950/75" style={{borderColor:accent}}>
    <div className="flex items-center gap-3 px-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{borderColor:accent,color:accent}}>{item.complete?<CheckCircle2 size={17}/>:habit?<RotateCcw size={16}/>:<Circle size={16}/>}</span>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-sm font-bold text-neutral-100">{item.name||item.actionId}</p>{item.secondChance&&<RotateCcw size={11} className="text-amber-400"/>}{item.recurring&&<Repeat2 size={11} className="text-neutral-600"/>}</div><p className="text-[9px] uppercase font-bold" style={{color:accent}}>{habit?(item.secondChance?"Habit · Second Chance":"Habit"):"Task"}</p>{item.secondChance&&item.recoveryDebt>0&&<p className="mt-0.5 text-[9px] text-amber-400">Base {item.recoveryBaseTarget} + debt {item.recoveryDebt} = {item.target} {item.unit}</p>}</div>
      {!habit&&points>0&&<div className="font-display text-xl font-black" style={{color:accent}}>+{points}</div>}
      {habit&&<div className="font-display text-xl font-black" style={{color:accent}}>{item.progress}/{item.target}</div>}
    </div>
    {habit&&<div className="px-3 pb-2"><div className="h-1.5 overflow-hidden rounded-full bg-neutral-800"><div className="h-full rounded-full" style={{width:`${pct}%`,background:accent}}/></div></div>}
    {canWrite&&item.active&&!closed&&<div className="flex gap-2 border-t border-white/10 p-2"><button type="button" onClick={()=>onLog(item)} className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg font-bold text-xs" style={{background:accent,color:"#050505"}}>{item.mode==="quantity"?<><Plus size={14}/> LOG</>:<><Check size={14}/> Done</>}</button><button type="button" onClick={onDismiss} className="min-h-10 min-w-12 rounded-lg border border-white/10 text-neutral-500"><XCircle size={14} className="mx-auto"/></button></div>}
  </article>;
}
