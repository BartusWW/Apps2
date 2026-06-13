// Pure compute helpers for the Goals System.
// Goals are a strategic layer that link many categories/habits together and
// compare TARGET allocation vs ACTUAL allocation of dev time.

import { DEFAULT_DISPLAY_METRICS } from "./migrations";
import { computeGoalProgress } from "./goalProgress";
import { localISO } from "./dateUtils";

// ---------- Display presets ----------
// Each preset is a set of metric keys to enable; everything else is hidden.
export const DISPLAY_PRESETS = {
  deadline: {
    label: "Deadline Focus",
    enabled: ["daysRemaining", "timeRemainingPct", "deadlineStatus", "priorityWeight"],
  },
  investment: {
    label: "Time Investment",
    enabled: ["goalHours", "goalPoints", "actualAllocation", "alignment", "lastActivity"],
  },
  balanced: {
    label: "Balanced",
    enabled: [
      "goalHours",
      "priorityWeight",
      "actualAllocation",
      "targetAllocation",
      "alignment",
      "daysRemaining",
      "deadlineStatus",
      "lastActivity",
    ],
  },
  minimal: {
    label: "Minimal",
    enabled: ["goalHours"],
  },
  custom: {
    label: "Custom",
    enabled: null, // user-defined; do not override
  },
};

export function metricsForPreset(presetId, existing = {}) {
  const preset = DISPLAY_PRESETS[presetId];
  if (!preset || !preset.enabled) return { ...DEFAULT_DISPLAY_METRICS, ...existing };
  const set = new Set(preset.enabled);
  const next = {};
  for (const key of Object.keys(DEFAULT_DISPLAY_METRICS)) {
    next[key] = set.has(key);
  }
  return next;
}

export { DEFAULT_DISPLAY_METRICS };

// ---------- Goal shape ----------
// {
//   id, name, icon, color, description,
//   targetAllocation: number 0..100,
//   priorityWeight: number 1..10,
//   status: "active" | "completed" | "archived",
//   linkedActivities: string[],   // category names
//   linkedHabits: string[],       // habit ids
//   notes: string,
//   createdAt: ISO date string,
//   completedAt: ISO date string | null,
//   finalNotes: string | null,
//   // Snapshot fields captured on completion (so history is stable even if
//   // entries / categories are later edited):
//   hoursAtCompletion?: number,
//   pointsAtCompletion?: number,
//   allocationAtCompletion?: number, // % of dev time at completion moment
// }

const STATUS_THRESHOLD = 5; // ±5% considered "on track"

function sumMinutes(entries, predicate) {
  let m = 0;
  for (const e of entries) if (predicate(e)) m += e.minutes || 0;
  return m;
}

function sumPoints(entries, predicate) {
  let p = 0;
  for (const e of entries) if (predicate(e)) p += e.points || 0;
  return Number(p.toFixed(2));
}

function firstEntryDate(entries, predicate) {
  let best = null;
  for (const e of entries) {
    if (!predicate(e)) continue;
    if (!best || e.date < best) best = e.date;
  }
  return best;
}

function lastEntryDate(entries, predicate) {
  let best = null;
  for (const e of entries) {
    if (!predicate(e)) continue;
    if (!best || e.date > best) best = e.date;
  }
  return best;
}

function daysBetween(aISO, bISO) {
  const a = dateAt(aISO);
  const b = dateAt(bISO);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}

function isoDay(d = new Date()) {
  return localISO(d);
}

function dateAt(iso) {
  if (!iso) return null;
  // Treat both date-only and full ISO; anchor at noon to avoid TZ drift.
  const str = iso.length === 10 ? `${iso}T12:00:00` : iso;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// ---------- Goal-scoped predicates ----------
function entryMatchesGoal(entry, goal) {
  if (entry.type !== "positive") return false;
  return (goal.linkedActivities || []).includes(entry.category);
}

// ---------- Per-goal compute ----------
export function computeGoalStats(goal, entries) {
  const minutes = sumMinutes(entries, (e) => entryMatchesGoal(e, goal));
  const points = sumPoints(entries, (e) => entryMatchesGoal(e, goal));
  const firstActivity = firstEntryDate(entries, (e) => entryMatchesGoal(e, goal));
  const lastActivity = lastEntryDate(entries, (e) => entryMatchesGoal(e, goal));
  return { minutes, points, firstActivity, lastActivity };
}

// Per-activity breakdown for a single goal (for the expanded Breakdown view).
export function computeGoalBreakdown(goal, entries) {
  const byCat = new Map();
  for (const e of entries) {
    if (!entryMatchesGoal(e, goal)) continue;
    byCat.set(e.category, (byCat.get(e.category) || 0) + (e.minutes || 0));
  }
  return [...byCat.entries()]
    .map(([category, minutes]) => ({ category, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

// Status given target vs actual percentage.
export function alignmentStatus(targetPct, actualPct) {
  const diff = actualPct - targetPct;
  if (diff > STATUS_THRESHOLD) return "ahead";
  if (diff < -STATUS_THRESHOLD) return "behind";
  return "on-track";
}

// ---------- Full snapshot for the Goals Review screen ----------
// Returns:
//   { active: [...], completed: [...], archived: [...],
//     totals: { activeCount, completedCount, totalMinutes, totalPoints, avgCompletionDays },
//     goalAllocatedMinutes }
//
// Each active goal gains: stats, breakdown, actualPct, diff, status.
export function computeGoalsSnapshot(goals, entries) {
  const active = (goals || []).filter((g) => g.status === "active");
  const completed = (goals || []).filter((g) => g.status === "completed");
  const archived = (goals || []).filter((g) => g.status === "archived");

  // Total minutes covered by ANY active goal's linked activities.
  // This is the denominator for actual allocation % (matches the spec where
  // active-goal slices sum to 100%).
  const activeLinked = new Set();
  for (const g of active) {
    for (const cat of g.linkedActivities || []) activeLinked.add(cat);
  }
  const goalAllocatedMinutes = sumMinutes(
    entries,
    (e) => e.type === "positive" && activeLinked.has(e.category),
  );
  const goalAllocatedPoints = sumPoints(
    entries,
    (e) => e.type === "positive" && activeLinked.has(e.category),
  );

  const enrichedActive = active.map((g) => {
    const stats = computeGoalStats(g, entries);
    const breakdown = computeGoalBreakdown(g, entries);
    const actualPct =
      goalAllocatedMinutes > 0
        ? Math.round((stats.minutes / goalAllocatedMinutes) * 100)
        : 0;
    const targetPct = Math.max(0, Math.min(100, Number(g.targetAllocation) || 0));
    const diff = actualPct - targetPct;
    const snap = {
      goal: g,
      stats,
      breakdown,
      actualPct,
      targetPct,
      diff,
      status: alignmentStatus(targetPct, actualPct),
    };
    snap.progress = computeGoalProgress(g, stats, entries);
    snap.deadlineStats = computeDeadlineStats(g);
    snap.health = computeHealthStatus(g, snap, snap.deadlineStats);
    return snap;
  });

  // Average completion time in days
  let totalDays = 0;
  let countWithDates = 0;
  for (const g of completed) {
    if (g.createdAt && g.completedAt) {
      totalDays += daysBetween(g.createdAt.slice(0, 10), g.completedAt.slice(0, 10));
      countWithDates += 1;
    }
  }
  const avgCompletionDays =
    countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0;

  return {
    active: enrichedActive,
    completed,
    archived,
    totals: {
      activeCount: active.length,
      completedCount: completed.length,
      totalMinutes: goalAllocatedMinutes,
      totalPoints: goalAllocatedPoints,
      avgCompletionDays,
    },
    goalAllocatedMinutes,
  };
}

// Snapshot captured on a goal at the moment it's completed. Used so the
// historical record stays stable even if entries / categories are later edited.
export function buildCompletionSnapshot(goal, entries) {
  const stats = computeGoalStats(goal, entries);
  // Allocation % at completion is computed against current dev-time pool of
  // OTHER active goals' linked cats + this goal's cats.
  const total = sumMinutes(entries, (e) => e.type === "positive");
  const allocationPct = total > 0 ? Math.round((stats.minutes / total) * 100) : 0;
  return {
    hoursAtCompletion: Math.round((stats.minutes / 60) * 10) / 10,
    pointsAtCompletion: stats.points,
    allocationAtCompletion: allocationPct,
  };
}

// Helpers for formatting
export function formatHours(minutes) {
  const m = Math.max(0, minutes || 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

export function formatDuration(days) {
  if (!days || days < 1) return "—";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.round((days / 30.4) * 10) / 10;
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.round((days / 365) * 10) / 10;
  return `${years} year${years === 1 ? "" : "s"}`;
}

// ---------- Deadline + Health ----------
// Returns null when the goal has no deadline; otherwise the urgency snapshot.
//   { totalDays, daysRemaining, timeRemainingPct, timeConsumedPct, colorBand }
// colorBand follows the spec (% remaining, NOT absolute days):
//   green   66–100, yellow 33–66, orange 15–33, red 0–15.
export function computeDeadlineStats(goal, today = new Date()) {
  if (!goal?.deadline) return null;
  const todayISO = isoDay(today);
  const createdISO = (goal.createdAt || new Date().toISOString()).slice(0, 10);
  const deadlineISO = goal.deadline.slice(0, 10);

  const totalDays = Math.max(1, daysBetween(createdISO, deadlineISO));
  const daysRemaining = daysBetween(todayISO, deadlineISO);
  const timeRemainingPct = Math.max(
    0,
    Math.min(100, Math.round((daysRemaining / totalDays) * 100)),
  );
  const timeConsumedPct = 100 - timeRemainingPct;

  let colorBand;
  if (timeRemainingPct >= 66) colorBand = "green";
  else if (timeRemainingPct >= 33) colorBand = "yellow";
  else if (timeRemainingPct >= 15) colorBand = "orange";
  else colorBand = "red";

  return {
    totalDays,
    daysRemaining,
    timeRemainingPct,
    timeConsumedPct,
    colorBand,
    overdue: daysRemaining < 0,
  };
}

// Health blends progress vs time. Prefers the goal's typed progress %
// (Manual / Value / Checklist / Hours). For Ongoing or untyped goals, falls
// back to allocation-based progress (actualPct / targetPct * 100).
//   diff = goalProgressPct - timeConsumedPct
//     diff >= 0           → on-track
//     -25 < diff <= -10   → at-risk
//     diff <= -25         → critical
// Ongoing goals with no deadline return null (no time pressure).
export function computeHealthStatus(goal, snapshot, deadlineStats) {
  if (goal.status === "completed") return "completed";
  if (!deadlineStats) return null;
  if (goal.progressType === "ongoing") return null;

  let goalProgress;
  if (snapshot.progress && typeof snapshot.progress.pct === "number") {
    goalProgress = snapshot.progress.pct;
  } else {
    const target = Math.max(1, snapshot.targetPct || 0);
    goalProgress = Math.min(
      100,
      Math.round(((snapshot.actualPct || 0) / target) * 100),
    );
  }

  const diff = goalProgress - deadlineStats.timeConsumedPct;
  if (diff <= -25) return "critical";
  if (diff <= -10) return "at-risk";
  return "on-track";
}

// Days early / late at completion. Positive = early, negative = late.
export function daysEarlyOrLate(goal) {
  if (!goal?.deadline || !goal?.completedAt) return null;
  return daysBetween(goal.completedAt.slice(0, 10), goal.deadline.slice(0, 10));
}

