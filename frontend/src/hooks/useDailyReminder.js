import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { todayISO } from "../lib/dateUtils";

/**
 * Browser-based daily reminder.
 * Limitation: only fires while the app/tab is open in the browser
 * (no service worker / push). Good enough for an MVP PWA-style tracker.
 */
export default function useDailyReminder() {
  const { settings, updateSettings, entries } = useApp();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!settings.reminderEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const check = () => {
      if (typeof window === "undefined" || typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;

      const today = todayISO();
      if (settings.lastReminderDate === today) return;

      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      // Fire when current time has passed reminderTime
      if (hhmm < settings.reminderTime) return;

      // Skip if user already logged a positive entry today
      const hasPositiveToday = entries.some(
        (e) => e.date === today && e.type === "positive",
      );
      const body = hasPositiveToday
        ? "Nice. Got room for one more deliberate session before the day ends?"
        : "No dev session logged yet today. One block of deep work compounds.";

      try {
        const n = new Notification("CBE Scoreboard", {
          body,
          tag: `cbe-${today}`,
          silent: false,
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch {
        // ignore
      }

      updateSettings({ lastReminderDate: today });
    };

    // Check immediately and then every 60s
    check();
    intervalRef.current = setInterval(check, 60_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings.reminderEnabled, settings.reminderTime, settings.lastReminderDate, entries, updateSettings]);
}
