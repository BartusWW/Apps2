// Habit auto-computation helpers
import { startOfWeek, endOfWeek, isInRange, isSameDay } from "./dateUtils";

export function computeHabitProgress(habit, entries, refDate = new Date()) {
  const cats = new Set(habit.categories || []);
  const isPositive = habit.type !== "negative";
  let minutes = 0;
  const matches = [];

  if (habit.period === "daily") {
    for (const e of entries) {
      if (!cats.has(e.category)) continue;
      if (isPositive && e.type !== "positive") continue;
      if (!isPositive && e.type !== "negative") continue;
      if (!isSameDay(e.date, refDate)) continue;
      minutes += e.minutes || 0;
      matches.push(e);
    }
  } else {
    // weekly
    const wStart = startOfWeek(refDate);
    const wEnd = endOfWeek(refDate);
    for (const e of entries) {
      if (!cats.has(e.category)) continue;
      if (isPositive && e.type !== "positive") continue;
      if (!isPositive && e.type !== "negative") continue;
      if (!isInRange(e, wStart, wEnd)) continue;
      minutes += e.minutes || 0;
      matches.push(e);
    }
  }

  const goal = Math.max(1, habit.goalMinutes || 0);
  const ratio = minutes / goal;
  const completed = isPositive ? ratio >= 1 : ratio <= 1; // negative habit: completed if under cap
  let status;
  if (isPositive) {
    if (ratio >= 1) status = "completed";
    else if (ratio >= 0.66) status = "on-track";
    else if (ratio > 0) status = "in-progress";
    else status = "not-started";
  } else {
    if (ratio >= 1) status = "exceeded"; // bad
    else if (ratio >= 0.66) status = "warning";
    else status = "under-cap";
  }

  return {
    habit,
    minutes,
    goal,
    ratio,
    pct: Math.min(100, Math.round(ratio * 100)),
    completed,
    status,
    matches,
  };
}

export function computeAllHabits(habits, entries, refDate = new Date()) {
  return (habits || []).map((h) => computeHabitProgress(h, entries, refDate));
}

// For Calendar: returns # of POSITIVE habits the user completed on a specific date.
export function habitCompletionForDate(habits, entries, date) {
  const ref = new Date(`${date}T12:00:00`);
  let completed = 0;
  let total = 0;
  for (const h of habits || []) {
    if (h.type === "negative") continue; // negative habits don't count toward "completed"
    total += 1;
    const p = computeHabitProgress(h, entries, ref);
    if (p.completed) completed += 1;
  }
  return { completed, total };
}
