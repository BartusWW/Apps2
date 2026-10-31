import { legacyPlanToInstances } from "./legacyAdapter";

const occurrenceKey = x => [
  x.date,
  x.actionId,
  x.recurringId || "",
  x.secondChanceFor || "",
  x.metadata?.legacyItemId || "",
].join("::");

// CBE 3.1 planning ingress. This is NOT execution synchronization.
// dailyPlans may create an occurrence and may change planning-owned fields such
// as target/FROG/scope classification. They can never write Core progress/status.
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
    const plannedTarget = existing.status === "active"
      ? Math.max(Number(existing.progress)||0, Number(planned.target)||0)
      : Number(existing.target)||0;
    const frog = !!planned.metadata?.frog;
    const currentFrog = !!existing.metadata?.frog;
    const executionScope = planned.metadata?.executionScope || "daily";
    const currentScope = existing.metadata?.executionScope || "daily";
    const executionCeiling = Math.max(
      Number(existing.metadata?.executionCeiling)||0,
      Number(planned.metadata?.executionCeiling)||0,
      plannedTarget
    );

    // FROG and execution scope are planning metadata, not execution state. Keep
    // them synchronized even after completion; progress/status stay Core-owned.
    if (
      plannedTarget !== Number(existing.target||0) ||
      frog !== currentFrog ||
      executionScope !== currentScope ||
      executionCeiling !== Number(existing.metadata?.executionCeiling||0)
    ) {
      const next={
        ...existing,
        target:plannedTarget,
        metadata:{...existing.metadata,frog,executionScope,weeklyFrog:!!planned.metadata?.weeklyFrog,weeklyAction:!!planned.metadata?.weeklyAction,executionCeiling},
      };
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
