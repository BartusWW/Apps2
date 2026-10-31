import { INSTANCE_STATUS, isComplete, remaining } from "./engine";

const instancesOf = state => Array.isArray(state?.instances) ? state.instances : [];

export function selectInstance(state, instanceId) {
  return instancesOf(state).find(x => x.id === instanceId) || null;
}

export function selectInstancesForDate(state, date) {
  return instancesOf(state).filter(x => x.date === date);
}

export function selectVisibleDay(state, date) {
  return selectInstancesForDate(state, date).filter(x =>
    ![INSTANCE_STATUS.DISMISSED, INSTANCE_STATUS.RESOLVED].includes(x.status)
  );
}

export function selectActiveDay(state, date) {
  return selectInstancesForDate(state, date).filter(x => x.status === INSTANCE_STATUS.ACTIVE);
}

export function selectCompletedDay(state, date) {
  return selectInstancesForDate(state, date).filter(isComplete);
}

export function selectSecondChances(state, date) {
  return selectInstancesForDate(state, date).filter(x =>
    x.source === "second-chance" && x.status === INSTANCE_STATUS.ACTIVE
  );
}

export function selectExecutionItem(state, instanceId) {
  const instance = selectInstance(state, instanceId);
  if (!instance) return null;
  return {
    id: instance.id,
    actionId: instance.actionId,
    legacyItemId: instance.metadata?.legacyItemId || null,
    name: instance.name,
    date: instance.date,
    kind: instance.kind,
    mode: instance.mode,
    unit: instance.unit,
    target: Number(instance.target || 0),
    progress: Number(instance.progress || 0),
    remaining: remaining(instance),
    status: instance.status,
    complete: isComplete(instance),
    active: instance.status === INSTANCE_STATUS.ACTIVE,
    secondChance: instance.source === "second-chance",
    carried: instance.source === "carryover" || !!instance.carriedFrom,
    recurring: !!instance.recurringId,
    frog: !!instance.metadata?.frog,
  };
}

export function selectExecutionDay(state, date) {
  return selectVisibleDay(state, date).map(x => selectExecutionItem(state, x.id));
}

export function selectDayExecutionSummary(state, date) {
  const all = selectInstancesForDate(state, date);
  const relevant = all.filter(x => x.status !== INSTANCE_STATUS.DISMISSED);
  const completed = relevant.filter(isComplete).length;
  const active = relevant.filter(x => x.status === INSTANCE_STATUS.ACTIVE).length;
  return {
    total: relevant.length,
    completed,
    active,
    missed: relevant.filter(x => x.status === INSTANCE_STATUS.MISSED).length,
    resolved: relevant.filter(x => x.status === INSTANCE_STATUS.RESOLVED).length,
    secondChance: relevant.filter(x => x.source === "second-chance").length,
    completionPct: relevant.length ? Math.round((completed / relevant.length) * 100) : 100,
  };
}
