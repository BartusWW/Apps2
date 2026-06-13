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

// ---------- Streaks ----------
// Streaks are computed for POSITIVE habits only. Negative habit "streaks" would
// require enumerating every day the user did NOT do something, which we
// intentionally avoid to keep the UI minimal.
//
// A period (day or week) counts toward the streak when minutes logged for the
// habit's categories meet the goal in that period.

function dayKey(d) {
  return d.toISOString().slice(0, 10);
}

function periodKey(period, dateStr) {
  if (period === "daily") return dateStr;
  const d = new Date(`${dateStr}T12:00:00`);
  return dayKey(startOfWeek(d)); // Monday-anchored ISO date
}

function currentPeriodKey(period, refDate = new Date()) {
  if (period === "daily") return dayKey(refDate);
  return dayKey(startOfWeek(refDate));
}

function prevPeriodKey(period, key) {
  const d = new Date(`${key}T12:00:00`);
  if (period === "daily") d.setDate(d.getDate() - 1);
  else d.setDate(d.getDate() - 7);
  return dayKey(d);
}

export function computeHabitStreaks(habit, entries, refDate = new Date()) {
  if (habit.type === "negative") return { current: 0, best: 0 };
  const cats = new Set(habit.categories || []);
  const goal = Math.max(1, habit.goalMinutes || 0);

  // Sum minutes per period bucket.
  const buckets = new Map();
  for (const e of entries) {
    if (e.type !== "positive") continue;
    if (!cats.has(e.category)) continue;
    const key = periodKey(habit.period, e.date);
    buckets.set(key, (buckets.get(key) || 0) + (e.minutes || 0));
  }

  // Set of period keys that hit the goal.
  const completed = new Set();
  for (const [k, mins] of buckets) {
    if (mins >= goal) completed.add(k);
  }

  // ----- Current streak -----
  // Walk backwards from the current period. If the current period hasn't
  // been completed yet, allow the streak to anchor on the PREVIOUS period
  // (so a user mid-day still sees yesterday's streak).
  let current = 0;
  let cursor = currentPeriodKey(habit.period, refDate);
  if (!completed.has(cursor)) cursor = prevPeriodKey(habit.period, cursor);
  while (completed.has(cursor)) {
    current += 1;
    cursor = prevPeriodKey(habit.period, cursor);
  }

  // ----- Best streak (longest consecutive run in history) -----
  const sortedKeys = [...completed].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of sortedKeys) {
    if (prev === null || prevPeriodKey(habit.period, k) === prev) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = k;
  }

  return { current, best };
}

