import { useMemo } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import StatCard from "../components/StatCard";
import QuickActionButton from "../components/QuickActionButton";
import {
  startOfWeek,
  endOfWeek,
  isInRange,
  isSameDay,
  calcStudyStreak,
} from "../lib/dateUtils";
import { Undo2 } from "lucide-react";

export default function Dashboard() {
  const { entries, actions, logAction, deleteEntry } = useApp();

  const stats = useMemo(() => {
    const weekStart = startOfWeek();
    const weekEnd = endOfWeek();
    const todayStr = new Date().toISOString().slice(0, 10);

    let todayScore = 0;
    let weeklyScore = 0;
    let weeklyMinutes = 0;
    const categoryPositive = {};
    const categoryNegative = {};

    for (const e of entries) {
      if (isSameDay(e.date, new Date())) todayScore += e.points;
      if (isInRange(e, weekStart, weekEnd)) {
        weeklyScore += e.points;
        if (e.type === "positive") {
          weeklyMinutes += e.minutes || 0;
          categoryPositive[e.category] = (categoryPositive[e.category] || 0) + e.points;
        } else {
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
      streak: calcStudyStreak(entries),
      best: bestPositive ? { name: bestPositive[0], pts: bestPositive[1] } : null,
      worst: worstNegative ? { name: worstNegative[0], pts: worstNegative[1] } : null,
    };
  }, [entries]);

  const positiveActions = actions.filter((a) => a.type === "positive");
  const negativeActions = actions.filter((a) => a.type === "negative");

  const handleClick = (action) => {
    const entry = logAction(action);
    const sign = action.points > 0 ? "+" : "";
    toast(`${action.name} logged`, {
      description: `${sign}${action.points} pts`,
      action: {
        label: "Undo",
        onClick: () => deleteEntry(entry.id),
      },
      className:
        action.type === "positive"
          ? "!bg-neutral-900 !border-emerald-500/30 !text-white"
          : "!bg-neutral-900 !border-red-500/30 !text-white",
    });
  };

  return (
    <div className="space-y-7" data-testid="dashboard-page">
      {/* Hero stat: Today's score */}
      <section className="grid grid-cols-2 gap-3" data-testid="dashboard-stats">
        <div className="col-span-2 bg-neutral-900 border border-white/10 rounded-xl p-5 relative overflow-hidden">
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

        <StatCard
          label="Dev Hours"
          value={stats.weeklyHours}
          unit="hrs / wk"
          tone="positive"
          testId="weekly-hours-card"
        />
        <StatCard
          label="Study Streak"
          value={stats.streak}
          unit={stats.streak === 1 ? "day" : "days"}
          tone="positive"
          testId="streak-card"
        />
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
      </section>

      {/* Positive actions */}
      <section data-testid="positive-actions-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-extrabold uppercase tracking-tight text-xl">
            Build
          </h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">
            + Add points
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {positiveActions.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              onClick={() => handleClick(action)}
              testId={`positive-action-${action.id}`}
            />
          ))}
          {positiveActions.length === 0 && (
            <p className="text-sm text-neutral-500">No positive actions defined. Add some in Settings.</p>
          )}
        </div>
      </section>

      {/* Negative actions */}
      <section data-testid="negative-actions-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-extrabold uppercase tracking-tight text-xl">
            Eliminate
          </h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-red-500 font-semibold">
            – Costs points
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {negativeActions.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              onClick={() => handleClick(action)}
              testId={`negative-action-${action.id}`}
            />
          ))}
          {negativeActions.length === 0 && (
            <p className="text-sm text-neutral-500">No negative actions defined.</p>
          )}
        </div>
      </section>

      {/* Footer caption */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 pt-2">
        <Undo2 size={12} />
        <span>Tap “Undo” in the toast after any action to revert.</span>
      </div>
    </div>
  );
}
