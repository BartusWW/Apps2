import { useApp } from "../context/AppContext";
import DashboardCarousel from "../components/DashboardCarousel";
import WeeklyFocus from "../components/WeeklyFocus";
import PinnedRow from "../components/PinnedRow";
import NextDeadlineWidget from "../components/NextDeadlineWidget";
import PinnedGoalsSection from "../components/PinnedGoalsSection";

export default function Dashboard() {
  const { settings } = useApp();
  const profileName = settings.activePriorityProfileId === "base"
    ? "Balanced"
    : (settings.priorityProfiles || []).find((p) => p.id === settings.activePriorityProfileId)?.name || "Custom";

  return (
    <div className="space-y-5" data-testid="dashboard-page">
      <header>
        <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">Command Center</h1>
        <p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">Active profile: {profileName}</p>
      </header>
      <WeeklyFocus />
      <DashboardCarousel />
      <NextDeadlineWidget />
      <PinnedGoalsSection />
      <section className="space-y-2">
        <div className="flex items-center justify-between"><h2 className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">Favorites</h2><span className="text-[10px] uppercase tracking-widest text-neutral-600">Full logging lives in Log</span></div>
        <PinnedRow />
      </section>
    </div>
  );
}
