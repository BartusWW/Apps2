import * as Icons from "lucide-react";
import { BarChart3,Check,Clock3,Repeat2,RotateCcw,Trash2,X } from "lucide-react";

const ACC={red:"#ef4444",emerald:"#10b981",green:"#22c55e",sky:"#38bdf8",blue:"#3b82f6",violet:"#a78bfa",amber:"#f59e0b",orange:"#f97316",yellow:"#eab308",cyan:"#06b6d4",pink:"#ec4899",indigo:"#6366f1",neutral:"#a3a3a3",white:"#e5e7eb"};
const colorOf=v=>/^#[0-9a-f]{6}$/i.test(v||"")?v:ACC[v]||null;

// Exact legacy DailyPlanCard presentation, backed only by Core 3.0 execution state.
export default function V3ExecutionCard({item,action,category,closed,canWrite,onLog,onDismiss,onDelay}){
  const habit=item.kind==="habit"||item.kind==="habit-recovery";
  const subName=action?.subcategory;
  const sub=category?.subcategories?.find(s=>(typeof s==="string"?s:s?.name)===subName);
  const categoryAccent=colorOf(category?.color)||"#a3a3a3";
  const actionAccent=colorOf(typeof sub==="string"?null:sub?.color)||categoryAccent;
  const accent=item.frog?"#ff3b3b":habit?"#38bdf8":actionAccent;
  const Icon=Icons[action?.icon]||Repeat2;
  const points=Number(action?.points)||0;
  const progress=Number(item.progress||0),target=Number(item.target||0);
  const pct=target>0?Math.min(100,Math.max(0,progress/target*100)):0;
  const frogBg=item.frog?"linear-gradient(135deg,rgba(82,8,12,.96),rgba(38,5,8,.98))":"#0a0a0a";
  const label=habit?(item.secondChance?"SECOND CHANCE":`BUILD HABIT · +0%`):(item.frog?"FROG +10%":"TASK");

  return <article data-category-color className="border rounded-xl overflow-hidden" style={{borderColor:item.frog?"#120305":accent,background:frogBg}}>
    <div className="p-3.5 flex gap-3">
      <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0" style={{borderColor:accent,color:accent}}>{item.secondChance?<RotateCcw size={17}/>:<Icon size={17}/>}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase" style={{color:accent}}>{label}</p>
            <h3 className={`text-sm font-semibold ${item.complete?"line-through text-neutral-500":""}`}>{item.name}</h3>
            <p className="text-[10px] text-neutral-600">{habit?`${progress} / ${target} ${item.unit||"unit"}`:`${action?.category||""}${subName?` · ${subName}`:""}`}</p>
            {item.secondChance&&item.recoveryDebt>0&&<p className="mt-1 text-[9px] text-amber-400">Base {item.recoveryBaseTarget} + debt {item.recoveryDebt} = {target} {item.unit}</p>}
          </div>
          <div className="text-right shrink-0"><span className="font-display font-extrabold text-3xl leading-none" style={{color:accent}}>{habit?`${progress}/${target}`:`+${points}`}</span></div>
        </div>
        {habit&&target>0&&<div className="h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`,background:accent}}/></div>}
      </div>
    </div>
    {canWrite&&item.active&&!closed&&<div className="border-t p-2 flex gap-1.5" style={{borderColor:`${accent}55`}}>
      {habit?<button type="button" onClick={()=>onLog(item)} className="flex-1 rounded-lg py-2.5 text-[10px] uppercase font-extrabold" style={{background:accent,color:"#050505"}}><BarChart3 size={13} className="inline mr-1"/>Log</button>:<><button type="button" onClick={()=>onLog(item)} className="flex-1 rounded-lg text-[10px] font-extrabold" style={{background:accent,color:"#050505"}}><Check size={12} className="inline"/> Done</button><button type="button" onClick={()=>onDelay?.(item)} className="border rounded-lg px-3" aria-label="Delay"><Clock3 size={12}/></button><button type="button" onClick={()=>onDismiss("wont-do")} className="border rounded-lg px-3 text-red-400" aria-label="Won't do"><X size={12}/></button></>}
      {habit&&action?.scoringType==="per-unit"&&<button type="button" className="border rounded-lg px-2 text-[8px] uppercase font-bold text-neutral-500" disabled>Stats</button>}
      <button type="button" onClick={()=>onDismiss("drop")} className="border rounded-lg px-3 text-neutral-600" aria-label="Drop"><Trash2 size={12}/></button>
    </div>}
  </article>;
}
