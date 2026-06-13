import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ListChecks, BarChart3, Settings as SettingsIcon, Flame } from "lucide-react";
import BrainDumpFab from "./BrainDumpFab";

const navItems = [
  { to: "/", label: "Home", icon: LayoutDashboard, testId: "nav-dashboard", end: true },
  { to: "/log", label: "Log", icon: ListChecks, testId: "nav-log" },
  { to: "/review", label: "Review", icon: BarChart3, testId: "nav-review" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testId: "nav-settings" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top brand bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-white/10">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-emerald-500 flex items-center justify-center">
              <Flame size={18} className="text-black" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-base font-extrabold uppercase tracking-tight leading-none">
                CBE Scoreboard
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mt-1">
                Core / Build / Eliminate
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto px-5 pt-6 pb-28">
        <Outlet />
      </main>

      {/* Floating Brain Dump */}
      <BrainDumpFab />

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/85 border-t border-white/10"
        data-testid="bottom-nav"
      >
        <div className="max-w-md mx-auto h-16 flex items-center justify-around px-2">
          {navItems.map(({ to, label, icon: Icon, testId, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testId}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors duration-150 ${
                  isActive
                    ? "text-emerald-400"
                    : "text-neutral-500 hover:text-neutral-200"
                }`
              }
            >
              <Icon size={20} strokeWidth={2} />
              <span className="text-[10px] uppercase tracking-widest font-semibold">
                {label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
