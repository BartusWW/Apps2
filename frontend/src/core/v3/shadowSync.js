import { INSTANCE_STATUS } from "./engine";
import { legacyPlanToInstances } from "./legacyAdapter";

const TERMINAL = new Set([
  INSTANCE_STATUS.COMPLETED,
  INSTANCE_STATUS.DISMISSED,
  INSTANCE_STATUS.MISSED,
  INSTANCE_STATUS.RESOLVED,
]);

const occurrenceKey = x => [
  x.date,
  x.actionId,
  x.recurringId || "",
  x.secondChanceFor || "",
  x.metadata?.legacyItemId || "",
].join("::");

export function ingestLegacyOccurrences(state, { dailyPlans = {}, actions = [], entries = [] } = {}) {
  const incoming = legacyPlanToInstances(dailyPlans, actions, entries);
  const current = [...(Array.isArray(state?.instances) ? state.instances : [])];
  const keys = new Set(current.map(occurrenceKey));
  let changed = false;

  for (const legacy of incoming) {
    const key = occurrenceKey(legacy);
    if (keys.has(key)) continue;
    current.push(legacy);
    keys.add(key);
    changed = true;
  }

  return changed ? { ...state, instances: current } : state;
}

// Migration shadow: legacy Entries are still a real execution source until the
// last legacy logging surface is routed through Core. Sync may only advance an
// ACTIVE instance; terminal v3 decisions are never reopened.
export function syncLegacyShadow(state, { dailyPlans = {}, actions = [], entries = [] } = {}) {
  const incoming = legacyPlanToInstances(dailyPlans, actions, entries);
  const current = [...(Array.isArray(state?.instances) ? state.instances : [])];
  const byKey = new Map(current.map((x, index) => [occurrenceKey(x), { instance: x, index }]));
  let changed = false;

  for (const legacy of incoming) {
    const key = occurrenceKey(legacy);
    const match = byKey.get(key);
    if (!match) {
      current.push(legacy);
      byKey.set(key, { instance: legacy, index: current.length - 1 });
      changed = true;
      continue;
    }

    const existing = match.instance;
    if (TERMINAL.has(existing.status)) continue;

    const nextProgress = Math.max(Number(existing.progress || 0), Number(legacy.progress || 0));
    const nextStatus = TERMINAL.has(legacy.status) ? legacy.status : existing.status;
    if (nextProgress !== Number(existing.progress || 0) || nextStatus !== existing.status) {
      const next = {
        ...existing,
        progress: Math.min(Number(existing.target || 0), nextProgress),
        status: nextStatus,
      };
      current[match.index] = next;
      byKey.set(key, { instance: next, index: match.index });
      changed = true;
    }
  }

  return changed ? { ...state, instances: current } : state;
}
