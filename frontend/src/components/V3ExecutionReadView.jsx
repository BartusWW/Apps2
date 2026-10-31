import { useMemo,useState } from "react";
import { CheckCircle2,Circle,RotateCcw,Repeat2,Check,Plus,XCircle,LockKeyhole,ArrowRight,Trash2 } from "lucide-react";
import { useV3Execution } from "../context/V3ExecutionContext";
import { todayISO } from "../lib/dateUtils";

export default function V3ExecutionReadView({date=todayISO(),fields=[]}){
  const v3=useV3Execution();
  const items=useMemo(()=>v3.day(date),[v3,v3.revision,date]);
  const summary=useMemo(()=>v3.summary(date),[v3,v3.revision,date]);
  const state=useMemo(()=>v3.read(),[v3,v3.revision]);
  const [closing,setClosing]=useState(false);
  const [resolutions,setResolutions]=useState({});
  const showProgress=!fields.length||fields.includes("progress")||fields.includes("status");
  const canWrite=v3.isEnabled("executionWrite"),canClose=v3.isEnabled("dayClose"),closed=!!state?.closedDays?.[date];
  const unresolved=items.filter(x=>x.active&&x.kind!=="habit"&&x.kind!=="habit-recovery");
  const choiceFor=item=>resolutions[item.id]||"tomorrow";
  const setChoice=(item,value)=>setResolutions(p=>({...p,[item.id]:value}));

  const log=item=>{if(!canWrite||!item.active)return;const left=Math.max(0,Number(item.remaining||0));if(item.mode!=="quantity")return v3.complete(item.id);const raw=window.prompt(`Log ${item.unit||"units"} · ${left} remaining`,String(Math.min(left||1,1)));if(raw==null)return;const amount=Number(raw);if(Number.isFinite(amount)&&amount>0)v3.log(item.id,amount);};
  const requestClose=()=>{if(!canClose||closed)return;if(unresolved.length){setClosing(true);return;}v3.closeDay(date,"manual",new Date().toISOString(),{});};
  const confirmClose=()=>{const decided=Object.fromEntries(unresolved.map(item=>[item.id,choiceFor(item)]));v3.closeDay(date,"manual",new Date().toISOString(),decided);setClosing(false);};

  return <section className="space-y-2 px-4 py-3" data-testid="v3-execution-read-view">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-widest theme-primary-text font-bold">Daily Execution · Core 3.0</p>{closed&&<p className="text-[9px] uppercase tracking-wide text-neutral-600">Day closed · lifecycle frozen</p>}</div><p className="text-[10px] text-neutral-500">{summary.completed||0}/{summary.total||0}</p></div>
    {items.length===0?<div className="rounded-xl border border-white/5 bg-neutral-950/40 px-3 py-4 text-xs text-neutral-500">No execution items for today.</div>:items.map(item=><div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-neutral-950/45 px-3 py-2.5">
      <span className="shrink-0 text-neutral-500">{item.complete?<CheckCircle2 size={16}/>:<Circle size={16}/>}</span>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-xs font-semibold text-neutral-100">{item.name||item.actionId}</p>{item.secondChance&&<RotateCcw size={11} className="shrink-0 text-amber-400"/>}{item.recurring&&<Repeat2 size={11} className="shrink-0 text-neutral-600"/>}</div><p className="text-[9px] uppercase tracking-wide text-neutral-600">{item.kind}{item.secondChance?" · Second Chance":""}</p>{item.secondChance&&item.recoveryDebt>0&&<p className="mt-0.5 text-[9px] text-amber-400">Base {item.recoveryBaseTarget} + debt {item.recoveryDebt} = {item.target} {item.unit}</p>}</div>
      {showProgress&&<div className="shrink-0 text-right"><p className="font-mono text-[11px] text-neutral-300">{item.progress}/{item.target}</p>{item.unit&&<p className="text-[8px] uppercase text-neutral-600">{item.unit}</p>}</div>}
      {canWrite&&item.active&&!closed&&<div className="flex shrink-0 items-center gap-1"><button type="button" onClick={()=>log(item)} className="rounded-lg border border-white/10 p-2 text-neutral-300">{item.mode==="quantity"?<Plus size={13}/>:<Check size={13}/>}</button><button type="button" onClick={()=>v3.dismiss(item.id,"wont-do")} className="rounded-lg border border-white/10 p-2 text-neutral-600"><XCircle size={13}/></button></div>}
    </div>)}
    {closing&&!closed&&<div className="rounded-xl border theme-primary-border bg-neutral-950 p-3 space-y-3"><div><p className="text-[9px] uppercase theme-primary-text font-bold">Resolve unfinished tasks</p><p className="text-[10px] text-neutral-500">Choose what happens before the day is frozen.</p></div>{unresolved.map(item=><div key={item.id} className="rounded-lg border border-white/10 p-2"><p className="text-xs font-semibold mb-2">{item.name}</p><div className="grid grid-cols-3 gap-1">{[["tomorrow","Tomorrow",ArrowRight],["drop","Drop",Trash2],["wont-do","Won't do",XCircle]].map(([value,label,Icon])=><button key={value} type="button" onClick={()=>setChoice(item,value)} className={`rounded-lg border py-2 text-[9px] uppercase font-bold ${choiceFor(item)===value?"theme-primary-border theme-primary-text":"border-white/10 text-neutral-600"}`}><Icon size={11} className="inline mr-1"/>{label}</button>)}</div></div>)}<div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setClosing(false)} className="rounded-lg border border-white/10 py-2 text-[10px] uppercase text-neutral-400">Cancel</button><button type="button" onClick={confirmClose} className="theme-primary-bg rounded-lg py-2 text-[10px] uppercase font-bold">Confirm & Freeze</button></div></div>}
    {canClose&&!closing&&<button type="button" disabled={closed} onClick={requestClose} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[10px] font-bold uppercase text-neutral-400 disabled:opacity-40"><LockKeyhole size={12}/>{closed?"Day closed":"Close Day"}</button>}
  </section>;
}
