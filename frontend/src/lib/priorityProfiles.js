export const BASE_PROFILE_ID = "base";

export const clampPriorityPercent = (value) =>
  Math.max(50, Math.min(150, Number(value) || 100));

export const roundPoints = (value) => {
  const n = Number(value) || 0;
  return Math.round((n + Number.EPSILON) * 10) / 10;
};

export function getActivePriorityProfile(settings) {
  const activeId = settings?.activePriorityProfileId || BASE_PROFILE_ID;
  if (activeId === BASE_PROFILE_ID) return null;
  return (settings?.priorityProfiles || []).find((p) => p.id === activeId) || null;
}

export function getCategoryPriorityPercent(settings, category) {
  const profile = getActivePriorityProfile(settings);
  if (!profile) return 100;
  return clampPriorityPercent(profile.priorities?.[category] ?? 100);
}

export function applyPriorityMultiplier(points, category, settings) {
  const percent = getCategoryPriorityPercent(settings, category);
  return roundPoints((Number(points) || 0) * (percent / 100));
}
