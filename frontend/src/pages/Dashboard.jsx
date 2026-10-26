import { useState } from "react";
import { useApp } from "../context/AppContext";
import DashboardExecution from "../components/DashboardExecution";
import NextDeadlineWidget from "../components/NextDeadlineWidget";
import PinnedGoalsSection from "../components/PinnedGoalsSection";
const HOME_TABS=new Set(["tasks","favs","frogs","day","week","calendar"]);
export default function Dashboard(){const{settings}=useApp(),[homeTab,setHomeTab]=useState("tasks"),profileName=settings.activePriorityProfileId==="base"?"Balanced":(settings.priorityProfiles||[]).find(p=>p.id===settings.activePriorityProfileId)?.name||"Custom",vis=settings.homeCommandVisibility||{},showPinnedGoals=homeTab!=="favs"&&homeTab!=="frogs",captureTab=e=>{const button=e.target.closest("button");if(!button)return;const label=(button.textContent||"").trim().toLowerCase();if(HOME_TABS.has(label))setHomeTab(label)};return <div className="space-y-5" data-testid="dashboard-page"><header><h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">Command Center</h1><p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">Active profile: {profileName}</p></header><div onClickCapture={captureTab}><DashboardExecution/></div>{vis.deadline!==false&&<NextDeadlineWidget/>}{vis.goals!==false&&showPinnedGoals&&<PinnedGoalsSection/>}</div>}
