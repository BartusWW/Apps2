// CBE Core v3 — deterministic daily execution state.
// UI components must render this state and dispatch commands; they must not
// independently decide whether an item is due, completed, dismissed or missed.

export const V3_SCHEMA = 3;
export const INSTANCE_STATUS = Object.freeze({
  ACTIVE: "active",
  COMPLETED: "completed",
  DISMISSED: "dismissed",
  MISSED: "missed",
  RESOLVED: "resolved",
});

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const round = value => Math.round(n(value) * 1000) / 1000;
export const instanceKey = (date, actionId, kind = "daily") => `${date}::${actionId}::${kind}`;

export function createInstance({
  id,
  date,
  actionId,
  name = "",
  kind = "task",
  mode = "fixed",
  target = 1,
  unit = "unit",
  recurringId = null,
  source = "manual",
  carriedFrom = null,
  secondChanceFor = null,
  metadata = {},
}) {
  if (!date || !actionId) throw new Error("CBE v3 instance requires date and actionId");
  const safeTarget = Math.max(mode === "quantity" ? 0 : 1, n(target) || (mode === "quantity" ? 0 : 1));
  return {
    id: id || instanceKey(date, actionId, secondChanceFor ? `second-chance:${secondChanceFor}` : kind),
    schemaVersion: V3_SCHEMA,
    date,
    actionId,
    name,
    kind,
    mode,
    target: safeTarget,
    progress: 0,
    unit,
    status: INSTANCE_STATUS.ACTIVE,
    recurringId,
    source,
    carriedFrom,
    secondChanceFor,
    createdAt: null,
    completedAt: null,
    dismissedAt: null,
    missedAt: null,
    metadata: { ...metadata },
  };
}

export const isTerminal = instance => [
  INSTANCE_STATUS.COMPLETED,
  INSTANCE_STATUS.DISMISSED,
  INSTANCE_STATUS.MISSED,
  INSTANCE_STATUS.RESOLVED,
].includes(instance?.status);

export const isComplete = instance => instance?.status === INSTANCE_STATUS.COMPLETED || n(instance?.progress) >= n(instance?.target);
export const remaining = instance => round(Math.max(0, n(instance?.target) - n(instance?.progress)));

export function applyExecution(instance, amount = 1, at = null) {
  if (!instance) throw new Error("Missing instance");
  if (isTerminal(instance)) return instance;
  const step = instance.mode === "quantity" ? Math.max(0, n(amount)) : Math.max(1, n(amount) || 1);
  const progress = round(Math.min(n(instance.target), n(instance.progress) + step));
  const completed = progress >= n(instance.target);
  return {
    ...instance,
    progress,
    status: completed ? INSTANCE_STATUS.COMPLETED : INSTANCE_STATUS.ACTIVE,
    completedAt: completed ? (at || instance.completedAt || null) : instance.completedAt,
  };
}

export function dismissInstance(instance, at = null, reason = "dismissed") {
  if (!instance || isTerminal(instance)) return instance;
  return { ...instance, status: INSTANCE_STATUS.DISMISSED, dismissedAt: at, dismissReason: reason };
}

export function markMissed(instance, at = null) {
  if (!instance || isTerminal(instance)) return instance;
  return { ...instance, status: INSTANCE_STATUS.MISSED, missedAt: at };
}

export function upsertInstance(instances, candidate) {
  const list = Array.isArray(instances) ? instances : [];
  const exact = list.find(x => x.id === candidate.id);
  if (exact) return list;
  // A recurring item dismissed/completed for this date is still an existing
  // occurrence. Scheduler must never resurrect it after refresh.
  const sameOccurrence = list.find(x =>
    x.date === candidate.date &&
    x.actionId === candidate.actionId &&
    (x.recurringId || null) === (candidate.recurringId || null) &&
    (x.secondChanceFor || null) === (candidate.secondChanceFor || null)
  );
  return sameOccurrence ? list : [...list, candidate];
}

export function ensureScheduledInstances(instances, candidates) {
  return (candidates || []).reduce((acc, candidate) => upsertInstance(acc, candidate), Array.isArray(instances) ? instances : []);
}

export function createSecondChance(missedHabit, nextDate) {
  if (!missedHabit || missedHabit.kind !== "habit" || missedHabit.status !== INSTANCE_STATUS.MISSED) return null;
  return createInstance({
    date: nextDate,
    actionId: missedHabit.actionId,
    name: missedHabit.name,
    kind: "habit-recovery",
    mode: missedHabit.mode,
    target: missedHabit.target,
    unit: missedHabit.unit,
    recurringId: missedHabit.recurringId,
    source: "second-chance",
    secondChanceFor: missedHabit.id,
    metadata: { ...(missedHabit.metadata || {}), originalDate: missedHabit.date },
  });
}

export function closeDay(instances, date, nextDate, at = null) {
  const list = Array.isArray(instances) ? instances : [];
  let next = list.map(item => {
    if (item.date !== date || isTerminal(item)) return item;
    if (item.kind === "habit") return markMissed(item, at);
    return { ...item, status: INSTANCE_STATUS.RESOLVED, resolvedAt: at, resolvedAs: "unfinished" };
  });
  const missed = next.filter(x => x.date === date && x.kind === "habit" && x.status === INSTANCE_STATUS.MISSED);
  const recoveries = missed.map(x => createSecondChance(x, nextDate)).filter(Boolean);
  next = ensureScheduledInstances(next, recoveries);
  return next;
}

export function selectDay(instances, date) {
  return (instances || []).filter(x => x.date === date);
}

export function daySummary(instances, date) {
  const day = selectDay(instances, date);
  const completed = day.filter(isComplete).length;
  const active = day.filter(x => x.status === INSTANCE_STATUS.ACTIVE).length;
  return {
    total: day.length,
    completed,
    active,
    dismissed: day.filter(x => x.status === INSTANCE_STATUS.DISMISSED).length,
    missed: day.filter(x => x.status === INSTANCE_STATUS.MISSED).length,
    resolved: day.filter(x => x.status === INSTANCE_STATUS.RESOLVED).length,
  };
}
