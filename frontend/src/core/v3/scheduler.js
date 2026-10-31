import { createInstance, ensureScheduledInstances } from "./engine";

const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const weekday = date => new Date(`${date}T12:00:00`).getDay();

export function ruleDueOnDate(rule, date) {
  if (!rule || rule.active === false || rule.enabled === false) return false;
  const schedule = rule.schedule || rule.frequency || "daily";
  if (schedule === "daily") return true;
  const days = rule.daysOfWeek || rule.weekdays || rule.days;
  if (Array.isArray(days) && days.length) return days.map(Number).includes(weekday(date));
  if (schedule === "weekly") return Number(rule.dayOfWeek ?? rule.weekday) === weekday(date);
  return true;
}

export function recurringRuleToCandidate(rule, action, date) {
  if (!rule?.id || !action?.id || !ruleDueOnDate(rule, date)) return null;
  const quantity = action.scoringType === "per-unit";
  const habit = !!(rule.habit?.enabled || rule.habit === true || rule.type === "habit");
  const rawTarget = quantity
    ? (rule.habit?.amount ?? rule.amount ?? rule.target ?? 0)
    : (rule.stackCount ?? rule.count ?? rule.target ?? 1);
  return createInstance({
    date,
    actionId: action.id,
    name: rule.name || action.name || "",
    kind: habit ? "habit" : "task",
    mode: quantity ? "quantity" : "fixed",
    target: quantity ? Math.max(0, num(rawTarget)) : Math.max(1, num(rawTarget) || 1),
    unit: action.unit || rule.habit?.unit || rule.unit || "unit",
    recurringId: rule.id,
    source: "recurring",
    metadata: { frog: !!rule.frog, schedule: rule.schedule || rule.frequency || "daily" },
  });
}

export function scheduleRecurringForDate(instances, recurringTasks = [], actions = [], date) {
  const actionMap = Object.fromEntries((actions || []).map(a => [a.id, a]));
  const candidates = (recurringTasks || [])
    .map(rule => recurringRuleToCandidate(rule, actionMap[rule.actionId], date))
    .filter(Boolean);
  return ensureScheduledInstances(instances, candidates);
}
