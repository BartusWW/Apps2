import { useState } from "react";
import WeeklyReviewView from "../components/views/WeeklyReviewView";
import MonthlyReviewView from "../components/views/MonthlyReviewView";
import { CalendarRange, CalendarDays } from "lucide-react";

const VIEWS=[
  {id:"weekly",label:"Weekly",icon:CalendarDays,Component:WeeklyReviewView},
  {id:"monthly",label:"Monthly",icon:CalendarRange,Component:MonthlyReviewView},
];

export default function Review(){
  const[mode,setMode]=useState("weekly");
  const ActiveView=VIEWS.find(v=>v.id===mode).Component;
  return <div className="space-y-5" data-testid="review-page">
    <nav className="grid grid-cols-4 gap-1 bg-neutral-900 border theme-tertiary-border rounded-2xl p-1" aria-label="Review sections">
      {VIEWS.map(v=>{const Icon=v.icon,active=mode===v.id;return <button key={v.id} type="button" onClick={()=>setMode(v.id)} data-testid={`review-tab-${v.id}`} className={`min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[9px] uppercase tracking-wider font-semibold transition-colors ${active?"theme-primary-bg text-white":"text-neutral-400 hover:text-white hover:bg-white/5"}`}><Icon size={13}/><span className="w-full truncate text-center">{v.label}</span></button>})}
    </nav>
    <ActiveView/>
  </div>;
}
