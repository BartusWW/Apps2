// Time-based scoring helpers (CBE v2)
// Positive: +20 points per hour. Negative: -30 points per hour.
// Stored with 1-decimal precision; UI rounds for display where appropriate.

export const POSITIVE_RATE_PER_HOUR = 20;
export const NEGATIVE_RATE_PER_HOUR = -30;

export function computePoints(minutes, type) {
  const rate = type === "negative" ? NEGATIVE_RATE_PER_HOUR : POSITIVE_RATE_PER_HOUR;
  const raw = (Number(minutes) || 0) / 60 * rate;
  return Math.round(raw * 10) / 10;
}

// Round to integer for display in compact UI; keep sign
export function displayPoints(value, { decimal = false, sign = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  const rounded = decimal ? Math.round(value * 10) / 10 : Math.round(value);
  if (!sign) return String(rounded);
  if (rounded > 0) return `+${rounded}`;
  return String(rounded);
}
