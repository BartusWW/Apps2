const round = n => Math.round((Number(n) || 0) * 10) / 10;

export const V3_EFFECT_PREFIX = "v3-effect::";

export function executionEffectId({ instanceId, commandId }) {
  if (!instanceId || !commandId) throw new Error("CBE v3 scoring effect requires instanceId and commandId");
  return `${V3_EFFECT_PREFIX}${instanceId}::${commandId}`;
}

export function hasExecutionEffect(entries = [], effectId) {
  return (entries || []).some(entry => entry?.v3EffectId === effectId);
}

export function buildExecutionEntry({ instance, action, amount, commandId, at = null, points = null, metadata = {} }) {
  if (!instance || !action) throw new Error("CBE v3 scoring effect requires instance and action");
  const effectId = executionEffectId({ instanceId: instance.id, commandId });
  const quantity = instance.mode === "quantity" ? Math.max(0, Number(amount) || 0) : undefined;
  const minutes = instance.mode === "quantity" ? 0 : Math.max(0, Number(amount) || 0);
  const basePoints = points == null
    ? (instance.mode === "quantity"
      ? quantity * (Number(action.pointsPerUnit) || 0)
      : (minutes / 30) * (Number(action.points) || 0))
    : Number(points) || 0;
  const timestamp = at ? new Date(at) : new Date();
  const date = instance.date;
  const time = Number.isNaN(timestamp.getTime()) ? "12:00" : timestamp.toISOString().slice(11, 16);

  return {
    id: effectId,
    date,
    time,
    category: action.category,
    subcategory: action.subcategory || null,
    actionId: action.id,
    actionName: action.name || instance.name,
    minutes,
    points: round(basePoints),
    type: action.type || "positive",
    icon: action.icon,
    quantity,
    unit: instance.mode === "quantity" ? (action.unit || instance.unit || "unit") : undefined,
    scoringType: action.scoringType,
    pointsPerUnit: instance.mode === "quantity" ? Number(action.pointsPerUnit) || 0 : undefined,
    source: "cbe-v3",
    v3EffectId: effectId,
    v3InstanceId: instance.id,
    v3CommandId: commandId,
    ...metadata,
  };
}

// Pure/idempotent append. React/localStorage integration can use this without
// risking duplicate CBE awards after retries, refreshes or repeated effects.
export function appendExecutionEntry(entries = [], input) {
  const entry = buildExecutionEntry(input);
  if (hasExecutionEffect(entries, entry.v3EffectId)) return { entries, entry: null, duplicate: true };
  return { entries: [entry, ...(entries || [])], entry, duplicate: false };
}
