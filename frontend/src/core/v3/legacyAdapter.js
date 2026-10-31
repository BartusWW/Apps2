import { createInstance, INSTANCE_STATUS } from "./engine";

const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;

// Read-only bridge from v2 dailyPlans into the v3 model. It lets us migrate
// incrementally without deleting or rewriting the user's existing local data.
export function legacyPlanToInstances(dailyPlans = {}, actions = []) {
  const actionMap = Object.fromEntries((actions || []).map(a => [a.id, a]));
  const out = [];
  for (const [date, plan] of Object.entries(dailyPlans || {})) {
    for (const item of Array.isArray(plan?.items) ? plan.items : []) {
      if (!item?.actionId) continue;
      const action = actionMap[item.actionId] || {};
      const quantity = action.scoringType === "per-unit";
      const target = quantity
        ? Math.max(0, num(item.habitAmount))
        : Math.max(1, num(item.stackCount) || 1);
      const progress = quantity
        ? Math.max(0, num(item.loggedQuantity || item.progress || 0))
        : Math.min(target, Math.max(0, num(item.stackDone) || (item.status === "done" ? target : 0)));
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
        metadata: { legacyItemId: item.id || null, frog: !!item.frog },
      });
      instance.progress = Math.min(target, progress);
      if (item.status === "done" || instance.progress >= target) instance.status = INSTANCE_STATUS.COMPLETED;
      else if (["dropped", "dismissed"].includes(item.status)) instance.status = INSTANCE_STATUS.DISMISSED;
      else if (item.status === "missed") instance.status = INSTANCE_STATUS.MISSED;
      else if (item.status === "resolved") instance.status = INSTANCE_STATUS.RESOLVED;
      out.push(instance);
    }
  }
  return out;
}

export function makeV3Snapshot({ dailyPlans = {}, actions = [], migratedAt = null } = {}) {
  return {
    schemaVersion: 3,
    migratedAt,
    instances: legacyPlanToInstances(dailyPlans, actions),
  };
}
