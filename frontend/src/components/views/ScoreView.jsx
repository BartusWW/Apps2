import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import StatCard from "../StatCard";
import {
  startOfWeek,
  endOfWeek,
  isInRange,
  isSameDay,
  calcStudyStreak,
} from "../../lib/dateUtils";

export default function ScoreView() {
  const { entries } = useApp();

  const stats = useMemo(() => {
    const weekStart = startOfWeek();
    const weekEnd = endOfWeek();

    let todayScore = 0;
    let weeklyScore = 0;
    let weeklyPositive = 0;
    let weeklyNegative = 0;
    let weeklyMinutes = 0;
    const categoryPositive = {};
    const categoryNegative = {};

    for (const e of entries) {
      if (isSameDay(e.date, new Date())) todayScore += e.points;
      if (isInRange(e, weekStart, weekEnd)) {
        weeklyScore += e.points;
        if (e.type === "positive") {
          weeklyMinutes += e.minutes || 0;
          weeklyPositive += e.points;
          categoryPositive[e.category] = (categoryPositive[e.category] || 0) + e.points;
        } else {
          weeklyNegative += Math.abs(e.points);
          categoryNegative[e.category] = (categoryNegative[e.category] || 0) + Math.abs(e.points);
        }
      }
    }

    const bestPositive = Object.entries(categoryPositive).sort((a, b) => b[1] - a[1])[0];
    const worstNegative = Object.entries(categoryNegative).sort((a, b) => b[1] - a[1])[0];

    return {
      todayScore,
      weeklyScore,
      weeklyHours: (weeklyMinutes / 60).toFixed(1),
      weeklyPositive,
      weeklyNegative,
      streak: calcStudyStreak(entries),
      best: bestPositive ? { name: bestPositive[0], pts: bestPositive[1] } : null,
      worst: worstNegative ? { name: worstNegative[0], pts: worstNegative[1] } : null,
    };
  }, [entries]);

  return (
    <div className="grid grid-cols-2 gap-3" data-testid="score-view">
      <div className="col-span-2 bg-neutral-900 border border-white/10 rounded-xl p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
          Today’s Score
        </p>
        <div className="flex items-end gap-2 mt-2">
          <span
            data-testid="today-score-value"
            className={`font-display font-extrabold text-6xl leading-none tracking-tighter ${
              stats.todayScore < 0
                ? "text-red-500"
                : stats.todayScore > 0
                  ? "text-emerald-400"
                  : "text-white"
            }`}
          >
            {stats.todayScore > 0 ? `+${stats.todayScore}` : stats.todayScore}
          </span>
          <span className="text-xs uppercase tracking-widest text-neutral-500 pb-2">
            points
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          Weekly score:{" "}
          <span
            data-testid="weekly-score-value"
            className={`font-semibold ${
              stats.weeklyScore < 0 ? "text-red-500" : "text-emerald-400"
            }`}
          >
            {stats.weeklyScore > 0 ? `+${stats.weeklyScore}` : stats.weeklyScore}
          </span>
        </p>
      </div>

      <div className="col-span-2 bg-neutral-900 border border-white/10 rounded-xl p-4" data-testid="build-vs-drain-card">
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
          Build vs Drain · This Week
        </p>
        <p className="font-display font-extrabold text-3xl tracking-tighter mt-1.5">
          <span className="text-emerald-400">+{stats.weeklyPositive}</span>
          <span className="text-neutral-600 mx-1.5">/</span>
          <span className="text-red-500">-{stats.weeklyNegative}</span>
        </p>
        <p className="text-[10px] text-neutral-500 mt-2 uppercase tracking-widest">
          Streak: {stats.streak} {stats.streak === 1 ? "day" : "days"} ·{" "}
          {stats.weeklyHours} hrs dev
        </p>
      </div>

      <StatCard
        label="Best Category"
        value={stats.best ? `+${stats.best.pts}` : "—"}
        tone="positive"
        sub={stats.best?.name || "No activity yet"}
        testId="best-category-card"
      />
      <StatCard
        label="Top Drain"
        value={stats.worst ? `-${stats.worst.pts}` : "—"}
        tone={stats.worst ? "negative" : "neutral"}
        sub={stats.worst?.name || "Clean week"}
        testId="worst-category-card"
      />
    </div>
  );
}
