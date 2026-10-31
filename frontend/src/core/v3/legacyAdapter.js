import { createInstance, INSTANCE_STATUS } from "./engine";
import { ambitionTiers } from "../../lib/productivity";

const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;

// Read-only bridge from v2 dailyPlans + Entries into the v3 model. Entries are
// important during the migration window because quantity logs and fixed-task
// completions can be persisted before the legacy plan item itself is patched.
export function legacyPlanToInstances(dailyPlans = {}, actions = [], entries = []) {
  const actionMap = Object.fromEntries((actions || []).map(a => [a.id, a]));
  const out = [];
  for (const [date, plan] of Object.entries(dailyPlans || {})) {
    const dayEntries = (entries || []).filter(e => e?.date === date);
    for (const item of Array.isArray(plan?.items) ? plan.items : []) {
      if (!item?.actionId) continue;
      const action = actionMap[item.actionId] || {};
      const quantity = action.scoringType === "per-unit";
      const target = quantity
        ? Math.max(0, num(item.habitAmount))
        : Math.max(1, num(item.stackCount) || 1);
      const maxAmbitionTarget = quantity
        ? ambitionTiers(action).reduce((max, tier) => Math.max(max, num(tier.target)), 0)
        : 0;
      const executionCeiling = Math.max(target, maxAmbitionTarget);
      const matchingEntries = dayEntries.filter(e => e?.actionId === item.actionId && !e?.ambitionBonus);
      const entryQuantity = matchingEntries.reduce((sum, e) => sum + num(e.quantity), 0);
      const stackEntries = matchingEntries.filter(e => e?.stack === true && (!e.planItemId || e.planItemId === item.id)).length;
      const progress = quantity
        ? Math.max(0, num(item.loggedQuantity || item.progress || 0), entryQuantity)
        : Math.min(target, Math.max(0, num(item.stackDone) || (item.status === "done" ? target : 0), stackEntries));
      const instance = createInstance({
        id: `legacy::${date}::${item.id || item.actionId}`,
        date,
        actionId: item.actionId,
        name: item.name || action.name || "",
        kind: item.habit ? "habit" : "task",
        mode: quantity ? "quantity" : "fixed",
        target,
        unit: action.unit || item.habitUnit || "unit",
        recurringId: item.recurringId || null,
        source: item.carriedFrom ? "carryover" : "legacy-v2",
        carriedFrom: item.carriedFrom || null,
        metadata: { legacyItemId: item.id || null, frog: !!item.frog, executionCeiling },
      });
      instance.progress = Math.min(executionCeiling, progress);
      if (item.status === "done" || instance.progress >= target) instance.status = INSTANCE_STATUS.COMPLETED;
      else if (["dropped", "dismissed"].includes(item.status)) instance.status = INSTANCE_STATUS.DISMISSED;
      else if (item.status === "missed") instance.status = INSTANCE_STATUS.MISSED;
      else if (item.status === "resolved") instance.status = INSTANCE_STATUS.RESOLVED;
      out.push(instance);
    }
  }
  return out;
}

export function makeV3Snapshot({ dailyPlans = {}, actions = [], entries = [], migratedAt = null } = {}) {
  return {
    schemaVersion: 3,
    migratedAt,
    instances: legacyPlanToInstances(dailyPlans, actions, entries),
  };
}
