import { useMemo, useState } from "react";
import { Clock, Hash, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { useV3Execution } from "../context/V3ExecutionContext";
import { applyPriorityMultiplier, getSubcategoryPriorityPercent } from "../lib/priorityProfiles";
import { ambitionTiers } from "../lib/productivity";
import { ActionLogFields, serializeLogFields } from "./ActionLogFields";

const PRESETS=[10,20,30,60];
const r=n=>Math.round((Number(n)||0)*10)/10;

export default function V31QuantityLogModal({instance,action,onClose,habitBonus=0,frog=false,onAccepted}){
  const {entries,settings}=useApp();
  const v3=useV3Execution();
  const [mode,setMode]=useState("add");
  const [value,setValue]=useState("");
  const [details,setDetails]=useState({});

  const d=instance?.date||"";
  const actionId=action?.id||"";
  const isPerUnit=action?.scoringType==="per-unit";
  const history=useMemo(()=>{
    if(!actionId||!d)return {week:0,month:0};
    const own=(entries||[]).filter(e=>e.actionId===actionId&&!e.ambitionBonus);
    const amount=list=>r(list.reduce((s,e)=>s+(isPerUnit?Number(e.quantity)||0:Number(e.minutes)||0),0));
    const x=new Date(`${d}T12:00:00`),day=x.getDay(),monday=new Date(x);monday.setDate(x.getDate()+(day===0?-6:1-day));
    const week=`${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,"0")}-${String(monday.getDate()).padStart(2,"0")}`;
    const month=`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-01`;
    return {week:amount(own.filter(e=>e.date>=week&&e.date<=d)),month:amount(own.filter(e=>e.date>=month&&e.date<=d))};
  },[entries,actionId,isPerUnit,d]);

  if(!instance||!action)return null;

  const unit=action.unit||instance.unit||"unit";
  const labelUnit=isPerUnit?unit:"min";
  const today=Number(instance.progress)||0;
  const raw=Math.max(0,Number(value)||0);
  const qty=mode==="overall"?Math.max(0,raw-today):raw;
  const pct=getSubcategoryPriorityPercent(settings,action.category,action.subcategory);
  const bonusMultiplier=(frog?1.1:1)*(1+Number(habitBonus||0)/100);
  const rawRate=isPerUnit?(Number(action.pointsPerUnit)||0):(Number(action.points)||0)/30;
  const pointsPerAmount=r(applyPriorityMultiplier(rawRate,action.category,action.subcategory,settings)*bonusMultiplier);
  const tiers=ambitionTiers(action);
  const projected=Math.min(Number(instance.target)||0,today+qty);
  const crossed=tiers.filter(t=>Number(t.target)>today&&Number(t.target)<=projected);
  const ambitionBonus=r(crossed.reduce((s,t)=>s+Number(t.bonus||0),0));
  const pts=r(qty*pointsPerAmount+ambitionBonus);

  const submit=(input=value)=>{
    const entered=Math.max(0,Number(input)||0);
    const requested=mode==="overall"?Math.max(0,entered-today):entered;
    if(!(requested>0))return;
    const result=v3.log(instance.id,requested,{
      pointsPerAmount,
      ambitionTiers:tiers,
      metadata:{
        priorityPct:pct,
        frog,
        frogBonusPct:frog?10:0,
        habitBonusPct:Number(habitBonus)||0,
        customFields:serializeLogFields(action.logFields,details),
        outputMetric:action.outputMetric||null,
        source:"cbe-3.1",
      }
    });
    const accepted=Number(result?.effect?.quantity ?? result?.effect?.minutes ?? 0);
    if(!(accepted>0)){
      toast("Nothing logged",{description:"Core rejected this execution because the target is already complete or closed."});
      return;
    }
    const awarded=Number(result?.effect?.points)||0;
    if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate(35);
    toast(`${action.name} logged`,{description:`${accepted} ${labelUnit} · +${r(awarded)} CBE`});
    onAccepted?.(result,accepted);
    onClose();
  };

  return <div className="fixed inset-0 z-[80] bg-black/75 flex items-end sm:items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-neutral-900 border theme-primary-border rounded-2xl p-5 space-y-4"><div className="flex justify-between"><div><p className="text-[9px] uppercase theme-primary-text">{isPerUnit?"Variable Action":"Timed Action"}</p><h3 className="font-display font-extrabold text-xl uppercase">{action.name}</h3><p className="text-xs text-neutral-500">{r(today)} / {r(instance.target)} {labelUnit}{frog?" · FROG +10%":""}</p></div><button onClick={onClose}><X size={16}/></button></div><div className="grid grid-cols-3 gap-2"><Stat label="Today" value={today} unit={labelUnit}/><Stat label="Week" value={history.week} unit={labelUnit}/><Stat label="Month" value={history.month} unit={labelUnit}/></div>{isPerUnit?<div className="grid grid-cols-2 gap-2"><button onClick={()=>setMode("add")} className={`border rounded-lg py-2 text-xs ${mode==="add"?"theme-primary-border theme-primary-soft":"theme-tertiary-border"}`}>ADD</button><button onClick={()=>setMode("overall")} className={`border rounded-lg py-2 text-xs ${mode==="overall"?"theme-primary-border theme-primary-soft":"theme-tertiary-border"}`}>OVERALL TODAY</button></div>:!action.logFields?.length?<div className="grid grid-cols-4 gap-2">{PRESETS.map(m=><button key={m} onClick={()=>submit(m)} className="border theme-tertiary-border rounded-lg py-2 text-xs"><b>{m}</b><small className="block text-neutral-500">min</small></button>)}</div>:null}<label className="text-[10px] uppercase text-neutral-500">{isPerUnit?<><Hash size={11} className="inline"/> {mode==="add"?"Add":"Overall today"} ({unit})</>:<><Clock size={11} className="inline"/> Minutes</>}<input autoFocus type="number" step={isPerUnit?"0.1":"1"} min="0" value={value} onChange={e=>setValue(e.target.value)} className="mt-1 w-full bg-neutral-950 border theme-tertiary-border rounded-xl px-4 py-3 text-2xl font-display font-bold"/></label><ActionLogFields fields={action.logFields||[]} value={details} onChange={setDetails}/><div className="grid grid-cols-2 gap-2"><div className="bg-neutral-950 border theme-tertiary-border rounded-lg p-3"><p className="text-[9px] text-neutral-600 uppercase">Will add</p><p className="font-bold">{r(qty)} {labelUnit}</p></div><div className="bg-neutral-950 border theme-tertiary-border rounded-lg p-3"><p className="text-[9px] text-neutral-600 uppercase">CBE</p><p className="font-bold theme-primary-text">+{pts}</p></div></div><button onClick={()=>submit()} disabled={qty<=0} className="w-full theme-primary-bg rounded-xl py-3 uppercase text-xs font-bold disabled:opacity-30">Log session</button></div></div>;
}

function Stat({label,value,unit}){return <div className="rounded-lg bg-neutral-950 border theme-tertiary-border p-2 text-center"><p className="text-[8px] uppercase tracking-wider text-neutral-600">{label}</p><p className="text-sm font-display font-extrabold">{r(value)} <span className="text-[9px] text-neutral-500">{unit}</span></p></div>}
