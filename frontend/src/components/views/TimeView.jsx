import { useApp } from "../../context/AppContext";
import { startOfWeek, endOfWeek, startOfLastWeek, isInRange, isSameDay } from "../../lib/dateUtils";
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import { useMemo } from "react";

function formatHM(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

function formatHMSigned(totalMinutes) {
  if (totalMinutes === 0) return "0m";
  const sign = totalMinutes > 0 ? "+" : "-";
  return `${sign}${formatHM(Math.abs(totalMinutes))}`;
}

export default function TimeView() {
  const { entries, settings } = useApp();
  const WEEKLY_GOAL_MIN = settings.weeklyGoalMinutes || 20 * 60;

  const data = useMemo(() => {
    const weekStart = startOfWeek();
    const weekEnd = endOfWeek();
    const lastStart = startOfLastWeek();
    const lastEnd = weekStart;

    let todayMin = 0;
    let weekMin = 0;
    let lastWeekMin = 0;
    const categoryMin = {};

    for (const e of entries) {
      if (e.type !== "positive") continue;
      const mins = e.minutes || 0;
      if (mins <= 0) continue;
      if (isSameDay(e.date, new Date())) todayMin += mins;
      if (isInRange(e, weekStart, weekEnd)) {
        weekMin += mins;
        categoryMin[e.category] = (categoryMin[e.category] || 0) + mins;
      }
      if (isInRange(e, lastStart, lastEnd)) {
        lastWeekMin += mins;
      }
    }

    const categories = Object.entries(categoryMin).sort((a, b) => b[1] - a[1]);
    const topCategory = categories[0] || null;
    const goalPct = Math.min(100, Math.round((weekMin / WEEKLY_GOAL_MIN) * 100));
    const diff = weekMin - lastWeekMin;

    return {
      todayMin,
      weekMin,
      lastWeekMin,
      categories,
      topCategory,
      goalPct,
      diff,
    };
  }, [entries, WEEKLY_GOAL_MIN]);

  const trendIcon =
    data.diff > 0 ? (
      <TrendingUp size={12} className="text-emerald-400" />
    ) : data.diff < 0 ? (
      <TrendingDown size={12} className="text-red-500" />
    ) : (
      <Minus size={12} className="text-neutral-400" />
    );

  const maxCategoryMin = Math.max(1, ...data.categories.map(([, m]) => m));

  return (
    <div className="space-y-3" data-testid="time-view">
      {/* Hero: Today's Dev Time */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
          Today’s Dev Time
        </p>
        <div className="flex items-end gap-2 mt-2">
          <span
            data-testid="today-time-value"
            className={`font-display font-extrabold text-6xl leading-none tracking-tighter ${
              data.todayMin > 0 ? "text-sky-400" : "text-white"
            }`}
          >
            {formatHM(data.todayMin)}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          This week:{" "}
          <span
            data-testid="weekly-time-value"
            className="font-semibold text-sky-400"
          >
            {formatHM(data.weekMin)}
          </span>
        </p>
      </div>

      {/* Weekly Goal Progress */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4" data-testid="weekly-goal-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target size={13} className="text-sky-400" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
              Weekly Goal
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
            {formatHM(WEEKLY_GOAL_MIN)}
          </span>
        </div>
        <div className="flex items-end justify-between gap-2 mt-2">
          <span className="font-display font-extrabold text-3xl tracking-tighter text-white">
            {formatHM(data.weekMin)}
          </span>
          <span className="font-display font-extrabold text-xl tracking-tighter text-sky-400">
            {data.goalPct}%
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${data.goalPct}%` }}
            data-testid="weekly-goal-progress-fill"
          />
        </div>
      </div>

      {/* Top Category + count */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4" data-testid="top-time-category-card">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Top Investment
          </p>
          <p className="font-display font-extrabold text-2xl tracking-tighter text-white mt-1.5">
            {data.topCategory ? formatHM(data.topCategory[1]) : "—"}
          </p>
          <p className="text-xs text-neutral-400 truncate mt-1">
            {data.topCategory ? data.topCategory[0] : "No time logged"}
          </p>
        </div>
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4" data-testid="time-trend-card">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Weekly Trend
          </p>
          <p
            className={`font-display font-extrabold text-2xl tracking-tighter mt-1.5 ${
              data.diff > 0 ? "text-emerald-400" : data.diff < 0 ? "text-red-500" : "text-white"
            }`}
          >
            {formatHMSigned(data.diff)}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 flex items-center gap-1">
            {trendIcon}
            vs last week
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-5" data-testid="time-category-breakdown">
        <h3 className="font-display font-extrabold uppercase tracking-tight text-base mb-3">
          Time by Category
        </h3>
        {data.categories.length === 0 ? (
          <p className="text-sm text-neutral-500">No development time logged this week.</p>
        ) : (
          <div className="space-y-3">
            {data.categories.map(([cat, mins]) => {
              const pct = Math.min(100, Math.round((mins / maxCategoryMin) * 100));
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-300 truncate">{cat}</span>
                    <span className="text-xs font-semibold text-sky-400">
                      {formatHM(mins)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Future Self Investment */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-5" data-testid="future-self-card">
        <h3 className="font-display font-extrabold uppercase tracking-tight text-base">
          Future Self Investment
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
          Compounding hours into the long game
        </p>
        <div className="grid grid-cols-3 text-center divide-x divide-white/10 mt-4">
          <div className="px-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">This Week</p>
            <p
              className="font-display font-extrabold text-2xl tracking-tighter mt-1 text-sky-400"
              data-testid="future-self-this-week"
            >
              {formatHM(data.weekMin)}
            </p>
          </div>
          <div className="px-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Last Week</p>
            <p
              className="font-display font-extrabold text-2xl tracking-tighter mt-1 text-neutral-300"
              data-testid="future-self-last-week"
            >
              {formatHM(data.lastWeekMin)}
            </p>
          </div>
          <div className="px-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Delta</p>
            <p
              className={`font-display font-extrabold text-2xl tracking-tighter mt-1 ${
                data.diff > 0 ? "text-emerald-400" : data.diff < 0 ? "text-red-500" : "text-white"
              }`}
              data-testid="future-self-delta"
            >
              {formatHMSigned(data.diff)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
