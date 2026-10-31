import { useMemo } from "react";
import * as Icons from "lucide-react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";
import { applyPriorityMultiplier, getSubcategoryPriorityPercent } from "../lib/priorityProfiles";
import { localISO } from "../lib/dateUtils";

const round1=n=>Math.round((Number(n)||0)*10)/10;
function mondayISO(){const d=new Date(),day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return localISO(d)}

export default function PinnedRow({showHeading=true}) {
  const { settings, actions, openLogModal, logActivity, deleteEntry } = useApp();
  const pinnedIds = settings.pinnedActionIds || [];
  const pinnedActions = useMemo(() => {
    const byId = Object.fromEntries((actions || []).map(a => [a.id, a]));
    return pinnedIds.map(id => byId[id]).filter(Boolean);
  }, [pinnedIds, actions]);
  if (!pinnedActions.length) return null;
  const weekKey=mondayISO(),wf=settings.weeklyFocus?.weekKey===weekKey?settings.weeklyFocus:null;
  const log=a=>{
    const isPerUnit=a.scoringType==="per-unit",hasDetails=(a.logFields||[]).length>0;
    if(isPerUnit||hasDetails){openLogModal({actionId:a.id});return}
    const cat=(settings.categories||[]).find(c=>c.name===a.category),isWeeklyFrog=!!wf&&(wf.frogIds||[]).includes(a.id)&&!(wf.completedFrogIds||[]).includes(a.id),base=applyPriorityMultiplier(a.points||0,a.category,a.subcategory,settings),points=round1(base*(isWeeklyFrog?1.1:1)),entry=logActivity({actionId:a.id,actionName:a.name,category:a.category,subcategory:a.subcategory,type:cat?.type||a.type,minutes:0,icon:a.icon,points,outputMetric:a.outputMetric||null,weeklyFrog:isWeeklyFrog,weeklyFocusWeek:isWeeklyFrog?weekKey:undefined,source:"home-pinned"});
    toast(`${a.name} logged`,{description:`${entry.points>0?"+":""}${entry.points} CBE`,action:{label:"Undo",onClick:()=>deleteEntry(entry.id)}})
  };
  return <section data-testid="pinned-row" className="space-y-2">
    {showHeading&&<p className="text-[10px] uppercase tracking-widest theme-primary-text font-bold">Pinned Actions</p>}
    <div className="flex flex-wrap gap-2" data-testid="pinned-actions-wrap">
      {pinnedActions.map(a=>{const cat=(settings.categories||[]).find(c=>c.name===a.category),sub=cat?.subcategories?.find(s=>(typeof s==="string"?s:s?.name)===a.subcategory),colorId=(typeof sub==="string"?null:sub?.color)||cat?.color||((cat?.type||a.type)==="positive"?"emerald":"red"),p=paletteFor(colorId),Icon=Icons[a.icon||cat?.icon||"Zap"]||Zap,isPerUnit=a.scoringType==="per-unit",score=isPerUnit?`${a.pointsPerUnit} CBE / ${a.unit||"unit"}`:`${Number(a.points)>=0?"+":""}${a.points||0} CBE`;return <button key={a.id} onClick={()=>log(a)} className={`min-h-[50px] max-w-full rounded-xl border ${p.border} bg-neutral-900/90 px-3 py-2 flex items-center gap-2 text-left active:scale-[.98] transition-transform`} title={`Log ${a.name}`}>
        <span className={`h-7 w-7 shrink-0 rounded-lg border ${p.border} ${p.text} bg-black/30 flex items-center justify-center`}><Icon size={13}/></span>
        <span className="min-w-0"><span className="block text-[11px] font-bold leading-tight whitespace-nowrap max-w-[190px] truncate">{a.name}</span><span className={`block text-[9px] font-semibold leading-tight mt-0.5 ${p.text}`}>{score}</span></span>
      </button>})}
    </div>
  </section>
}
