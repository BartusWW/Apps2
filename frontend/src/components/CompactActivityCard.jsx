import * as Icons from "lucide-react";
import { Pin, PinOff, Zap } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";
import { applyPriorityMultiplier, getSubcategoryPriorityPercent } from "../lib/priorityProfiles";

export default function CompactActivityCard({ action, showPinToggle = true }) {
  const { openLogModal, settings, togglePinAction, logActivity, deleteEntry } = useApp(); if (!action) return null;
  const cat=(settings.categories||[]).find(c=>c.name===action.category); const Icon=Icons[action.icon||cat?.icon||"Zap"]||Zap; const isPositive=(cat?.type||action.type)==="positive"; const p=paletteFor(cat?.color||(isPositive?"emerald":"red")); const isPinned=(settings.pinnedActionIds||[]).includes(action.id); const isInstant=!Number(action.minutes)||action.minutes<=0; const effectivePoints=applyPriorityMultiplier(action.points||0,action.category,action.subcategory,settings); const priorityPct=getSubcategoryPriorityPercent(settings,action.category,action.subcategory);
  const handleLog=()=>{if(isInstant){const entry=logActivity({actionId:action.id,actionName:action.name,category:action.category,subcategory:action.subcategory,type:cat?.type||action.type,minutes:0,icon:action.icon,points:effectivePoints});toast(`${action.name} logged`,{description:`${entry.points>0?"+":""}${entry.points} pts`,action:{label:"Undo",onClick:()=>deleteEntry(entry.id)},className:`!bg-neutral-900 !${p.border.replace("/30","/40")} !text-white`});}else openLogModal({actionId:action.id});};
  return <div className={`theme-action-block border ${p.borderHover} rounded-xl p-3 flex flex-col gap-2 transition-colors`} data-testid={`compact-card-${action.id}`}>
    <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2 min-w-0"><span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg}`}><Icon size={16} strokeWidth={2.5}/></span><span className={`font-display font-extrabold text-xl tracking-tight leading-none ${p.text}`}>{effectivePoints>0?"+":""}{effectivePoints} PTS</span></div>{showPinToggle&&<button onClick={()=>togglePinAction(action.id)} className={`p-1 rounded-md ${isPinned?p.text:"text-neutral-600 hover:text-neutral-300"}`}>{isPinned?<Pin size={12} fill="currentColor"/>:<PinOff size={12}/>}</button>}</div>
    <div className="min-w-0"><p className="text-xs font-semibold text-white leading-tight truncate">{action.name}</p><p className="text-[9px] uppercase tracking-widest text-neutral-400 mt-1 truncate">{action.subcategory?`${action.subcategory} · `:""}{isInstant?`${action.points} base · ${priorityPct}%`:`${action.points} base / 30m · ${priorityPct}%`}</p></div>
    <button onClick={handleLog} className={`w-full mt-auto text-[10px] uppercase tracking-widest font-semibold py-1.5 rounded-md ${p.solidBtn}`}>Log</button>
  </div>;
}
