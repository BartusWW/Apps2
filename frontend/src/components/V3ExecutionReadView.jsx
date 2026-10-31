import {useMemo,useState} from "react";
import {ArrowRight,Flame,ListChecks,ListPlus,LockKeyhole,Minus,Plus,Repeat2,Target,Trash2,XCircle} from "lucide-react";
import {useApp} from "../context/AppContext";
import {useV3Execution} from "../context/V3ExecutionContext";
import {todayISO} from "../lib/dateUtils";

const r=n=>Math.round((Number(n)||0)*10)/10;

export default function V3ExecutionReadView({date=todayISO()}){
  const {entries}=useApp();
  const v3=useV3Execution();
  const items=useMemo(()=>v3.day(date),[v3,v3.revision,date]);
  const state=useMemo(()=>v3.read(),[v3,v3.revision]);
  const[closing,setClosing]=useState(false),[resolutions,setResolutions]=useState({});
  const canClose=v3.isEnabled("dayClose"),closed=!!state?.closedDays?.[date];
  const unresolved=items.filter(x=>x.active&&x.kind!=="habit"&&x.kind!=="habit-recovery");
  const left=x=>Math.max(0,Number(x.remaining)||0);
  const resolutionFor=x=>resolutions[x.id]||{tomorrow:left(x),drop:0,wontDo:0};
  const setWhole=(x,key)=>setResolutions(p=>({...p,[x.id]:{tomorrow:0,drop:0,wontDo:0,[key]:left(x)}}));
  const bump=(x,key,delta)=>setResolutions(p=>{const cur=resolutionFor(x),next=Math.max(0,Number(cur[key]||0)+delta),sum=cur.tomorrow+cur.drop+cur.wontDo;if(delta>0&&sum>=left(x))return p;if(delta<0&&Number(cur[key]||0)<=0)return p;return{...p,[x.id]:{...cur,[key]:next}}});
  const valid=x=>{const q=resolutionFor(x);return Math.round((q.tomorrow+q.drop+q.wontDo)*1000)===Math.round(left(x)*1000)};

  const stats=useMemo(()=>{
    const tasks=items.filter(x=>x.kind!=="habit"&&x.kind!=="habit-recovery"),habits=items.filter(x=>x.kind==="habit"||x.kind==="habit-recovery");
    // A quantity target (10 km, 60 min, 20 reps) is one task occurrence, not N tasks.
    // Fixed stack tasks still count each stack unit separately.
    const taskWeight=x=>x.mode==="quantity"?1:Math.max(1,Number(x.target)||1);
    const taskProgress=x=>x.mode==="quantity"?(x.complete?1:0):Math.min(taskWeight(x),Math.max(0,Number(x.progress)||0));
    const taskTotal=r(tasks.reduce((s,x)=>s+taskWeight(x),0)),taskDone=r(tasks.reduce((s,x)=>s+taskProgress(x),0));
    const frogs=tasks.filter(x=>x.frog),frogTotal=r(frogs.reduce((s,x)=>s+taskWeight(x),0)),frogDone=r(frogs.reduce((s,x)=>s+taskProgress(x),0));
    const habitDone=habits.filter(x=>x.complete).length,habitTotal=habits.length;
    const taskScore=taskTotal?taskDone/taskTotal*100:100,frogScore=frogTotal?frogDone/frogTotal*100:100,habitScore=habitTotal?habitDone/habitTotal*100:100;
    const score=r(taskScore*.4+frogScore*.4+habitScore*.2);
    const dayEntries=(entries||[]).filter(e=>e.date===date),earned=r(dayEntries.filter(e=>Number(e.points)>0).reduce((s,e)=>s+Number(e.points||0),0));
    const planned=new Set(items.map(x=>x.actionId).filter(Boolean));
    const otd=new Set(dayEntries.filter(e=>Number(e.points)>0&&!planned.has(e.actionId)&&!e.ambitionBonus).map(e=>e.actionId||e.id)).size;
    return{score,earned,taskDone,taskTotal,frogDone,frogTotal,habitDone,habitTotal,otd};
  },[items,entries,date]);

  const requestClose=()=>{if(!canClose||closed)return;if(unresolved.length){setClosing(true);return}v3.closeDay(date,"manual",new Date().toISOString(),{})};
  const confirmClose=()=>{if(!unresolved.every(valid))return;v3.closeDay(date,"manual",new Date().toISOString(),Object.fromEntries(unresolved.map(x=>[x.id,resolutionFor(x)])));setClosing(false)};

  return <section data-testid="v3-execution-live"><div className="p-4"><div className="flex justify-between"><div><p className="text-[9px] uppercase tracking-[.18em] theme-primary-text font-bold">{closed?"Day closed":"Day open"}</p><h2 className="font-display font-extrabold text-xl uppercase">Execution live</h2></div><div className="text-right"><p className="font-display font-extrabold text-3xl theme-primary-text">{stats.score}</p><p className="text-[8px] uppercase text-neutral-500">Live score</p></div></div><div className="grid grid-cols-5 gap-1.5 mt-4"><S icon={Target} label="CBE" v={`+${stats.earned}`} color="#22c55e"/><S icon={Flame} label="FROG" v={`${stats.frogDone}/${stats.frogTotal}`} color="#ef4444"/><S icon={ListChecks} label="Tasks" v={`${stats.taskDone}/${stats.taskTotal}`} color="#38bdf8"/><S icon={ListPlus} label="OTD" v={stats.otd} color="#06b6d4"/><S icon={Repeat2} label="Habits" v={`${stats.habitDone}/${stats.habitTotal}`} color="#f59e0b"/></div></div>{closing&&!closed&&<div className="border-t theme-primary-border p-4 bg-neutral-950 space-y-4"><div><p className="text-[9px] uppercase theme-primary-text font-bold">Resolve unfinished tasks</p><p className="text-[10px] text-neutral-500">Every remaining stack instance must be assigned before the day is frozen.</p></div>{unresolved.map(item=>{const q=resolutionFor(item),multi=left(item)>1;return <div key={item.id} className="rounded-lg border border-white/10 p-2"><div className="flex justify-between mb-2"><p className="text-xs font-semibold">{item.name}</p>{multi&&<b className="text-xs">×{left(item)}</b>}</div>{multi?<div className="grid grid-cols-3 gap-1">{[["tomorrow","Tomorrow",ArrowRight],["drop","Drop",Trash2],["wontDo","Won't do",XCircle]].map(([key,label,Icon])=><div key={key} className="rounded-lg border border-white/10 p-1 text-center"><p className="text-[8px] uppercase text-neutral-500"><Icon size={10} className="inline"/> {label}</p><div className="flex items-center justify-center gap-2 mt-1"><button onClick={()=>bump(item,key,-1)}><Minus size={12}/></button><b>{q[key]}</b><button onClick={()=>bump(item,key,1)}><Plus size={12}/></button></div></div>)}</div>:<div className="grid grid-cols-3 gap-1">{[["tomorrow","Tomorrow",ArrowRight],["drop","Drop",Trash2],["wontDo","Won't do",XCircle]].map(([key,label,Icon])=><button key={key} onClick={()=>setWhole(item,key)} className={`rounded-lg border py-2 text-[9px] uppercase font-bold ${q[key]===left(item)?"theme-primary-border theme-primary-text":"border-white/10 text-neutral-600"}`}><Icon size={11} className="inline mr-1"/>{label}</button>)}</div>}{!valid(item)&&<p className="text-[9px] text-red-400 mt-2">Assign all {left(item)} remaining instances.</p>}</div>})}<div className="grid grid-cols-2 gap-2"><button onClick={()=>setClosing(false)} className="rounded-lg border border-white/10 py-2 text-[10px] uppercase text-neutral-400">Cancel</button><button disabled={!unresolved.every(valid)} onClick={confirmClose} className="theme-primary-bg rounded-lg py-2 text-[10px] uppercase font-bold disabled:opacity-30">Confirm & Freeze</button></div></div>}{canClose&&!closing&&<button disabled={closed} onClick={requestClose} className="flex w-full items-center justify-center gap-2 border-t theme-tertiary-border py-3 text-[10px] font-bold uppercase text-neutral-400 disabled:opacity-40"><LockKeyhole size={12}/>{closed?"Day closed":"Close Day"}</button>}</section>;
}

function S({icon:Icon,label,v,color}){return <div className="rounded-xl bg-neutral-950/70 px-1 py-2 text-center"><div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full" style={{background:`${color}18`,color}}><Icon size={13}/></div><p className="font-display text-lg font-extrabold leading-none">{v}</p><p className="mt-1 text-[7px] font-bold uppercase" style={{color}}>{label}</p></div>}
