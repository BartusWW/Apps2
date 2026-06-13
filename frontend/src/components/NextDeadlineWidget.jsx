import { useMemo } from "react";
import * as Icons from "lucide-react";
import { Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { computeGoalsSnapshot } from "../lib/goals";
import { paletteFor } from "../lib/categoryColors";

const HEALTH_BADGE = {
  "on-track": { label: "On Track", color: "text-emerald-400" },
  "at-risk": { label: "At Risk", color: "text-amber-400" },
  critical: { label: "Critical", color: "text-red-400" },
};

const DEADLINE_BAR = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-500",
  orange: "bg-amber-500",
  red: "bg-red-500",
};

const DEADLINE_TEXT = {
  green: "text-emerald-400",
  yellow: "text-yellow-400",
  orange: "text-amber-400",
  red: "text-red-400",
};

/**
 * Compact card on Home that surfaces the most-urgent active goal with a
 * deadline. Sorts active goals by days remaining ascending (nearest first).
 * Hidden entirely when no active goal has a deadline.
 */
export default function NextDeadlineWidget() {
  const { entries, goals } = useApp();
  const snapshot = useMemo(() => computeGoalsSnapshot(goals, entries), [goals, entries]);

  const withDeadline = snapshot.active.filter((s) => s.deadlineStats);
  if (withDeadline.length === 0) return null;

  withDeadline.sort((a, b) => a.deadlineStats.daysRemaining - b.deadlineStats.daysRemaining);
  const next = withDeadline[0];
  const moreCount = withDeadline.length - 1;

  const Icon = Icons[next.goal.icon] || Icons.Target;
  const p = paletteFor(next.goal.color);
  const ds = next.deadlineStats;
  const health = next.health && HEALTH_BADGE[next.health];

  return (
    <section
      className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3"
      data-testid="next-deadline-widget"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-semibold flex items-center gap-1.5">
          <Calendar size={11} /> Next Deadline
        </p>
        <Link
          to="/review"
          state={{ tab: "goals" }}
          data-testid="next-deadline-view-all"
          className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white flex items-center gap-0.5"
        >
          View All {moreCount > 0 && <span className="text-neutral-500">({moreCount + 1})</span>}
          <ChevronRight size={11} />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg}`}>
          <Icon size={18} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{next.goal.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5 flex items-center gap-1.5">
            <span className={DEADLINE_TEXT[ds.colorBand]}>
              {ds.overdue
                ? `${Math.abs(ds.daysRemaining)}d overdue`
                : `${ds.daysRemaining}d left · ${ds.timeRemainingPct}%`}
            </span>
            {next.goal.deadlineType === "hard" && (
              <span className="text-red-400 font-semibold">HARD</span>
            )}
          </p>
        </div>
        {health && (
          <span
            className={`text-[10px] uppercase tracking-widest font-semibold ${health.color}`}
            data-testid="next-deadline-health"
          >
            {health.label}
          </span>
        )}
      </div>

      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${DEADLINE_BAR[ds.colorBand]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, ds.timeRemainingPct)}%` }}
          data-testid="next-deadline-bar"
        />
      </div>
    </section>
  );
}
