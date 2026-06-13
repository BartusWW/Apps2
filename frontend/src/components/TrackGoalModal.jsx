import { useState } from "react";
import * as Icons from "lucide-react";
import { X, Check, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";
import { formatHours } from "../lib/goals";
import { computeGoalProgress } from "../lib/goalProgress";

/**
 * Lightweight quick-track sheet. Drives daily/weekly updates ONLY — never
 * structural edits. Submits via context's updateGoalProgress.
 *
 * Props
 *   open      bool
 *   goal      the live goal object (or null when closed)
 *   onClose   () => void
 */
export default function TrackGoalModal({ open, goal, onClose }) {
  const { entries, updateGoalProgress } = useApp();

  // Seed local state from a deep clone so we can stage edits and submit on Save.
  const seed = goal
    ? {
        manualPct: Number(goal.progress?.manualPct) || 0,
        valueCurrent: Number(goal.progress?.valueCurrent) || 0,
        checklist: (goal.progress?.checklist || []).map((c) => ({ ...c })),
        milestones: (goal.progress?.ongoing?.milestones || []).map((m) => ({ ...m })),
      }
    : null;
  const [draft, setDraft] = useState(seed);

  if (!open || !goal) return null;

  const Icon = Icons[goal.icon] || Icons.Target;
  const p = paletteFor(goal.color);
  const type = goal.progressType || "manual";

  const save = (e) => {
    if (e) e.preventDefault();
    const patch = {};
    if (type === "manual") patch.manualPct = Math.max(0, Math.min(100, Number(draft.manualPct) || 0));
    if (type === "value") patch.valueCurrent = Math.max(0, Number(draft.valueCurrent) || 0);
    if (type === "checklist") patch.checklist = draft.checklist;
    if (type === "ongoing") patch.ongoing = { milestones: draft.milestones };
    updateGoalProgress(goal.id, patch);
    toast(`${goal.name} updated`, {
      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
    });
    onClose();
  };

  // Preview the new pct using a synthetic goal so the user sees the impact.
  const preview = (() => {
    const next = JSON.parse(JSON.stringify(goal));
    if (type === "manual") next.progress.manualPct = draft.manualPct;
    if (type === "value") next.progress.valueCurrent = draft.valueCurrent;
    if (type === "checklist") next.progress.checklist = draft.checklist;
    if (type === "ongoing") next.progress.ongoing.milestones = draft.milestones;
    // computeGoalProgress needs stats for hours/ongoing; supply current goal stats.
    const matched = entries.filter(
      (e) => e.type === "positive" && (goal.linkedActivities || []).includes(e.category),
    );
    const minutes = matched.reduce((s, e) => s + (e.minutes || 0), 0);
    return computeGoalProgress(next, { minutes }, entries);
  })();

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      data-testid="track-goal-modal"
      onClick={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <form
        onSubmit={save}
        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-3">
          <span className={`h-10 w-10 rounded-lg flex items-center justify-center ${p.iconBg}`}>
            <Icon size={18} strokeWidth={2.5} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-extrabold uppercase tracking-tight text-base text-white truncate">
              Track {goal.name}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
              {type === "manual" && "Update progress %"}
              {type === "value" && "Update current value"}
              {type === "checklist" && "Tick what's done"}
              {type === "hours" && "Auto from logged hours"}
              {type === "ongoing" && "Mark milestones reached"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="track-modal-close"
            className="p-2 text-neutral-400 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live preview of new pct */}
        {preview.pct !== null && (
          <div data-testid="track-preview">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest mb-1">
              <span className="text-neutral-500">Preview</span>
              <span className={`font-semibold ${p.text}`}>
                {preview.primary} · {preview.pct}%
              </span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${p.dot} rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(100, preview.pct)}%` }}
              />
            </div>
          </div>
        )}

        {/* ---- Manual % ---- */}
        {type === "manual" && (
          <div className="space-y-2" data-testid="track-manual">
            <input
              type="range"
              min="0"
              max="100"
              value={draft.manualPct}
              onChange={(ev) => setDraft({ ...draft, manualPct: Number(ev.target.value) })}
              data-testid="track-manual-slider"
              className="w-full accent-emerald-500"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={draft.manualPct}
              onChange={(ev) => setDraft({ ...draft, manualPct: ev.target.value })}
              data-testid="track-manual-input"
              className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        )}

        {/* ---- Value / Max ---- */}
        {type === "value" && (
          <div className="space-y-2" data-testid="track-value">
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">
              Current {goal.progress.valueUnit || "value"}
            </label>
            <input
              type="number"
              min="0"
              value={draft.valueCurrent}
              onChange={(ev) => setDraft({ ...draft, valueCurrent: ev.target.value })}
              data-testid="track-value-current"
              className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
              Target: {goal.progress.valueTarget} {goal.progress.valueUnit}
            </p>
          </div>
        )}

        {/* ---- Checklist ---- */}
        {type === "checklist" && (
          <ul className="space-y-1.5" data-testid="track-checklist">
            {draft.checklist.length === 0 && (
              <p className="text-xs text-neutral-500">
                No checklist items yet. Open Edit to add some.
              </p>
            )}
            {draft.checklist.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2"
                data-testid={`track-checklist-row-${item.id}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      checklist: draft.checklist.map((c) =>
                        c.id === item.id ? { ...c, done: !c.done } : c,
                      ),
                    })
                  }
                  data-testid={`track-checklist-toggle-${item.id}`}
                  className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                    item.done ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                  }`}
                  aria-label="Toggle"
                >
                  {item.done && <Check size={12} strokeWidth={3} className="text-black" />}
                </button>
                <span
                  className={`text-sm flex-1 ${
                    item.done ? "line-through text-neutral-500" : "text-white"
                  }`}
                >
                  {item.label || "(unnamed)"}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* ---- Hours target — read-only ---- */}
        {type === "hours" && (
          <div className="bg-neutral-950 border border-white/10 rounded-lg p-3 space-y-2" data-testid="track-hours">
            <p className="text-xs text-neutral-400">
              Hours-target goals fill automatically from logged time on{" "}
              <span className="text-white font-semibold">
                {goal.linkedActivities?.join(", ") || "no linked activities"}
              </span>
              .
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500">Current</span>
              <span className="font-display font-extrabold text-xl text-white">
                {preview.primary}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
              Log activities from Home to add hours here.
            </p>
          </div>
        )}

        {/* ---- Ongoing — milestones ---- */}
        {type === "ongoing" && (
          <div className="space-y-2" data-testid="track-ongoing">
            <div className="grid grid-cols-3 gap-2 bg-neutral-950 border border-white/10 rounded-lg p-2.5">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-neutral-500">Lifetime</p>
                <p className={`text-sm font-semibold mt-0.5 ${p.text}`}>
                  {formatHours(preview.ongoing.lifetimeMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-neutral-500">Month</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {formatHours(preview.ongoing.monthlyMinutes)}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-neutral-500">Week</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {formatHours(preview.ongoing.weeklyMinutes)}
                </p>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
              Milestones
            </p>
            <ul className="space-y-1.5">
              {draft.milestones.length === 0 && (
                <p className="text-xs text-neutral-500">No milestones yet.</p>
              )}
              {draft.milestones.map((m) => {
                const auto = preview.ongoing.lifetimeMinutes / 60 >= (Number(m.hoursTarget) || 0);
                const checked = m.reached === true || auto;
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2"
                    data-testid={`track-milestone-row-${m.id}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          milestones: draft.milestones.map((x) =>
                            x.id === m.id ? { ...x, reached: !x.reached } : x,
                          ),
                        })
                      }
                      data-testid={`track-milestone-toggle-${m.id}`}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                        checked
                          ? "bg-amber-500 border-amber-500"
                          : "border-white/20"
                      }`}
                      aria-label="Toggle"
                    >
                      {checked && <Trophy size={11} strokeWidth={3} className="text-black" />}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        checked ? "text-amber-300" : "text-white"
                      }`}
                    >
                      {m.label || `${m.hoursTarget}h milestone`}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                      {m.hoursTarget}h
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
          >
            Cancel
          </button>
          {type !== "hours" && (
            <button
              type="submit"
              data-testid="track-modal-save"
              className="text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
            >
              <Check size={12} className="inline mr-1" />
              Save
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
