import { legacyPlanToInstances } from "./legacyAdapter";
import { selectExecutionDay, selectDayExecutionSummary } from "./selectors";

const key = item => item?.metadata?.legacyItemId || item?.id || `${item?.actionId || "unknown"}::${item?.recurringId || ""}`;
const comparable = item => ({
  actionId: item.actionId,
  status: item.status,
  progress: Number(item.progress) || 0,
  target: Number(item.target) || 0,
  kind: item.kind,
});

// Pure diagnostic only: never mutates either v2 or v3 state.
export function compareExecutionShadow({ date, dailyPlans = {}, actions = [], v3State = {} } = {}) {
  if (!date) throw new Error("CBE v3 shadow comparison requires date");
  const legacyState = { instances: legacyPlanToInstances({ [date]: dailyPlans?.[date] || {} }, actions) };
  const legacyItems = selectExecutionDay(legacyState, date);
  const v3Items = selectExecutionDay(v3State, date);
  const legacyByKey = new Map(legacyItems.map(item => [key(item), item]));
  const v3ByKey = new Map(v3Items.map(item => [key(item), item]));
  const keys = new Set([...legacyByKey.keys(), ...v3ByKey.keys()]);
  const differences = [];

  for (const id of keys) {
    const legacy = legacyByKey.get(id);
    const v3 = v3ByKey.get(id);
    if (!legacy || !v3) {
      differences.push({ key: id, type: legacy ? "missing-v3" : "extra-v3", legacy: legacy ? comparable(legacy) : null, v3: v3 ? comparable(v3) : null });
      continue;
    }
    const left = comparable(legacy), right = comparable(v3);
    const fields = Object.keys(left).filter(field => left[field] !== right[field]);
    if (fields.length) differences.push({ key: id, type: "mismatch", fields, legacy: left, v3: right });
  }

  return {
    date,
    match: differences.length === 0,
    differences,
    legacy: { items: legacyItems, summary: selectDayExecutionSummary(legacyState, date) },
    v3: { items: v3Items, summary: selectDayExecutionSummary(v3State, date) },
  };
}
