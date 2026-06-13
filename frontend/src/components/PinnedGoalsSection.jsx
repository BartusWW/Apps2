import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Pin, Play, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { computeGoalsSnapshot } from "../lib/goals";
import { paletteFor } from "../lib/categoryColors";
import TrackGoalModal from "./TrackGoalModal";

const DEADLINE_TEXT = {
  green: "text-emerald-400",
  yellow: "text-yellow-400",
  orange: "text-amber-400",
  red: "text-red-400",
};

const HEALTH_TEXT = {
  "on-track": "text-emerald-400",
  "at-risk": "text-amber-400",
  critical: "text-red-400",
};

const HEALTH_LABEL = {
  "on-track": "On Track",
  "at-risk": "At Risk",
  critical: "Critical",
};

/**
 * Compact Home section showing only pinned active goals.
 * Each row shows: icon · name · primary progress · deadline (when present) · TRACK.
 */
export default function PinnedGoalsSection() {
  const { entries, goals } = useApp();
  const snapshot = useMemo(() => computeGoalsSnapshot(goals, entries), [goals, entries]);
  const [tracking, setTracking] = useState(null);

  const pinned = snapshot.active.filter((s) => s.goal.pinned);
  if (pinned.length === 0) return null;

  return (
    <section className="space-y-2.5" data-testid="pinned-goals-section">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold flex items-center gap-1.5">
          <Pin size={11} fill="currentColor" /> Pinned Goals
        </p>
        <Link
          to="/review"
          data-testid="pinned-goals-view-all"
          className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white flex items-center gap-0.5"
        >
          View All
          <ChevronRight size={11} />
        </Link>
      </div>

      <ul className="space-y-2">
        {pinned.map((s) => {
          const Icon = Icons[s.goal.icon] || Icons.Target;
          const p = paletteFor(s.goal.color);
          const ds = s.deadlineStats;
          const prog = s.progress;
          return (
            <li
              key={s.goal.id}
              className="bg-neutral-900 border border-white/10 rounded-xl p-3 flex items-center gap-3"
              data-testid={`pinned-goal-${s.goal.id}`}
            >
              <span className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg}`}>
                <Icon size={18} strokeWidth={2.5} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{s.goal.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate mt-0.5">
                  {prog && prog.pct !== null && (
                    <span className={p.text + " font-semibold"}>
                      {prog.primary}
                      {prog.pct !== null ? ` · ${prog.pct}%` : ""}
                    </span>
                  )}
                  {prog && prog.pct === null && (
                    <span className={p.text + " font-semibold"}>{prog.primary}</span>
                  )}
                  {ds && (
                    <span className={`ml-1.5 ${DEADLINE_TEXT[ds.colorBand]}`}>
                      · {ds.overdue ? `${Math.abs(ds.daysRemaining)}d over` : `${ds.daysRemaining}d left`}
                    </span>
                  )}
                  {s.health && (
                    <span className={`ml-1.5 ${HEALTH_TEXT[s.health]}`}>
                      · {HEALTH_LABEL[s.health]}
                    </span>
                  )}
                </p>
                {/* Progress bar (non-ongoing) */}
                {prog && prog.pct !== null && (
                  <div className="h-1 mt-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${p.dot} rounded-full`}
                      style={{ width: `${Math.min(100, prog.pct)}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTracking(s.goal)}
                data-testid={`pinned-goal-track-${s.goal.id}`}
                className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold px-3 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
              >
                <Play size={10} strokeWidth={3} fill="currentColor" />
                Track
              </button>
            </li>
          );
        })}
      </ul>

      <TrackGoalModal
        open={!!tracking}
        goal={tracking ? goals.find((g) => g.id === tracking.id) : null}
        onClose={() => setTracking(null)}
        key={`pinned-track-${tracking?.id || "none"}`}
      />
    </section>
  );
}
