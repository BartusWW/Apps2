import { useApp } from "../context/AppContext";
import { Sunrise, Moon, Check, Minus, X } from "lucide-react";
import { todayISO } from "../lib/dateUtils";

export default function DailyPlanCard({ date }) {
  const { dailyPlans, updateDailyPlan } = useApp();
  const d = date || todayISO();
  const plan = dailyPlans[d] || {};

  const setFocus = (focus) => updateDailyPlan(d, { focus });
  const setCompleted = (val) => updateDailyPlan(d, { completed: val });

  return (
    <section
      className="bg-neutral-900 border border-white/10 rounded-xl p-5 space-y-4"
      data-testid="daily-plan-card"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
          Today’s Focus
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">
          {d}
        </span>
      </div>

      {/* Morning */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sunrise size={12} className="text-amber-400" />
          <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
            Morning · Most Important Task
          </label>
        </div>
        <input
          type="text"
          value={plan.focus || ""}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="One sharp focus for today…"
          data-testid="daily-plan-focus-input"
          className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Evening review */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Moon size={12} className="text-sky-400" />
          <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
            Evening · Did You Complete It?
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCompleted(plan.completed === true ? null : true)}
            data-testid="daily-plan-completed-yes"
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs uppercase tracking-widest font-semibold transition-colors ${
              plan.completed === true
                ? "bg-emerald-500 text-black border-emerald-500"
                : "border-white/15 text-neutral-300 hover:bg-white/5"
            }`}
          >
            <Check size={13} /> Yes
          </button>
          <button
            type="button"
            onClick={() => setCompleted(plan.completed === false ? null : false)}
            data-testid="daily-plan-completed-no"
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs uppercase tracking-widest font-semibold transition-colors ${
              plan.completed === false
                ? "bg-red-500 text-black border-red-500"
                : "border-white/15 text-neutral-300 hover:bg-white/5"
            }`}
          >
            <X size={13} /> No
          </button>
          <button
            type="button"
            onClick={() => setCompleted(null)}
            data-testid="daily-plan-completed-clear"
            className="px-2 py-2 rounded-lg border border-white/10 text-neutral-500 hover:text-white"
            aria-label="Clear"
          >
            <Minus size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
