import { useState } from "react";
import * as Icons from "lucide-react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Archive,
  CheckCircle2,
  Trash2,
  Calendar,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { paletteFor } from "../lib/categoryColors";
import { formatHours, formatDuration, daysEarlyOrLate } from "../lib/goals";

const ALIGNMENT_BADGE = {
  ahead: { label: "Ahead", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  "on-track": { label: "On Track", color: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/30" },
  behind: { label: "Behind", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
};

const HEALTH_BADGE = {
  "on-track": { label: "On Track", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  "at-risk": { label: "At Risk", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" },
  completed: { label: "Completed", color: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/30" },
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

function daysBetweenISO(a, b) {
  if (!a || !b) return 0;
  const s = new Date(a.slice(0, 10));
  const e = new Date(b.slice(0, 10));
  return Math.max(0, Math.round((e - s) / 86400000));
}

function Metric({ label, value, accent = "text-white", testId }) {
  return (
    <div data-testid={testId}>
      <p className="text-[9px] uppercase tracking-widest text-neutral-500">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${accent}`}>{value}</p>
    </div>
  );
}

export default function GoalCard({
  snapshot,
  defaultExpanded = false,
  showActions = true,
  onEdit,
  onArchive,
  onComplete,
  onDelete,
}) {
  const {
    goal,
    stats,
    breakdown,
    actualPct,
    targetPct,
    diff,
    status,
    deadlineStats,
    health,
  } = snapshot;
  const [open, setOpen] = useState(defaultExpanded);
  const Icon = Icons[goal.icon] || Icons.Target;
  const p = paletteFor(goal.color);

  const metrics = goal.displayMetrics || {};
  const isCompact = goal.viewMode === "compact";
  const diffLabel = diff > 0 ? `+${diff}%` : `${diff}%`;
  const dStats = deadlineStats; // may be null

  // Status badge: prefer deadline health (when there's a deadline), else alignment.
  const useHealth = !!dStats && !!health;
  const badge = useHealth ? HEALTH_BADGE[health] : ALIGNMENT_BADGE[status] || ALIGNMENT_BADGE["on-track"];

  // Header subtitle compose — built up from enabled metrics in priority order.
  const subtitleParts = [];
  if (metrics.targetAllocation) subtitleParts.push(`Target ${targetPct}%`);
  if (metrics.actualAllocation) subtitleParts.push(`Actual ${actualPct}%`);
  if (metrics.alignment) subtitleParts.push(diffLabel);
  if (metrics.priorityWeight) subtitleParts.push(`P${goal.priorityWeight}/10`);
  if (dStats && metrics.daysRemaining) {
    subtitleParts.push(
      dStats.overdue ? `${Math.abs(dStats.daysRemaining)}d over` : `${dStats.daysRemaining}d left`,
    );
  }
  if (dStats && metrics.timeRemainingPct) {
    subtitleParts.push(`${dStats.timeRemainingPct}% time`);
  }

  // Compact rendering — name + 1 primary metric chip + badge.
  if (isCompact && !open) {
    const compactValue = metrics.goalHours
      ? formatHours(stats.minutes)
      : metrics.priorityWeight
        ? `P${goal.priorityWeight}/10`
        : metrics.actualAllocation
          ? `${actualPct}%`
          : "—";
    return (
      <article
        className="bg-neutral-900 border border-white/10 rounded-xl p-3 flex items-center gap-3"
        data-testid={`goal-card-${goal.id}`}
      >
        <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg}`}>
          <Icon size={16} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{goal.name}</p>
          <p className={`text-xs font-semibold ${p.text}`}>{compactValue}</p>
        </div>
        {metrics.deadlineStatus && badge && (
          <span
            className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border ${badge.bg} ${badge.color}`}
            data-testid={`goal-status-${goal.id}`}
          >
            {badge.label}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid={`goal-toggle-${goal.id}`}
          aria-label="Expand"
          className="p-1 text-neutral-500 hover:text-white"
        >
          <Maximize2 size={13} />
        </button>
      </article>
    );
  }

  return (
    <article
      className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden"
      data-testid={`goal-card-${goal.id}`}
    >
      <header className="px-4 py-3 flex items-center gap-3">
        <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg}`}>
          <Icon size={16} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{goal.name}</p>
          {subtitleParts.length > 0 && (
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">
              {subtitleParts.join(" · ")}
            </p>
          )}
        </div>
        {metrics.deadlineStatus && badge && (
          <span
            className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border ${badge.bg} ${badge.color}`}
            data-testid={`goal-status-${goal.id}`}
          >
            {badge.label}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          data-testid={`goal-toggle-${goal.id}`}
          aria-label={open ? "Collapse" : "Expand"}
          className="p-1 text-neutral-500 hover:text-white"
        >
          {isCompact ? (
            <Minimize2 size={13} />
          ) : open ? (
            <ChevronUp size={15} />
          ) : (
            <ChevronDown size={15} />
          )}
        </button>
      </header>

      {/* Alignment progress bar — target ghost + actual filled */}
      {(metrics.targetAllocation || metrics.actualAllocation) && (
        <div className="px-4 pb-3" data-testid={`goal-bar-${goal.id}`}>
          <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-neutral-700"
              style={{ width: `${Math.min(100, targetPct)}%` }}
              aria-label="Target allocation"
            />
            <div
              className={`absolute inset-y-0 left-0 ${p.dot} rounded-full`}
              style={{ width: `${Math.min(100, actualPct)}%` }}
              aria-label="Actual allocation"
            />
          </div>
        </div>
      )}

      {/* Deadline urgency bar (separate visual) */}
      {dStats && (metrics.timeRemainingPct || metrics.daysRemaining) && (
        <div className="px-4 pb-3 space-y-1" data-testid={`goal-deadline-bar-${goal.id}`}>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span className="text-neutral-500 flex items-center gap-1">
              <Calendar size={9} /> Deadline
              {goal.deadlineType === "hard" && (
                <span className="ml-1 text-red-400">HARD</span>
              )}
            </span>
            <span className={`font-semibold ${DEADLINE_TEXT[dStats.colorBand]}`}>
              {dStats.overdue
                ? `${Math.abs(dStats.daysRemaining)}d overdue`
                : `${dStats.daysRemaining}d left · ${dStats.timeRemainingPct}%`}
            </span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${DEADLINE_BAR[dStats.colorBand]} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, dStats.timeRemainingPct)}%` }}
            />
          </div>
        </div>
      )}

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Metric grid — only enabled metrics */}
          <section
            className="grid grid-cols-3 gap-2"
            data-testid={`goal-metrics-${goal.id}`}
          >
            {metrics.goalHours && (
              <Metric
                label="Hours"
                value={formatHours(stats.minutes)}
                testId={`goal-metric-hours-${goal.id}`}
              />
            )}
            {metrics.goalPoints && (
              <Metric
                label="Points"
                value={stats.points}
                testId={`goal-metric-points-${goal.id}`}
              />
            )}
            {metrics.priorityWeight && (
              <Metric
                label="Priority"
                value={`${goal.priorityWeight}/10`}
                accent="text-amber-300"
                testId={`goal-metric-priority-${goal.id}`}
              />
            )}
            {metrics.daysRemaining && dStats && (
              <Metric
                label="Days Left"
                value={dStats.overdue ? `+${Math.abs(dStats.daysRemaining)}` : dStats.daysRemaining}
                accent={DEADLINE_TEXT[dStats.colorBand]}
                testId={`goal-metric-days-${goal.id}`}
              />
            )}
            {metrics.timeRemainingPct && dStats && (
              <Metric
                label="Time Left"
                value={`${dStats.timeRemainingPct}%`}
                accent={DEADLINE_TEXT[dStats.colorBand]}
                testId={`goal-metric-timepct-${goal.id}`}
              />
            )}
            {metrics.createdDate && (
              <Metric
                label="Created"
                value={goal.createdAt ? goal.createdAt.slice(0, 10) : "—"}
                testId={`goal-metric-created-${goal.id}`}
              />
            )}
            {metrics.lastActivity && (
              <Metric
                label="Last"
                value={stats.lastActivity || "—"}
                testId={`goal-metric-last-${goal.id}`}
              />
            )}
            {metrics.alignment && (
              <Metric
                label="Alignment"
                value={diffLabel}
                accent={diff >= 0 ? "text-emerald-400" : "text-amber-400"}
                testId={`goal-metric-alignment-${goal.id}`}
              />
            )}
          </section>

          {/* Breakdown */}
          <section data-testid={`goal-breakdown-${goal.id}`}>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">
              Breakdown by Activity
            </p>
            {breakdown.length === 0 ? (
              <p className="text-xs text-neutral-500">No activity logged yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {breakdown.map((b) => (
                  <li key={b.category} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate text-neutral-300">{b.category}</span>
                    <span className="text-white font-semibold">{formatHours(b.minutes)}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2 text-sm pt-1.5 border-t border-white/5">
                  <span className={`flex-1 text-[10px] uppercase tracking-widest font-semibold ${p.text}`}>
                    Total
                  </span>
                  <span className={`font-display font-extrabold text-lg ${p.text}`}>
                    {formatHours(stats.minutes)}
                  </span>
                </li>
              </ul>
            )}
          </section>

          {goal.description && (
            <p className="text-xs text-neutral-400 italic">{goal.description}</p>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => onEdit?.(goal)}
                data-testid={`goal-edit-${goal.id}`}
                className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1.5 rounded-md border border-white/15 text-neutral-200 hover:bg-white/5 flex items-center gap-1"
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                type="button"
                onClick={() => onComplete?.(goal)}
                data-testid={`goal-complete-${goal.id}`}
                className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1.5 rounded-md bg-emerald-500 text-black hover:bg-emerald-400 flex items-center gap-1"
              >
                <CheckCircle2 size={11} /> Mark Completed
              </button>
              <button
                type="button"
                onClick={() => onArchive?.(goal)}
                data-testid={`goal-archive-${goal.id}`}
                className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1.5 rounded-md border border-white/15 text-neutral-300 hover:bg-white/5 flex items-center gap-1"
              >
                <Archive size={11} /> Archive
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(goal)}
                data-testid={`goal-delete-${goal.id}`}
                className="ml-auto p-1.5 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Compact card for completed goal history.
 * Uses the goal's completion snapshot (preserved fields) instead of live entries.
 */
export function CompletedGoalCard({ goal }) {
  const Icon = Icons[goal.icon] || Icons.Target;
  const p = paletteFor(goal.color);
  const duration = goal.createdAt && goal.completedAt
    ? daysBetweenISO(goal.createdAt, goal.completedAt)
    : 0;
  const minutes = (goal.hoursAtCompletion || 0) * 60;
  const delta = daysEarlyOrLate(goal); // null | + early | - late

  return (
    <article
      className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-2"
      data-testid={`completed-goal-${goal.id}`}
    >
      <div className="flex items-center gap-3">
        <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg}`}>
          <Icon size={16} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{goal.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">
            Completed {goal.completedAt ? goal.completedAt.slice(0, 10) : ""}
          </p>
        </div>
        <CheckCircle2 size={14} className="text-emerald-400" />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">Hours</p>
          <p className="font-display font-extrabold text-lg text-white">
            {formatHours(minutes)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">Points</p>
          <p className="font-display font-extrabold text-lg text-white">
            {goal.pointsAtCompletion || 0}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">Duration</p>
          <p className="font-display font-extrabold text-lg text-white">
            {formatDuration(duration)}
          </p>
        </div>
      </div>

      {goal.deadline && (
        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] uppercase tracking-widest">
          <span className="text-neutral-500 flex items-center gap-1">
            <Calendar size={9} /> Deadline {goal.deadline.slice(0, 10)}
          </span>
          {delta !== null && (
            <span
              className={`font-semibold ${
                delta > 0
                  ? "text-emerald-400"
                  : delta < 0
                    ? "text-red-400"
                    : "text-sky-400"
              }`}
              data-testid={`completed-delta-${goal.id}`}
            >
              {delta > 0
                ? `${delta} day${delta === 1 ? "" : "s"} early`
                : delta < 0
                  ? `${Math.abs(delta)} day${Math.abs(delta) === 1 ? "" : "s"} late`
                  : "On time"}
            </span>
          )}
        </div>
      )}

      {goal.finalNotes && (
        <p className="text-xs text-neutral-400 italic pt-1">&ldquo;{goal.finalNotes}&rdquo;</p>
      )}
    </article>
  );
}
