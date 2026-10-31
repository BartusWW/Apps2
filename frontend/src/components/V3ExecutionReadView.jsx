import { useMemo,useState } from "react";
import { XCircle,LockKeyhole,ArrowRight,Trash2 } from "lucide-react";
import { useV3Execution } from "../context/V3ExecutionContext";
import { useApp } from "../context/AppContext";
import { todayISO } from "../lib/dateUtils";
import V3ExecutionCard from "./V3ExecutionCard";

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
  const delay=item=>{if(!canWrite||!item.active)return;v3.delay(item.id);};
  const dismiss=(item,reason)=>{if(!canWrite||!item.active)return;v3.dismiss(item.id,reason);};
  const requestClose=()=>{if(!canClose||closed)return;if(unresolved.length){setClosing(true);return;}v3.closeDay(date,"manual",new Date().toISOString(),{});};
  const confirmClose=()=>{const decided=Object.fromEntries(unresolved.map(item=>[item.id,choiceFor(item)]));v3.closeDay(date,"manual",new Date().toISOString(),decided);setClosing(false);};

  const card=item=><V3ExecutionCard key={item.id} item={item} action={actionMap[item.actionId]} category={categoryMap[actionMap[item.actionId]?.category]} closed={closed} canWrite={canWrite} onLog={log} onDelay={delay} onDismiss={reason=>dismiss(item,reason)}/>;

  return <section className="space-y-3 px-4 py-3" data-testid="v3-execution-read-view">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest theme-primary-text font-bold">Today's Actions</p>{closed&&<p className="text-[9px] uppercase tracking-wide text-neutral-600">Day closed · lifecycle frozen</p>}</div><p className="text-[10px] text-neutral-500">{summary.completed||0}/{summary.total||0}</p></div>
    {active.length===0&&!finished.length?<div className="rounded-xl border border-white/5 bg-neutral-950/40 px-3 py-4 text-xs text-neutral-500">No execution items for today.</div>:<div className="space-y-2">{active.map(card)}</div>}
    {finished.length>0&&<details className="rounded-xl border border-white/10 bg-neutral-950/30"><summary className="cursor-pointer px-3 py-2 text-[9px] uppercase font-bold text-neutral-500">Finished · {finished.length}</summary><div className="space-y-2 px-2 pb-2">{finished.map(item=><V3ExecutionCard key={item.id} item={item} action={actionMap[item.actionId]} category={categoryMap[actionMap[item.actionId]?.category]} closed canWrite={false} onLog={log} onDelay={()=>{}} onDismiss={()=>{}}/>)}</div></details>}
    {closing&&!closed&&<div className="rounded-xl border theme-primary-border bg-neutral-950 p-3 space-y-3"><div><p className="text-[9px] uppercase theme-primary-text font-bold">Resolve unfinished tasks</p><p className="text-[10px] text-neutral-500">Choose what happens before the day is frozen.</p></div>{unresolved.map(item=><div key={item.id} className="rounded-lg border border-white/10 p-2"><p className="text-xs font-semibold mb-2">{item.name}</p><div className="grid grid-cols-3 gap-1">{[["tomorrow","Tomorrow",ArrowRight],["drop","Drop",Trash2],["wont-do","Won't do",XCircle]].map(([value,label,Icon])=><button key={value} type="button" onClick={()=>setChoice(item,value)} className={`rounded-lg border py-2 text-[9px] uppercase font-bold ${choiceFor(item)===value?"theme-primary-border theme-primary-text":"border-white/10 text-neutral-600"}`}><Icon size={11} className="inline mr-1"/>{label}</button>)}</div></div>)}<div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setClosing(false)} className="rounded-lg border border-white/10 py-2 text-[10px] uppercase text-neutral-400">Cancel</button><button type="button" onClick={confirmClose} className="theme-primary-bg rounded-lg py-2 text-[10px] uppercase font-bold">Confirm & Freeze</button></div></div>}
    {canClose&&!closing&&<button type="button" disabled={closed} onClick={requestClose} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[10px] font-bold uppercase text-neutral-400 disabled:opacity-40"><LockKeyhole size={12}/>{closed?"Day closed":"Close Day"}</button>}
  </section>;
}
