import {useMemo,useState} from "react";
import {CalendarDays,ChevronDown,ChevronUp,CirclePlus,Plus,Search,Zap,X} from "lucide-react";
import {useApp} from "../context/AppContext";
import {todayISO} from "../lib/dateUtils";
import {getSubcategoryPriorityPercent} from "../lib/priorityProfiles";
import {ActionForm} from "./settings/ActionsEditor";
import TaskDatePlanner from "./TaskDatePlanner";

const makeId=()=>`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const tomorrowISO=()=>{const x=new Date();x.setDate(x.getDate()+1);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`};

export default function V31AddTaskPlanner({date}){
  const {dailyPlans,updateDailyPlan,actions,settings,addAction}=useApp();
  const d=date||todayISO();
  const [open,setOpen]=useState(true),[search,setSearch]=useState(""),[actionId,setActionId]=useState(""),[quickNew,setQuickNew]=useState(false),[planning,setPlanning]=useState(false),[planDates,setPlanDates]=useState([tomorrowISO()]),[plannerOpen,setPlannerOpen]=useState(false),[pending,setPending]=useState(null);
  const profile=useMemo(()=>(settings.priorityProfiles||[]).find(p=>p.id===settings.activePriorityProfileId),[settings.priorityProfiles,settings.activePriorityProfileId]);
  const profileName=profile?.name||"Balanced";
  const positiveActions=useMemo(()=>actions.filter(a=>a.type==="positive"),[actions]);
  const actionMap=useMemo(()=>Object.fromEntries(actions.map(a=>[a.id,a])),[actions]);
  const filtered=positiveActions.filter(a=>!search.trim()||`${a.name} ${a.category} ${a.subcategory||""}`.toLowerCase().includes(search.toLowerCase()));
  const priorityPct=a=>getSubcategoryPriorityPercent(settings,a?.category,a?.subcategory);

  const addToDate=(a,targetDate,target)=>{
    if(!a||!targetDate)return;
    const plan=dailyPlans[targetDate]||{},items=Array.isArray(plan.items)?plan.items:[];
    const existing=items.find(i=>i.actionId===a.id);
    if(existing&&a.scoringType!=="per-unit"){
      updateDailyPlan(targetDate,{items:items.map(i=>i.id===existing.id?{...i,stackCount:Math.max(1,Number(i.stackCount)||1)+1}:i)});
      return;
    }
    if(existing)return;
    updateDailyPlan(targetDate,{items:[...items,{id:makeId(),actionId:a.id,name:a.name,category:a.category,subcategory:a.subcategory||null,points:Number(a.points)||0,priorityPct:priorityPct(a),minutes:Number(a.minutes)||0,type:a.type||"positive",status:"planned",frog:false,stackCount:1,stackDone:0,createdAt:new Date().toISOString(),...(a.scoringType==="per-unit"?{habit:true,habitAmount:Number(target)||0,habitUnit:a.unit||"unit"}:{})}]});
  };
  const requestAdd=a=>{if(!a)return;const targetDate=planning?planDates[0]:d;if(a.scoringType==="per-unit")setPending({action:a,date:targetDate});else addToDate(a,targetDate);setActionId("");setSearch("")};
  const createAndAdd=payload=>{const a=addAction(payload);setQuickNew(false);requestAdd(a)};

  return <section className="bg-neutral-900 border theme-tertiary-border rounded-xl overflow-hidden" data-testid="v31-add-task-planner">
    <button onClick={()=>setOpen(v=>!v)} className="w-full flex px-4 py-3">
      <span className="flex-1 text-left text-[10px] uppercase font-bold">Add Task</span>
      <span className="text-[9px] text-neutral-600 mr-1">Profile · {profileName}</span>
      {open?<ChevronUp size={14}/>:<ChevronDown size={14}/>} 
    </button>
    {open&&<div className="border-t theme-tertiary-border p-3">
      {quickNew?<ActionForm submitLabel="Create & Add" testIdPrefix="v31-quick-add" categories={settings.categories||[]} onCancel={()=>setQuickNew(false)} onSave={createAndAdd}/>:<div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={()=>setPlanning(false)} className={`rounded-lg py-2.5 text-[10px] uppercase font-extrabold border ${!planning?"theme-primary-border theme-primary-text":"theme-tertiary-border text-neutral-500"}`}><Zap size={13} className="inline mr-1"/>Add to Today</button>
          <button onClick={()=>setPlanning(true)} className={`rounded-lg py-2.5 text-[10px] uppercase font-extrabold border ${planning?"theme-primary-border theme-primary-text":"theme-tertiary-border text-neutral-500"}`}><CalendarDays size={13} className="inline mr-1"/>Plan Task</button>
        </div>
        {planning&&<button onClick={()=>setPlannerOpen(true)} className="w-full flex items-center gap-2 bg-neutral-950 border theme-tertiary-border rounded-lg px-3 py-2 text-xs"><CalendarDays size={14}/><span>{planDates[0]}</span></button>}
        <button onClick={()=>setQuickNew(true)} className="w-full border theme-primary-border theme-primary-text rounded-lg py-2 text-[10px] uppercase font-bold"><Plus size={13} className="inline"/> New Action</button>
        <div className="relative"><Search size={14} className="absolute left-3 top-3 text-neutral-600"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search actions…" className="w-full bg-neutral-950 border theme-tertiary-border rounded-lg pl-9 pr-3 py-2.5 text-sm"/></div>
        {search&&<div>{filtered.slice(0,12).map(a=><button key={a.id} onClick={()=>requestAdd(a)} className="w-full flex justify-between py-2 text-xs"><span>{a.name}</span><CirclePlus size={14}/></button>)}</div>}
        <div className="flex gap-2"><select value={actionId} onChange={e=>setActionId(e.target.value)} className="flex-1 bg-neutral-950 border theme-tertiary-border rounded-lg p-2 text-sm"><option value="">Choose action…</option>{positiveActions.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><button onClick={()=>requestAdd(actionMap[actionId])} className="px-3 theme-primary-bg rounded-lg"><CirclePlus size={18}/></button></div>
      </div>}
    </div>}
    <TaskDatePlanner open={plannerOpen} value={planDates[0]} dailyPlans={dailyPlans} onClose={()=>setPlannerOpen(false)} onSelect={x=>{setPlanDates(x.dates);setPlannerOpen(false)}}/>
    {pending&&<TargetModal action={pending.action} onClose={()=>setPending(null)} onSave={target=>{addToDate(pending.action,pending.date,target);setPending(null)}}/>}
  </section>;
}

function TargetModal({action,onClose,onSave}){const[v,setV]=useState("");const n=Number(v)||0;return <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4"><div className="w-full max-w-sm bg-neutral-900 border theme-primary-border rounded-2xl p-5 space-y-4"><div className="flex justify-between"><div><p className="text-[9px] uppercase theme-primary-text font-bold">Plan variable task</p><h3 className="font-display font-extrabold uppercase text-lg">{action?.name}</h3></div><button onClick={onClose}><X size={16}/></button></div><input autoFocus type="number" min="0" step="any" value={v} onChange={e=>setV(e.target.value)} className="w-full bg-neutral-950 border theme-tertiary-border rounded-xl px-3 py-3 text-xl font-bold"/><button disabled={!(n>0)} onClick={()=>onSave(n)} className="w-full theme-primary-bg disabled:opacity-30 rounded-xl py-3 text-xs uppercase font-extrabold">Set target · {v||0} {action?.unit||"unit"}</button></div></div>}
