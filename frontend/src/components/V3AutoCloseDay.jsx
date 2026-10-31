import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useOptionalV3Execution } from "../context/V3ExecutionContext";
import { cbeNow, todayISO } from "../lib/dateUtils";

// v3 auto-close coordinator. It decides only WHEN a close is due; all lifecycle
// semantics (missed habits, Second Chance, terminal state) live in Core.
export default function V3AutoCloseDay() {
  const { dailyPlans, settings, updateSettings } = useApp();
  const v3 = useOptionalV3Execution();
  const closingRef = useRef(new Set());

  useEffect(() => {
    if (!v3?.isEnabled("dayClose")) return;
    const debugForce = !!settings?.debugForceAutoCloseAt;
    if (!settings?.autoCloseDayEnabled && !debugForce) return;

    const today = todayISO();
    const now = cbeNow();
    const closeTime = settings?.autoCloseDayTime || "23:59";
    const hhmm = now.toTimeString().slice(0, 5);
    const state = v3.read();
    const closedDays = state?.closedDays || {};

    const dueDates = Object.entries(dailyPlans || {})
      .filter(([date, plan]) => plan?.dayStatus === "open")
      .map(([date]) => date)
      .filter(date => !closedDays[date])
      .filter(date => debugForce
        ? date === today
        : (date < today || (date === today && hhmm >= closeTime)));

    for (const date of dueDates) {
      if (closingRef.current.has(date)) continue;
      closingRef.current.add(date);
      try {
        v3.closeDay(date, "auto", now.toISOString());
      } finally {
        closingRef.current.delete(date);
      }
    }

    if (debugForce) updateSettings({ debugForceAutoCloseAt: null });
  }, [dailyPlans, settings, updateSettings, v3, v3?.revision]);

  return null;
}
