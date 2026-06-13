import { useState } from "react";
import * as Icons from "lucide-react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Archive,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { paletteFor } from "../lib/categoryColors";
import { formatHours, formatDuration } from "../lib/goals";

const STATUS_BADGE = {
  ahead: { label: "Ahead", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  "on-track": { label: "On Track", color: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/30" },
  behind: { label: "Behind", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
};

function daysBetweenISO(a, b) {
  if (!a || !b) return 0;
  const s = new Date(a.slice(0, 10));
  const e = new Date(b.slice(0, 10));
  return Math.max(0, Math.round((e - s) / 86400000));
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
  const { goal, stats, breakdown, actualPct, targetPct, diff, status } = snapshot;
  const [open, setOpen] = useState(defaultExpanded);
  const Icon = Icons[goal.icon] || Icons.Target;
  const p = paletteFor(goal.color);
  const badge = STATUS_BADGE[status] || STATUS_BADGE["on-track"];
  const diffLabel = diff > 0 ? `+${diff}%` : `${diff}%`;
  const lastActivityDays = stats.lastActivity
    ? daysBetweenISO(stats.lastActivity, new Date().toISOString())
    : null;

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
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">
            Target {targetPct}% · Actual {actualPct}% · {diffLabel}
          </p>
        </div>
        <span
          className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border ${badge.bg} ${badge.color}`}
          data-testid={`goal-status-${goal.id}`}
        >
          {badge.label}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          data-testid={`goal-toggle-${goal.id}`}
          aria-label={open ? "Collapse" : "Expand"}
          className="p-1 text-neutral-500 hover:text-white"
        >
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </header>

      {/* Alignment bar — twin progress: target ghost vs actual filled */}
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

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
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

          {/* Timeline */}
          <section data-testid={`goal-timeline-${goal.id}`} className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Created</p>
              <p className="text-xs text-white mt-0.5">
                {goal.createdAt ? goal.createdAt.slice(0, 10) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Last Activity</p>
              <p className="text-xs text-white mt-0.5">
                {stats.lastActivity || "—"}
                {lastActivityDays !== null && (
                  <span className="text-neutral-500 ml-1">
                    {lastActivityDays === 0 ? "today" : `${lastActivityDays}d ago`}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Priority</p>
              <p className="text-xs text-white mt-0.5">{goal.priorityWeight}/10</p>
            </div>
          </section>

          {goal.description && (
            <p className="text-xs text-neutral-400 italic">{goal.description}</p>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1.5 pt-1">
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

      {goal.finalNotes && (
        <p className="text-xs text-neutral-400 italic pt-1">&ldquo;{goal.finalNotes}&rdquo;</p>
      )}
    </article>
  );
}
