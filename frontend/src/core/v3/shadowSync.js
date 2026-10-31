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

// During rollout legacy planning UI may still create plan items. This ingestion
// path is intentionally one-way and add-only: it can introduce a newly planned
// occurrence to Core, but it can never change progress/status of an occurrence
// already owned by v3. That keeps planning compatible without restoring dual
// execution ownership.
export function ingestLegacyOccurrences(state, { dailyPlans = {}, actions = [] } = {}) {
  const incoming = legacyPlanToInstances(dailyPlans, actions);
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

// Full shadow sync is only for the period where v2 owns execution. It may add
// newly observed occurrences and advance ACTIVE v3 progress, but never reopen a
// terminal v3 decision.
export function syncLegacyShadow(state, { dailyPlans = {}, actions = [] } = {}) {
  const incoming = legacyPlanToInstances(dailyPlans, actions);
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
