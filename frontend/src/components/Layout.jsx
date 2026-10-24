import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ListChecks, BarChart3, Settings as SettingsIcon, Flame } from "lucide-react";
import BrainDumpFab from "./BrainDumpFab";
import LogModal from "./LogModal";
import { useApp } from "../context/AppContext";
import { normalizeTheme, themeVars } from "../lib/themes";

const navItems = [{to:"/",label:"Home",icon:LayoutDashboard,end:true},{to:"/log",label:"Log",icon:ListChecks},{to:"/review",label:"Review",icon:BarChart3},{to:"/settings",label:"Settings",icon:SettingsIcon}];

export default function Layout() {
  const { settings } = useApp();
  const theme = normalizeTheme(settings.theme);
  return <div className={`min-h-screen text-white theme-root theme-pattern-${theme.pattern || "none"}`} style={themeVars(theme)}>
    <header className="sticky top-0 z-40 backdrop-blur-xl theme-header border-b border-white/10"><div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-md theme-primary-bg flex items-center justify-center"><Flame size={18} className="text-white" strokeWidth={2.5}/></div><div><p className="font-display text-base font-extrabold uppercase tracking-tight leading-none">CBE Scoreboard</p><p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mt-1">Core / Build / Eliminate</p></div></div></div></header>
    <main className="max-w-md mx-auto px-5 pt-6 pb-28"><Outlet/></main><BrainDumpFab/><LogModal/>
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl theme-nav border-t border-white/10"><div className="max-w-md mx-auto h-16 flex items-center justify-around px-2">{navItems.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive?"theme-primary-text":"text-neutral-500 hover:text-neutral-200"}`}><Icon size={20}/><span className="text-[10px] uppercase tracking-widest font-semibold">{label}</span></NavLink>)}</div></nav>
  </div>;
}
