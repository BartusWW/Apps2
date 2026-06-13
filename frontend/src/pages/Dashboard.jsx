import { useApp } from "../context/AppContext";
import DashboardCarousel from "../components/DashboardCarousel";
import HabitsSection from "../components/HabitsSection";
import DailyPlanCard from "../components/DailyPlanCard";
import QuickAddCard from "../components/QuickAddCard";
import HomeSearch from "../components/HomeSearch";
import RecentlyUsedRow from "../components/RecentlyUsedRow";
import PinnedRow from "../components/PinnedRow";

export default function Dashboard() {
  const { settings } = useApp();
  const categories = settings.categories || [];
  const pinnedSet = new Set(settings.pinnedCategories || []);
  const positiveCats = categories.filter((c) => c.type === "positive" && !pinnedSet.has(c.name));
  const negativeCats = categories.filter((c) => c.type === "negative" && !pinnedSet.has(c.name));
  const layout = settings.homeLayout || [];

  const renderSection = (id) => {
    switch (id) {
      case "carousel":
        return <DashboardCarousel key="carousel" />;
      case "dailyPlan":
        return <DailyPlanCard key="dailyPlan" />;
      case "search":
        return <HomeSearch key="search" />;
      case "pinned":
        return <PinnedRow key="pinned" />;
      case "recent":
        return <RecentlyUsedRow key="recent" />;
      case "habits":
        return <HabitsSection key="habits" />;
      case "build":
        return (
          <section key="build" data-testid="positive-actions-section">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-extrabold uppercase tracking-tight text-xl">Build</h2>
              <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">
                +20 pts / hr
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {positiveCats.map((cat) => (
                <QuickAddCard key={cat.name} category={cat} />
              ))}
              {positiveCats.length === 0 && (
                <p className="text-sm text-neutral-500">
                  All positive categories are pinned (or none defined).
                </p>
              )}
            </div>
          </section>
        );
      case "eliminate":
        return (
          <section key="eliminate" data-testid="negative-actions-section">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-extrabold uppercase tracking-tight text-xl">Eliminate</h2>
              <span className="text-[10px] uppercase tracking-[0.18em] text-red-500 font-semibold">
                −30 pts / hr
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {negativeCats.map((cat) => (
                <QuickAddCard key={cat.name} category={cat} />
              ))}
              {negativeCats.length === 0 && (
                <p className="text-sm text-neutral-500">No negative categories.</p>
              )}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-7" data-testid="dashboard-page">
      {layout.filter((l) => l.visible).map((l) => renderSection(l.id))}
    </div>
  );
}
