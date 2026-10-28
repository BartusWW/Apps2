import {ListPlus} from "lucide-react";
import {useApp} from "../context/AppContext";
import {todayISO} from "../lib/dateUtils";

export default function OtherTasksDone(){
 const {entries,dailyPlans}=useApp(),date=todayISO(),plan=dailyPlans[date]||{};
 if(plan.dayStatus!=="open")return null;
 const done=entries.filter(e=>e.date===date&&e.source==="log-actions").length;
 return <section className="bg-neutral-900 border theme-tertiary-border rounded-xl px-4 py-3 flex items-center gap-3">
  <span className="h-9 w-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center"><ListPlus size={16}/></span>
  <div className="flex-1"><p className="text-[9px] uppercase tracking-[.18em] text-neutral-500">Execution live</p><p className="text-xs uppercase font-bold text-neutral-300">Other tasks done</p></div>
  <p className="font-display font-extrabold text-2xl text-sky-400">{done}</p>
 </section>;
}
