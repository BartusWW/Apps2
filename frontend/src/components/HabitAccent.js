export const habitAccentFor = (item, recurringMap) => {
  if (!item?.kind?.startsWith("habit")) return null;
  const rule = item?.recurringId ? recurringMap?.[item.recurringId] : null;
  return rule?.habit?.accent || null;
};
