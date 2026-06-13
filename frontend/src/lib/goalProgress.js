// Goal Progress Type computations.
// Five tracking models — "manual", "value", "checklist", "hours", "ongoing".
//
// computeGoalProgress(goal, stats, entries) → snapshot used by GoalCard, health
// status, and completion prompts.
//
// snapshot shape:
//   {
//     type,
//     pct,                 // 0..100 (null for ongoing)
//     primary,             // short string for card chip (e.g. "33 / 320 pages")
//     secondary,           // string with finer detail (optional)
//     isCompletable,       // true when pct === 100 and type supports completion
//     ongoing,             // { lifetimeMinutes, weeklyMinutes, monthlyMinutes, milestones }
//   }
//
// stats = result of computeGoalStats() — minutes/points for goal-linked entries.
import { weekKey } from "./dateUtils";
import { formatHours } from "./goals";

export const PROGRESS_TYPES = [
  { id: "manual", label: "Manual %" },
  { id: "value", label: "Value / Max" },
  { id: "checklist", label: "Checklist" },
  { id: "hours", label: "Hours Target" },
  { id: "ongoing", label: "Ongoing" },
];

export const MILESTONE_TYPES = [
  { id: "hours", label: "Hours" },
  { id: "checklist", label: "Checklist" },
  { id: "counter", label: "Counter" },
  { id: "value", label: "Value" },
  { id: "manual", label: "Manual %" },
  { id: "binary", label: "Binary" },
];

// Per-milestone progress snapshot. Honors all six milestone types.
//   { type, pct, primary, reached, isCompletable }
// `lifetimeHours` is the goal's lifetime hours (used by hours type only).
export function computeMilestoneProgress(m, lifetimeHours = 0) {
  const type = m?.type || "hours";
  if (type === "hours") {
    const tgt = Number(m.hoursTarget) || 0;
    const cur = lifetimeHours;
    const pct = tgt > 0 ? clampPct((cur / tgt) * 100) : 0;
    const reached = tgt > 0 && cur >= tgt;
    return {
      type,
      pct,
      primary: `${Math.round(cur * 10) / 10}h / ${tgt}h`,
      reached,
      isCompletable: reached,
    };
  }
  if (type === "checklist") {
    const items = Array.isArray(m.checklist) ? m.checklist : [];
    const done = items.filter((i) => i?.done).length;
    const total = items.length;
    const pct = total > 0 ? clampPct((done / total) * 100) : 0;
    const reached = total > 0 && done === total;
    return { type, pct, primary: `${done} / ${total}`, reached, isCompletable: reached };
  }
  if (type === "counter") {
    const cur = Math.max(0, Number(m.counterCurrent) || 0);
    const tgt = Math.max(0, Number(m.counterTarget) || 0);
    const pct = tgt > 0 ? clampPct((cur / tgt) * 100) : 0;
    const reached = tgt > 0 && cur >= tgt;
    return { type, pct, primary: `${cur} / ${tgt}`, reached, isCompletable: reached };
  }
  if (type === "value") {
    const cur = Number(m.valueCurrent) || 0;
    const tgt = Number(m.valueTarget) || 0;
    const unit = (m.valueUnit || "").trim();
    const pct = tgt > 0 ? clampPct((cur / tgt) * 100) : 0;
    const reached = tgt > 0 && cur >= tgt;
    return {
      type,
      pct,
      primary: `${unit ? unit + " " : ""}${cur} / ${tgt}`,
      reached,
      isCompletable: reached,
    };
  }
  if (type === "manual") {
    const pct = clampPct(Number(m.manualPct) || 0);
    return {
      type,
      pct,
      primary: `${pct}%`,
      reached: pct >= 100,
      isCompletable: pct >= 100,
    };
  }
  // binary
  const reached = m.reached === true;
  return {
    type: "binary",
    pct: reached ? 100 : 0,
    primary: reached ? "Achieved" : "Not yet",
    reached,
    isCompletable: false,
  };
}

function clampPct(n) {
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function startOfMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function entryMonthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function entryMatches(entry, goal) {
  if (entry.type !== "positive") return false;
  return (goal.linkedActivities || []).includes(entry.category);
}

function sumMatching(entries, goal, predicate) {
  let m = 0;
  for (const e of entries) {
    if (!entryMatches(e, goal)) continue;
    if (predicate && !predicate(e)) continue;
    m += e.minutes || 0;
  }
  return m;
}

export function computeGoalProgress(goal, stats, entries) {
  const type = goal.progressType || "manual";
  const p = goal.progress || {};

  if (type === "manual") {
    const pct = clampPct(Number(p.manualPct) || 0);
    return {
      type,
      pct,
      primary: `${pct}%`,
      isCompletable: pct >= 100,
    };
  }

  if (type === "value") {
    const cur = Math.max(0, Number(p.valueCurrent) || 0);
    const tgt = Math.max(0, Number(p.valueTarget) || 0);
    const pct = tgt > 0 ? clampPct((cur / tgt) * 100) : 0;
    const unit = (p.valueUnit || "items").trim();
    return {
      type,
      pct,
      primary: `${cur} / ${tgt} ${unit}`,
      isCompletable: tgt > 0 && cur >= tgt,
    };
  }

  if (type === "checklist") {
    const items = Array.isArray(p.checklist) ? p.checklist : [];
    const done = items.filter((i) => i?.done).length;
    const total = items.length;
    const pct = total > 0 ? clampPct((done / total) * 100) : 0;
    return {
      type,
      pct,
      primary: `${done} / ${total} complete`,
      isCompletable: total > 0 && done === total,
    };
  }

  if (type === "hours") {
    // Use the goal's linked entry minutes (already in stats.minutes).
    const targetH = Math.max(0, Number(p.hoursTarget) || 0);
    const curMin = stats?.minutes || 0;
    const targetMin = targetH * 60;
    const pct = targetMin > 0 ? clampPct((curMin / targetMin) * 100) : 0;
    return {
      type,
      pct,
      primary: `${formatHours(curMin)} / ${targetH}h`,
      isCompletable: targetMin > 0 && curMin >= targetMin,
    };
  }

  // ----- ongoing -----
  const today = new Date();
  const thisWeekKey = weekKey(today);
  const thisMonthKey = startOfMonthKey(today);
  const weeklyMinutes = sumMatching(entries, goal, (e) =>
    weekKey(new Date(`${e.date}T12:00:00`)) === thisWeekKey,
  );
  const monthlyMinutes = sumMatching(entries, goal, (e) =>
    entryMonthKey(e.date) === thisMonthKey,
  );
  const lifetimeMinutes = stats?.minutes || 0;

  // Milestone progress — each milestone is independent and typed.
  const milestones = Array.isArray(p.ongoing?.milestones) ? p.ongoing.milestones : [];
  const lifetimeHours = lifetimeMinutes / 60;
  const enrichedMilestones = milestones
    .map((m) => {
      const mp = computeMilestoneProgress(m, lifetimeHours);
      return {
        ...m,
        progress: mp,
        // Backward-compat aliases used by older renderers:
        reached: mp.reached || m.reached === true,
        progressPct: mp.pct,
      };
    })
    .sort((a, b) => {
      // Sort: incomplete first (by lowest pct), then completed (by highest pct).
      if (a.reached !== b.reached) return a.reached ? 1 : -1;
      return (a.progress.pct || 0) - (b.progress.pct || 0);
    });
  const nextMilestone = enrichedMilestones.find((m) => !m.reached) || null;

  return {
    type,
    pct: null, // ongoing has no completion %
    primary: `${formatHours(lifetimeMinutes)} lifetime`,
    secondary: `${formatHours(monthlyMinutes)} this month · ${formatHours(weeklyMinutes)} this week`,
    isCompletable: false,
    ongoing: {
      lifetimeMinutes,
      weeklyMinutes,
      monthlyMinutes,
      milestones: enrichedMilestones,
      nextMilestone,
    },
  };
}
