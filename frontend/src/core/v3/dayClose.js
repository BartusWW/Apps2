import { closeDay } from "./engine";

// One command for every day-close entry point. Manual UI and automatic close
// must call this function instead of implementing lifecycle rules themselves.
export const DAY_CLOSE_SOURCE = Object.freeze({
  MANUAL: "manual",
  AUTO: "auto",
});

export function nextISODate(date) {
  const [year, month, day] = String(date || "").split("-").map(Number);
  if (!year || !month || !day) throw new Error("CBE v3 day close requires YYYY-MM-DD date");
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}

export function closeExecutionDay(state, {
  date,
  source = DAY_CLOSE_SOURCE.MANUAL,
  at = null,
} = {}) {
  if (!date) throw new Error("CBE v3 day close requires date");
  const instances = Array.isArray(state?.instances) ? state.instances : [];
  const alreadyClosed = state?.closedDays?.[date];
  if (alreadyClosed) return state;

  const nextDate = nextISODate(date);
  const closedInstances = closeDay(instances, date, nextDate, at);
  return {
    ...state,
    instances: closedInstances,
    closedDays: {
      ...(state?.closedDays || {}),
      [date]: {
        date,
        nextDate,
        source,
        closedAt: at,
      },
    },
  };
}
