import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import {
  Target,
  Trophy,
  Clock,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { computeGoalsSnapshot, formatHours, formatDuration } from "../../lib/goals";
import { paletteFor } from "../../lib/categoryColors";
import GoalCard, { CompletedGoalCard } from "../GoalCard";
import GoalForm from "../GoalForm";
import CompleteGoalModal from "../CompleteGoalModal";
import TrackGoalModal from "../TrackGoalModal";

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

function StatTile({ label, value, sub, accent = "text-white", testId }) {
  return (
    <div
      className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-3"
      data-testid={testId}
    >
      <p className="text-[10px] uppercase tracking-widest text-neutral-500">{label}</p>
      <p className={`font-display font-extrabold text-2xl tracking-tighter mt-0.5 ${accent}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function AllocationBars({ snapshots }) {
  const items = useMemo(
    () =>
      [...snapshots].sort((a, b) => b.actualPct - a.actualPct),
    [snapshots],
  );
  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No goal-linked activity logged yet.
      </p>
    );
  }
  return (
    <div className="space-y-2" data-testid="goal-allocation-bars">
      {items.map((s) => {
        const p = paletteFor(s.goal.color);
        return (
          <div key={s.goal.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-200 truncate">{s.goal.name}</span>
              <span className={`font-semibold ${p.text}`}>{s.actualPct}%</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${p.dot} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(100, s.actualPct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GoalsReviewView() {
  const { entries, goals, addGoal, updateGoal, completeGoal, archiveGoal, deleteGoal, restoreGoal, togglePinGoal } = useApp();
  const snapshot = useMemo(() => computeGoalsSnapshot(goals, entries), [goals, entries]);
  const { active, completed, archived, totals } = snapshot;

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [completingGoal, setCompletingGoal] = useState(null);
  const [trackingGoal, setTrackingGoal] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const openCreate = () => {
    setEditingGoal(null);
    setFormOpen(true);
  };
  const openEdit = (goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };
  const handleSave = (payload) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, payload);
      toast("Goal updated", {
        className: "!bg-neutral-900 !border-white/10 !text-white",
      });
    } else {
      addGoal(payload);
      toast("Goal created", {
        className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
      });
    }
    setFormOpen(false);
    setEditingGoal(null);
  };

  const handleComplete = ({ completedAt, finalNotes }) => {
    completeGoal(completingGoal.id, { completedAt, finalNotes });
    toast(`${completingGoal.name} completed`, {
      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
    });
    setCompletingGoal(null);
  };

  const handleArchive = (goal) => {
    archiveGoal(goal.id);
    toast(`${goal.name} archived`, {
      className: "!bg-neutral-900 !border-white/10 !text-white",
    });
  };
  const handleDelete = (goal) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${goal.name}"? This cannot be undone.`)) {
      return;
    }
    deleteGoal(goal.id);
    toast(`${goal.name} deleted`, {
      className: "!bg-neutral-900 !border-red-500/30 !text-white",
    });
  };

  return (
    <div className="space-y-6" data-testid="goals-review-view">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl uppercase tracking-tight">
            Strategic Goals
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
            Are you investing time in the future you want?
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          data-testid="new-goal-btn"
          className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-1.5 hover:bg-emerald-500/10"
        >
          <Plus size={12} /> New
        </button>
      </header>

      {/* Section 1 — Investment Overview */}
      <section data-testid="goal-overview" className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">
          Investment Overview
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            label="Active Goals"
            value={totals.activeCount}
            sub={<span><Target size={9} className="inline mr-0.5" />Strategic</span>}
            accent="text-emerald-400"
            testId="overview-active"
          />
          <StatTile
            label="Completed"
            value={totals.completedCount}
            sub={<span><Trophy size={9} className="inline mr-0.5" />Shipped</span>}
            accent="text-sky-400"
            testId="overview-completed"
          />
          <StatTile
            label="Goal Hours"
            value={formatHours(totals.totalMinutes)}
            accent="text-white"
            testId="overview-hours"
          />
          <StatTile
            label="Goal Points"
            value={totals.totalPoints.toLocaleString()}
            accent="text-white"
            testId="overview-points"
          />
          <div className="col-span-2">
            <StatTile
              label="Average Completion"
              value={totals.avgCompletionDays > 0 ? formatDuration(totals.avgCompletionDays) : "—"}
              sub={<span><Clock size={9} className="inline mr-0.5" />Across history</span>}
              accent="text-amber-400"
              testId="overview-avg"
            />
          </div>
        </div>
      </section>

      {/* Section 2 — Goal Allocation */}
      <section data-testid="goal-allocation" className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold">
          Goal Allocation · Where dev time actually went
        </p>
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
          <AllocationBars snapshots={active} />
        </div>
      </section>

      {/* Upcoming Deadlines — sorted by urgency */}
      {(() => {
        const withDeadline = active
          .filter((s) => s.deadlineStats)
          .sort((a, b) => a.deadlineStats.daysRemaining - b.deadlineStats.daysRemaining);
        if (withDeadline.length === 0) return null;
        return (
          <section data-testid="upcoming-deadlines" className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-semibold flex items-center gap-1.5">
              <Calendar size={11} /> Upcoming Deadlines
            </p>
            <ul className="space-y-1.5">
              {withDeadline.map((s) => {
                const Icon = Icons[s.goal.icon] || Icons.Target;
                const p = paletteFor(s.goal.color);
                const ds = s.deadlineStats;
                return (
                  <li
                    key={s.goal.id}
                    className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-3"
                    data-testid={`upcoming-row-${s.goal.id}`}
                  >
                    <span className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text}`}>
                      <Icon size={13} strokeWidth={2.5} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {s.goal.name}
                        {s.goal.deadlineType === "hard" && (
                          <span className="ml-1.5 text-[9px] uppercase tracking-widest text-red-400 font-semibold">
                            HARD
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
                        <span className={DEADLINE_TEXT[ds.colorBand]}>
                          {ds.overdue
                            ? `${Math.abs(ds.daysRemaining)}d overdue`
                            : `${ds.daysRemaining}d · ${ds.timeRemainingPct}%`}
                        </span>
                        {" · "}P{s.goal.priorityWeight}/10
                      </p>
                    </div>
                    {s.health && (
                      <span
                        className={`text-[10px] uppercase tracking-widest font-semibold ${HEALTH_TEXT[s.health]}`}
                        data-testid={`upcoming-health-${s.goal.id}`}
                      >
                        {HEALTH_LABEL[s.health]}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}

      {/* Section 3 + 4 — Alignment + Breakdown (combined per goal card) */}
      <section data-testid="goal-alignment" className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em] text-violet-400 font-semibold">
            Alignment · Target vs Actual
          </p>
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
            Tap a goal to expand
          </span>
        </div>
        {active.length === 0 ? (
          <div className="bg-neutral-900 border border-dashed border-white/10 rounded-xl p-6 flex items-start gap-3">
            <Sparkles size={16} className="text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">No active goals yet</p>
              <p className="text-xs text-neutral-400 mt-1">
                Goals are the strategic layer above categories. Create your first one
                to see allocation, alignment, and breakdown.
              </p>
              <button
                type="button"
                onClick={openCreate}
                data-testid="empty-create-goal-btn"
                className="mt-3 text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
              >
                <Plus size={12} className="inline mr-1" /> Create Goal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((s) => (
              <GoalCard
                key={s.goal.id}
                snapshot={s}
                onEdit={openEdit}
                onArchive={handleArchive}
                onComplete={(g) => setCompletingGoal(g)}
                onDelete={handleDelete}
                onTrack={(g) => setTrackingGoal(g)}
                onPin={(g) => {
                  togglePinGoal(g.id);
                  toast(g.pinned ? `${g.name} unpinned` : `${g.name} pinned to Home`, {
                    className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
                  });
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 5 — Completed Goals History */}
      <section data-testid="goal-history" className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-semibold flex items-center gap-1.5">
          <Trophy size={11} /> Completed Goals
        </p>
        {completed.length === 0 ? (
          <p className="text-sm text-neutral-500">No completed goals yet.</p>
        ) : (
          <div className="space-y-2">
            {completed.map((g) => (
              <CompletedGoalCard key={g.id} goal={g} />
            ))}
          </div>
        )}
      </section>

      {/* Archived (collapsible) */}
      {archived.length > 0 && (
        <section data-testid="goal-archived" className="space-y-2">
          <button
            type="button"
            onClick={() => setShowArchived((s) => !s)}
            data-testid="toggle-archived"
            className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/5"
          >
            <span className="h-7 w-7 rounded-md flex items-center justify-center bg-neutral-700/30 text-neutral-400">
              <Icons.Archive size={13} strokeWidth={2.5} />
            </span>
            <span className="flex-1 text-left text-sm font-semibold text-white">Archived</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500">
              {archived.length}
            </span>
            {showArchived ? <ChevronUp size={15} className="text-neutral-500" /> : <ChevronDown size={15} className="text-neutral-500" />}
          </button>
          {showArchived && (
            <ul className="space-y-1.5">
              {archived.map((g) => {
                const Icon = Icons[g.icon] || Icons.Target;
                const p = paletteFor(g.color);
                return (
                  <li
                    key={g.id}
                    className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-3"
                    data-testid={`archived-row-${g.id}`}
                  >
                    <span className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text} opacity-70`}>
                      <Icon size={13} strokeWidth={2.5} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-300 truncate">{g.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                        Target {g.targetAllocation || 0}% · Priority {g.priorityWeight || 5}/10
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        restoreGoal(g.id);
                        toast(`${g.name} restored`, {
                          className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
                        });
                      }}
                      data-testid={`restore-goal-${g.id}`}
                      className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1.5 rounded-md border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g)}
                      data-testid={`delete-archived-${g.id}`}
                      className="p-1.5 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                      aria-label="Delete"
                    >
                      <Icons.Trash2 size={13} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <GoalForm
        open={formOpen}
        initial={editingGoal}
        onSave={handleSave}
        onClose={() => {
          setFormOpen(false);
          setEditingGoal(null);
        }}
        key={formOpen ? `goal-form-${editingGoal?.id || "new"}-open` : "goal-form-closed"}
      />
      <CompleteGoalModal
        open={!!completingGoal}
        goal={completingGoal}
        onConfirm={handleComplete}
        onClose={() => setCompletingGoal(null)}
        key={`complete-${completingGoal?.id || "none"}`}
      />
      <TrackGoalModal
        open={!!trackingGoal}
        goal={trackingGoal ? goals.find((g) => g.id === trackingGoal.id) : null}
        onClose={() => setTrackingGoal(null)}
        key={`track-${trackingGoal?.id || "none"}`}
      />
    </div>
  );
}
