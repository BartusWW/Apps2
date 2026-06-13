import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import HabitCard from "./HabitCard";
import { computeAllHabits, computeHabitStreaks } from "../lib/habits";
import { Target } from "lucide-react";

export default function HabitsSection() {
  const { entries, habits } = useApp();
  const progress = useMemo(() => {
    const list = computeAllHabits(habits, entries);
    return list.map((p) => ({
      ...p,
      streaks: computeHabitStreaks(p.habit, entries),
    }));
  }, [habits, entries]);

  if (!habits || habits.length === 0) {
    return (
      <section data-testid="habits-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold uppercase tracking-tight text-xl">Habits</h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Auto-tracked
          </span>
        </div>
        <div className="bg-neutral-900 border border-dashed border-white/10 rounded-xl p-6 flex items-start gap-3">
          <Target size={18} className="text-neutral-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">No habits yet</p>
            <p className="text-xs text-neutral-400 mt-1">
              Define your habits in Settings → Habits. They’ll auto-fill from your logged time.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const dailyHabits = progress.filter((p) => p.habit.period === "daily");
  const weeklyHabits = progress.filter((p) => p.habit.period === "weekly");

  return (
    <section data-testid="habits-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold uppercase tracking-tight text-xl">Habits</h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
          Auto-tracked
        </span>
      </div>

      {dailyHabits.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">
            Today
          </p>
          {dailyHabits.map((p) => (
            <HabitCard key={p.habit.id} progress={p} />
          ))}
        </div>
      )}

      {weeklyHabits.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold">
            This Week
          </p>
          {weeklyHabits.map((p) => (
            <HabitCard key={p.habit.id} progress={p} />
          ))}
        </div>
      )}
    </section>
  );
}
