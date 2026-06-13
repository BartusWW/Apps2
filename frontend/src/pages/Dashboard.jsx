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
import PinnedGoalsSection from "../components/PinnedGoalsSection";
import { localISO } from "../lib/dateUtils";

// Categories with zero entries in the last N days fall into the "Others" bucket
// so the home screen stays focused on what the user actually uses.
const OTHERS_INACTIVE_DAYS = 14;

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return localISO(d);
}

export default function Dashboard() {
  const { settings, entries, actions } = useApp();
  const categories = settings.categories || [];
  const pinnedSet = new Set(settings.pinnedActionIds || []);
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

  // Per-category type lookup (positive | negative).
  const catType = useMemo(() => {
    const m = {};
    for (const c of categories) m[c.name] = c.type;
    return m;
  }, [categories]);

  // Sort actions stable by category sort order.
  const sortKey = useMemo(() => {
    const m = {};
    categories
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .forEach((c, i) => (m[c.name] = i));
    return m;
  }, [categories]);

  const sortedActions = useMemo(
    () =>
      (actions || [])
        .slice()
        .sort(
          (a, b) =>
            (sortKey[a.category] ?? 999) - (sortKey[b.category] ?? 999),
        ),
    [actions, sortKey],
  );

  // Group actions by type — positive → Build, negative → Eliminate.
  // Pinned actions are excluded; Others uses the parent category recency
  // (legacy behaviour preserved).
  const positiveActions = sortedActions.filter(
    (a) =>
      (catType[a.category] || a.type) === "positive" &&
      !pinnedSet.has(a.id) &&
      activeNames.has(a.category),
  );
  const negativeActions = sortedActions.filter(
    (a) =>
      (catType[a.category] || a.type) === "negative" &&
      !pinnedSet.has(a.id) &&
      activeNames.has(a.category),
  );
  const othersActions = sortedActions.filter(
    (a) => !pinnedSet.has(a.id) && !activeNames.has(a.category),
  );

  // Fallback: brand-new users see all non-pinned actions of their type.
  const positiveCats =
    positiveActions.length === 0
      ? sortedActions.filter(
          (a) =>
            (catType[a.category] || a.type) === "positive" &&
            !pinnedSet.has(a.id),
        )
      : positiveActions;
  const negativeCats =
    negativeActions.length === 0
      ? sortedActions.filter(
          (a) =>
            (catType[a.category] || a.type) === "negative" &&
            !pinnedSet.has(a.id),
        )
      : negativeActions;
  const othersCats =
    positiveActions.length === 0 && negativeActions.length === 0 ? [] : othersActions;

  const renderSection = (id) => {
    switch (id) {
      case "carousel":
        return <DashboardCarousel key="carousel" />;
      case "dailyPlan":
        return <DailyPlanCard key="dailyPlan" />;
      case "nextDeadline":
        return <NextDeadlineWidget key="nextDeadline" />;
      case "pinnedGoals":
        return <PinnedGoalsSection key="pinnedGoals" />;
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
