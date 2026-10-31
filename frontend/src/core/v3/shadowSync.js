import { INSTANCE_STATUS } from "./engine";
import { legacyPlanToInstances } from "./legacyAdapter";

const occurrenceKey = x => [
  x.date,
  x.actionId,
  x.recurringId || "",
  x.secondChanceFor || "",
  x.metadata?.legacyItemId || "",
].join("::");

// CBE 3.1 planning ingress. This is NOT execution synchronization.
// dailyPlans may create an occurrence and may change its planned target while
// it is still active. They can never write Core progress or execution status.
export function ingestLegacyOccurrences(state, { dailyPlans = {}, actions = [] } = {}) {
  const incoming = legacyPlanToInstances(dailyPlans, actions);
  const current = [...(Array.isArray(state?.instances) ? state.instances : [])];
  const byKey = new Map(current.map((x,index)=>[occurrenceKey(x),{instance:x,index}]));
  let changed = false;

  for (const planned of incoming) {
    const key = occurrenceKey(planned);
    const match = byKey.get(key);
    if (!match) {
      current.push(planned);
      byKey.set(key,{instance:planned,index:current.length-1});
      changed = true;
      continue;
    }
    const existing = match.instance;
    if (existing.status !== INSTANCE_STATUS.ACTIVE) continue;
    const plannedTarget = Math.max(Number(existing.progress)||0, Number(planned.target)||0);
    if (plannedTarget !== Number(existing.target||0)) {
      const next={...existing,target:plannedTarget};
      current[match.index]=next;
      byKey.set(key,{instance:next,index:match.index});
      changed=true;
    }
  }
  return changed ? { ...state, instances: current } : state;
}

// Kept only so old imports do not crash during the 3.1 branch migration.
// It intentionally delegates to planning ingress and never synchronizes execution.
export function syncLegacyShadow(state, input = {}) {
  return ingestLegacyOccurrences(state, input);
}
