import { useState } from "react";
import { X, Check } from "lucide-react";
import { todayISO } from "../lib/dateUtils";

export default function CompleteGoalModal({ open, goal, onConfirm, onClose }) {
  const [date, setDate] = useState(todayISO());
  const [finalNotes, setFinalNotes] = useState("");

  if (!open || !goal) return null;

  const submit = (e) => {
    e.preventDefault();
    onConfirm({
      completedAt: new Date(`${date}T12:00:00`).toISOString(),
      finalNotes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      data-testid="complete-goal-modal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-extrabold uppercase tracking-tight text-base text-white">
              Complete Goal
            </p>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 mt-0.5 truncate">
              {goal.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="complete-goal-close"
            className="p-2 text-neutral-400 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">
            Completion Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            data-testid="complete-goal-date"
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">
            Final Notes (optional)
          </label>
          <textarea
            rows={3}
            value={finalNotes}
            onChange={(e) => setFinalNotes(e.target.value)}
            placeholder="Reflections, what worked, what's next…"
            data-testid="complete-goal-notes"
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        <p className="text-[10px] uppercase tracking-widest text-neutral-500">
          A snapshot of hours, points, and allocation will be saved permanently.
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="complete-goal-confirm"
            className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
          >
            <Check size={12} className="inline mr-1" />
            Mark Completed
          </button>
        </div>
      </form>
    </div>
  );
}
