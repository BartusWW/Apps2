import { useApp } from "../context/AppContext";
import DashboardExecution from "../components/DashboardExecution";
import NextDeadlineWidget from "../components/NextDeadlineWidget";
import PinnedGoalsSection from "../components/PinnedGoalsSection";
export default function Dashboard(){const{settings}=useApp(),profileName=settings.activePriorityProfileId==="base"?"Balanced":(settings.priorityProfiles||[]).find(p=>p.id===settings.activePriorityProfileId)?.name||"Custom",vis=settings.homeCommandVisibility||{};return <div className="space-y-5" data-testid="dashboard-page"><header><h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">Command Center</h1><p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">Active profile: {profileName}</p></header><DashboardExecution/>{vis.deadline!==false&&<NextDeadlineWidget/>}{vis.goals!==false&&<PinnedGoalsSection/>}</div>}
