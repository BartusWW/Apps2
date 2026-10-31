import { V3_SCHEMA } from "./engine";
import { makeV3Snapshot } from "./legacyAdapter";

export const V3_STATE_KEY = "cbe.core.v3";

const safeParse = raw => {
  try { return JSON.parse(raw); } catch { return null; }
};

export function emptyV3State() {
  return { schemaVersion: V3_SCHEMA, migratedAt: null, updatedAt: null, instances: [] };
}

export function normalizeV3State(value) {
  const src = value && typeof value === "object" ? value : {};
  return {
    schemaVersion: V3_SCHEMA,
    migratedAt: src.migratedAt || null,
    updatedAt: src.updatedAt || null,
    instances: Array.isArray(src.instances) ? src.instances.filter(Boolean) : [],
  };
}

export function loadV3State(storage = globalThis?.localStorage) {
  if (!storage) return emptyV3State();
  const parsed = safeParse(storage.getItem(V3_STATE_KEY));
  return parsed?.schemaVersion === V3_SCHEMA ? normalizeV3State(parsed) : emptyV3State();
}

export function saveV3State(state, storage = globalThis?.localStorage, at = new Date().toISOString()) {
  const next = { ...normalizeV3State(state), updatedAt: at };
  if (storage) storage.setItem(V3_STATE_KEY, JSON.stringify(next));
  return next;
}

// One-way bootstrap only. Existing v3 state always wins; refresh must never
// recreate dismissed/completed occurrences from legacy dailyPlans.
export function bootstrapV3State({ dailyPlans = {}, actions = [], storage = globalThis?.localStorage, at = new Date().toISOString() } = {}) {
  const existing = loadV3State(storage);
  if (existing.migratedAt || existing.instances.length) return existing;
  const snapshot = makeV3Snapshot({ dailyPlans, actions, migratedAt: at });
  return saveV3State(snapshot, storage, at);
}

export function transactV3State(mutator, storage = globalThis?.localStorage, at = new Date().toISOString()) {
  const current = loadV3State(storage);
  const result = mutator(normalizeV3State(current));
  return saveV3State(result || current, storage, at);
}
