import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { Target, Bell, BellOff, Check, PieChart as PieChartIcon, Download, SlidersHorizontal, ListChecks, CalendarRange, Palette } from "lucide-react";
import { onInstallAvailability, promptInstall } from "../lib/pwa";
import HabitsEditor from "../components/settings/HabitsEditor";
import DataManagement from "../components/settings/DataManagement";
import AppearanceEditor from "../components/settings/AppearanceEditor";
import CategoriesEditor from "../components/settings/CategoriesEditor";
import BrainDumpManager from "../components/settings/BrainDumpManager";
import GoalsEditor from "../components/settings/GoalsEditor";
import ActionsEditor from "../components/settings/ActionsEditor";
import PriorityProfilesEditor from "../components/settings/PriorityProfilesEditor";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "cbe", label: "CBE", icon: ListChecks },
  { id: "planning", label: "Planning", icon: CalendarRange },
  { id: "appearance", label: "Theme", icon: Palette },
];

export default function Settings() {
  const { actions, settings, updateSettings } = useApp();
  const [tab, setTab] = useState("general");
  const [goalHours, setGoalHours] = useState(String(((settings.weeklyGoalMinutes || 1200) / 60).toFixed(1).replace(/\.0$/, "")));

  const saveGoal = () => {
    const hrs = Number(goalHours);
    if (!hrs || hrs <= 0) { toast("Goal must be > 0 hours"); return; }
    updateSettings({ weeklyGoalMinutes: Math.round(hrs * 60) });
    toast(`Weekly goal set to ${hrs}h`);
  };

  const toggleReminder = async () => {
    if (settings.reminderEnabled) { updateSettings({ reminderEnabled: false }); toast("Daily reminder disabled"); return; }
    if (typeof Notification === "undefined") { toast("Notifications not supported in this browser"); return; }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") { toast("Notification permission denied. Enable it in your browser settings."); return; }
    updateSettings({ reminderEnabled: true, lastReminderDate: null });
    toast(`Daily reminder set for ${settings.reminderTime}`);
  };

  return <div className="space-y-5" data-testid="settings-page">
    <header><h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">Settings</h1><p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">Configure how CBE works for you</p></header>

    <nav className="grid grid-cols-4 gap-1 bg-neutral-900 border theme-tertiary-border rounded-2xl p-1" aria-label="Settings sections">
      {SETTINGS_TABS.map(({id,label,icon:Icon})=><button key={id} type="button" onClick={()=>setTab(id)} className={`min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1.5 py-2.5 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold transition-colors ${tab===id?"theme-primary-bg text-white":"text-neutral-400 hover:text-white hover:bg-white/5"}`}><Icon size={13}/><span className="truncate">{label}</span></button>)}
    </nav>

    {tab==="general"&&<section className="space-y-4" data-testid="settings-general-tab">
      <SectionIntro title="General" text="Device, notifications and your CBE data." />
      <InstallAppCard />
      <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-4 space-y-3" data-testid="reminder-setting">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2">{settings.reminderEnabled?<Bell size={14} className="theme-primary-text"/>:<BellOff size={14} className="text-neutral-500"/>}<p className="text-sm font-semibold text-white">Daily Reminder</p></div><button type="button" onClick={toggleReminder} className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full border ${settings.reminderEnabled?"theme-primary-bg theme-primary-border text-white":"theme-tertiary-border text-neutral-300"}`}>{settings.reminderEnabled?"On":"Off"}</button></div>
        <p className="text-xs text-neutral-400">Current lightweight reminder. The full notification system will live here in the next planning build.<span className="block mt-1 text-neutral-500">Currently fires only while CBE is open.</span></p>
        <div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Reminder time</label><input type="time" value={settings.reminderTime} onChange={e=>updateSettings({reminderTime:e.target.value,lastReminderDate:null})} className="w-full mt-1 bg-neutral-950 border theme-tertiary-border rounded-lg px-3 py-2 text-sm text-white"/></div>
      </div>
      <DataManagement />
    </section>}

    {tab==="cbe"&&<section className="space-y-5" data-testid="settings-cbe-tab">
      <SectionIntro title="CBE System" text="Define what can be logged and how priorities shape the score." />
      <ActionsEditor />
      <CategoriesEditor />
      <PriorityProfilesEditor />
      <AllocationTargetsEditor actions={actions} targets={settings.allocationTargets||{}} onChange={next=>updateSettings({allocationTargets:next})}/>
    </section>}

    {tab==="planning"&&<section className="space-y-5" data-testid="settings-planning-tab">
      <SectionIntro title="Planning" text="Goals, habits and targets that steer your execution." />
      <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-4 space-y-3" data-testid="weekly-goal-setting">
        <div className="flex items-center gap-2"><Target size={14} className="theme-primary-text"/><p className="text-sm font-semibold text-white">Weekly Development Goal</p></div><p className="text-xs text-neutral-400">Target hours for the Time view progress bar.</p><div className="flex items-end gap-2"><div className="flex-1"><label className="text-[10px] uppercase tracking-widest text-neutral-500">Hours per week</label><input type="number" min="1" step="0.5" value={goalHours} onChange={e=>setGoalHours(e.target.value)} className="w-full mt-1 bg-neutral-950 border theme-tertiary-border rounded-lg px-3 py-2 text-sm text-white"/></div><button type="button" onClick={saveGoal} className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg theme-primary-bg text-white">Save</button></div><p className="text-[10px] uppercase tracking-widest text-neutral-500">Current: {(settings.weeklyGoalMinutes/60).toFixed(1)}h / week</p>
      </div>
      <GoalsEditor />
      <HabitsEditor />
      <BrainDumpManager />
    </section>}

    {tab==="appearance"&&<section className="space-y-5" data-testid="settings-appearance-tab">
      <SectionIntro title="Appearance" text="Theme, palette, surfaces and background treatment." />
      <AppearanceEditor />
    </section>}
  </div>;
}

function SectionIntro({title,text}) { return <div className="pb-1"><h2 className="font-display text-xl uppercase font-extrabold theme-secondary-text">{title}</h2><p className="text-xs text-neutral-500 mt-1">{text}</p></div>; }

function InstallAppCard(){const[available,setAvailable]=useState(false);const[installed,setInstalled]=useState(typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches);useEffect(()=>{const off=onInstallAvailability(setAvailable);return()=>off()},[]);const handleInstall=async()=>{const res=await promptInstall();if(res?.outcome==="accepted"){setInstalled(true);toast("App installed")}else if(res?.outcome==="unavailable")toast("Install prompt not available. On iOS: Share → Add to Home Screen.")};if(installed)return <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-4 flex items-center gap-3"><Check size={16} className="theme-primary-text shrink-0"/><div className="flex-1"><p className="text-sm font-semibold text-white">Installed as PWA</p><p className="text-xs text-neutral-400 mt-0.5">Launches like a native app from your home screen. Works offline.</p></div></div>;return <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-4 space-y-3"><div className="flex items-center gap-2"><Download size={14} className="theme-primary-text"/><p className="text-sm font-semibold text-white">Install on Device</p></div><p className="text-xs text-neutral-400">Add CBE to your home screen for a native-app feel and offline access.</p><button type="button" onClick={handleInstall} disabled={!available} className="w-full text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-lg theme-primary-bg text-white disabled:opacity-40">{available?"Install App":"Install Unavailable Here"}</button></div>}

function AllocationTargetsEditor({actions,targets,onChange}){const positiveCategories=Array.from(new Set(actions.filter(a=>a.type==="positive").map(a=>a.category)));const allCats=Array.from(new Set([...positiveCategories,...Object.keys(targets)]));const total=Object.values(targets).reduce((s,v)=>s+(Number(v)||0),0);const setVal=(cat,raw)=>{const num=raw===""?0:Math.max(0,Math.min(100,Number(raw)));const next={...targets,[cat]:num};if(num===0)delete next[cat];onChange(next)};const autoBalance=()=>{if(!allCats.length)return;const even=Math.floor(100/allCats.length);const next={};allCats.forEach((c,i)=>{next[c]=i===allCats.length-1?100-even*(allCats.length-1):even});onChange(next)};return <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-4 space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><PieChartIcon size={14} className="theme-primary-text"/><p className="text-sm font-semibold text-white">Allocation Targets</p></div><span className={`text-xs font-semibold ${total===100?"theme-primary-text":total===0?"text-neutral-500":"text-red-400"}`}>{total}%</span></div><p className="text-xs text-neutral-400">Ideal % of development time per category. Used by Monthly Review.</p>{!allCats.length?<p className="text-sm text-neutral-500">No positive categories yet.</p>:<ul className="space-y-2">{allCats.map(cat=><li key={cat} className="flex items-center gap-3"><span className="text-sm text-white flex-1 truncate">{cat}</span><input type="number" min="0" max="100" value={targets[cat]??""} onChange={e=>setVal(cat,e.target.value)} placeholder="0" className="w-16 bg-neutral-950 border theme-tertiary-border rounded-lg px-2 py-1.5 text-sm text-white text-right"/><span className="text-xs text-neutral-500 w-3">%</span></li>)}</ul>}<div className="flex justify-end gap-2"><button type="button" onClick={()=>onChange({})} className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-lg border theme-tertiary-border text-neutral-300">Clear</button><button type="button" onClick={autoBalance} className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-lg theme-primary-bg text-white">Auto-balance</button></div></div>}
