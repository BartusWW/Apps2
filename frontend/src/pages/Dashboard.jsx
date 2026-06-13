import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import DashboardCarousel from "../components/DashboardCarousel";
import HabitsSection from "../components/HabitsSection";
import DailyPlanCard from "../components/DailyPlanCard";
import HomeSearch from "../components/HomeSearch";
import RecentlyUsedRow from "../components/RecentlyUsedRow";
import PinnedRow from "../components/PinnedRow";
import CategorySection from "../components/CategorySection";
import NextDeadlineWidget from "../components/NextDeadlineWidget";

// Categories with zero entries in the last N days fall into the "Others" bucket
// so the home screen stays focused on what the user actually uses.
const OTHERS_INACTIVE_DAYS = 14;

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { settings, entries } = useApp();
  const categories = settings.categories || [];
  const pinnedSet = new Set(settings.pinnedCategories || []);
  const layout = settings.homeLayout || [];

  // Names of categories used at least once in the recency window.
  const activeNames = useMemo(() => {
    const cutoff = daysAgoISO(OTHERS_INACTIVE_DAYS);
    const set = new Set();
    for (const e of entries) {
      if (e.date >= cutoff) set.add(e.category);
    }
    return set;
  }, [entries]);

  // Sort categories by sortOrder (stable when undefined).
  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories],
  );

  const positiveActive = sorted.filter(
    (c) => c.type === "positive" && !pinnedSet.has(c.name) && activeNames.has(c.name),
  );
  const negativeActive = sorted.filter(
    (c) => c.type === "negative" && !pinnedSet.has(c.name) && activeNames.has(c.name),
  );
  const others = sorted.filter(
    (c) => !pinnedSet.has(c.name) && !activeNames.has(c.name),
  );

  // If a section would otherwise be empty (e.g. brand-new user), fall back to
  // showing every non-pinned category of that type so the dashboard isn't blank.
  const positiveCats =
    positiveActive.length === 0
      ? sorted.filter((c) => c.type === "positive" && !pinnedSet.has(c.name))
      : positiveActive;
  const negativeCats =
    negativeActive.length === 0
      ? sorted.filter((c) => c.type === "negative" && !pinnedSet.has(c.name))
      : negativeActive;
  // Hide "Others" duplicates when fallback above is active.
  const othersCats =
    positiveActive.length === 0 && negativeActive.length === 0 ? [] : others;

  const renderSection = (id) => {
    switch (id) {
      case "carousel":
        return <DashboardCarousel key="carousel" />;
      case "dailyPlan":
        return <DailyPlanCard key="dailyPlan" />;
      case "nextDeadline":
        return <NextDeadlineWidget key="nextDeadline" />;
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
          <CategorySection
            key="build"
            categoryName="Build"
            label="Build"
            subtitle="+20 / hr"
            icon="Rocket"
            color="emerald"
            items={positiveCats}
          />
        );
      case "eliminate":
        return (
          <CategorySection
            key="eliminate"
            categoryName="Eliminate"
            label="Eliminate"
            subtitle="−30 / hr"
            icon="TriangleAlert"
            color="red"
            items={negativeCats}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5" data-testid="dashboard-page">
      {layout.filter((l) => l.visible).map((l) => renderSection(l.id))}

      {othersCats.length > 0 && (
        <CategorySection
          categoryName="Others"
          label="Others"
          subtitle={`Inactive ${OTHERS_INACTIVE_DAYS}d`}
          icon="Archive"
          color="neutral"
          items={othersCats}
          defaultCollapsed
        />
      )}
    </div>
  );
}
