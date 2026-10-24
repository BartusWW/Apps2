export const BASE_PROFILE_ID = "base";

export const clampCategoryPercent = (value) =>
  Math.max(50, Math.min(120, Number(value) || 100));

export const clampSubcategoryPercent = (value) =>
  Math.max(50, Math.min(200, Number(value) || 100));

export const clampPriorityPercent = clampCategoryPercent;

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
  return clampCategoryPercent(profile.categoryPriorities?.[category] ?? profile.priorities?.[category] ?? 100);
}

// Unspecified subcategories inherit their parent category percentage. This keeps
// every profile budget-valid when a category is lowered, while explicit subcategory
// values can still redistribute that budget toward the real priority.
export function getSubcategoryPriorityPercent(settings, category, subcategory) {
  if (!subcategory) return 100;
  const profile = getActivePriorityProfile(settings);
  if (!profile) return 100;
  const key = `${category}::${subcategory}`;
  const inherited = clampCategoryPercent(profile.categoryPriorities?.[category] ?? profile.priorities?.[category] ?? 100);
  return clampSubcategoryPercent(profile.subcategoryPriorities?.[key] ?? inherited);
}

export function getCategoryBudget(settings, category, subcategoryCount) {
  return Math.round((Number(subcategoryCount) || 0) * getCategoryPriorityPercent(settings, category));
}

export function getSubcategorySpend(settings, category, subcategories) {
  return (subcategories || []).reduce(
    (sum, sub) => sum + getSubcategoryPriorityPercent(settings, category, sub.name || sub),
    0,
  );
}

export function validateProfileBudgets(settings, profile) {
  const categories = settings?.categories || [];
  const normalCategories = categories.filter((c) => !c.special);
  const categoryCap = normalCategories.length * 100;
  const categorySpend = normalCategories.reduce(
    (sum, c) => sum + clampCategoryPercent(profile?.categoryPriorities?.[c.name] ?? profile?.priorities?.[c.name] ?? 100),
    0,
  );

  const subcategoryErrors = [];
  for (const cat of categories) {
    const subs = (cat.subcategories || []).filter((s) => s.active !== false);
    if (subs.length === 0) continue;
    const categoryPct = clampCategoryPercent(profile?.categoryPriorities?.[cat.name] ?? profile?.priorities?.[cat.name] ?? 100);
    const cap = subs.length * categoryPct;
    const spend = subs.reduce((sum, sub) => {
      const key = `${cat.name}::${sub.name}`;
      return sum + clampSubcategoryPercent(profile?.subcategoryPriorities?.[key] ?? categoryPct);
    }, 0);
    if (spend > cap) subcategoryErrors.push({ category: cat.name, spend, cap });
  }

  return {
    categorySpend,
    categoryCap,
    categoryOver: categorySpend > categoryCap,
    subcategoryErrors,
    valid: categorySpend <= categoryCap && subcategoryErrors.length === 0,
  };
}

export function applyPriorityMultiplier(points, category, subcategoryOrSettings, maybeSettings) {
  const hasExplicitSubcategory = maybeSettings !== undefined;
  const subcategory = hasExplicitSubcategory ? subcategoryOrSettings : null;
  const settings = hasExplicitSubcategory ? maybeSettings : subcategoryOrSettings;
  const percent = subcategory
    ? getSubcategoryPriorityPercent(settings, category, subcategory)
    : getCategoryPriorityPercent(settings, category);
  return roundPoints((Number(points) || 0) * (percent / 100));
}
