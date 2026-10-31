export const V3_FLAGS_KEY = "cbe.flags.v3";

export const DEFAULT_V3_FLAGS = Object.freeze({
  enabled: false,
  executionRead: false,
  executionWrite: false,
  dayClose: false,
});

const safeParse = raw => {
  try { return JSON.parse(raw); } catch { return null; }
};

export function loadV3Flags(storage = globalThis?.localStorage) {
  if (!storage) return { ...DEFAULT_V3_FLAGS };
  const parsed = safeParse(storage.getItem(V3_FLAGS_KEY));
  return { ...DEFAULT_V3_FLAGS, ...(parsed && typeof parsed === "object" ? parsed : {}) };
}

export function saveV3Flags(patch = {}, storage = globalThis?.localStorage) {
  const next = { ...loadV3Flags(storage), ...patch };
  if (storage) storage.setItem(V3_FLAGS_KEY, JSON.stringify(next));
  return next;
}

export function isV3FeatureEnabled(flags, feature) {
  return !!flags?.enabled && !!flags?.[feature];
}
