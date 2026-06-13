import { useApp } from "../context/AppContext";
import DashboardCarousel from "../components/DashboardCarousel";
import HabitsSection from "../components/HabitsSection";
import DailyPlanCard from "../components/DailyPlanCard";
import QuickAddCard from "../components/QuickAddCard";

export default function Dashboard() {
  const { settings } = useApp();
  const categories = settings.categories || [];
  const positiveCats = categories.filter((c) => c.type === "positive");
  const negativeCats = categories.filter((c) => c.type === "negative");

  return (
    <div className="space-y-7" data-testid="dashboard-page">
      {/* Swipeable carousel: Score / Time */}
      <DashboardCarousel />

      {/* Daily Plan */}
      <DailyPlanCard />

      {/* Habits */}
      <HabitsSection />

      {/* Positive Quick Add */}
      <section data-testid="positive-actions-section">
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
              No positive categories. Add some in Settings → Categories.
            </p>
          )}
        </div>
      </section>

      {/* Negative Quick Add */}
      <section data-testid="negative-actions-section">
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
            <p className="text-sm text-neutral-500">
              No negative categories defined.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
