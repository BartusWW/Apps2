import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  loadEntries,
  saveEntries,
  loadActions,
  saveActions,
  loadSettings,
  saveSettings,
  loadNotes,
  saveNotes,
  loadDailyPlans,
  saveDailyPlans,
  generateId,
} from "../lib/storage";
import { todayISO, nowTimeHHMM } from "../lib/dateUtils";
import { computePoints } from "../lib/scoring";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [entries, setEntries] = useState(() => loadEntries());
  const [actions, setActions] = useState(() => loadActions());
  const [settings, setSettings] = useState(() => loadSettings());
  const [notes, setNotes] = useState(() => loadNotes());
  const [dailyPlans, setDailyPlans] = useState(() => loadDailyPlans());
  const [lastDeleted, setLastDeleted] = useState(null);

  useEffect(() => saveEntries(entries), [entries]);
  useEffect(() => saveActions(actions), [actions]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveNotes(notes), [notes]);
  useEffect(() => saveDailyPlans(dailyPlans), [dailyPlans]);

  // ----- Settings -----
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // ----- Notes -----
  const updateWeeklyNote = useCallback((key, patch) => {
    setNotes((prev) => ({
      ...prev,
      weekly: { ...prev.weekly, [key]: { ...prev.weekly[key], ...patch } },
    }));
  }, []);
  const updateMonthlyNote = useCallback((key, patch) => {
    setNotes((prev) => ({
      ...prev,
      monthly: { ...prev.monthly, [key]: { ...prev.monthly[key], ...patch } },
    }));
  }, []);

  // ----- Daily plans -----
  const updateDailyPlan = useCallback((date, patch) => {
    setDailyPlans((prev) => ({
      ...prev,
      [date]: { ...(prev[date] || {}), ...patch },
    }));
  }, []);

  // ----- Entries (v1 legacy logAction kept for backwards compat) -----
  const logAction = useCallback((action) => {
    const entry = {
      id: generateId(),
      date: todayISO(),
      time: nowTimeHHMM(),
      category: action.category,
      actionName: action.name,
      minutes: action.minutes || 0,
      points: action.points,
      type: action.type,
    };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  // v2: log purely by category + minutes; points computed from time
  const logActivity = useCallback(({ category, type, minutes, icon, date, time }) => {
    const safeMin = Math.max(0, Number(minutes) || 0);
    const pts = computePoints(safeMin, type);
    const entry = {
      id: generateId(),
      date: date || todayISO(),
      time: time || nowTimeHHMM(),
      category,
      actionName: `${safeMin}m ${category}`,
      minutes: safeMin,
      points: pts,
      type,
      icon,
    };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const addEntryAt = useCallback((entry) => {
    const safeEntry = {
      id: entry.id || generateId(),
      date: entry.date,
      time: entry.time || "12:00",
      category: entry.category,
      actionName: entry.actionName || `${entry.minutes}m ${entry.category}`,
      minutes: Number(entry.minutes) || 0,
      points: typeof entry.points === "number"
        ? entry.points
        : computePoints(entry.minutes, entry.type),
      type: entry.type,
      icon: entry.icon,
    };
    setEntries((prev) => [safeEntry, ...prev]);
    return safeEntry;
  }, []);

  const updateEntry = useCallback((id, patch) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next = { ...e, ...patch };
        if (
          (patch.minutes !== undefined || patch.type !== undefined) &&
          patch.points === undefined
        ) {
          next.points = computePoints(next.minutes, next.type);
        }
        return next;
      }),
    );
  }, []);

  const deleteEntry = useCallback((id) => {
    setEntries((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target) setLastDeleted(target);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const restoreEntry = useCallback((entry) => {
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const undoDelete = useCallback(() => {
    if (lastDeleted) {
      setEntries((prev) => [lastDeleted, ...prev]);
      setLastDeleted(null);
    }
  }, [lastDeleted]);

  const undoLastEntry = useCallback(() => {
    setEntries((prev) => prev.slice(1));
  }, []);

  // ----- Actions (legacy) -----
  const addAction = useCallback((action) => {
    const newAction = { ...action, id: generateId() };
    setActions((prev) => [...prev, newAction]);
    return newAction;
  }, []);
  const updateAction = useCallback((id, patch) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);
  const deleteAction = useCallback((id) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ----- Habits -----
  const habits = settings.habits || [];

  const addHabit = useCallback(
    (habit) => {
      const next = { ...habit, id: habit.id || generateId() };
      setSettings((prev) => ({ ...prev, habits: [...(prev.habits || []), next] }));
      return next;
    },
    [],
  );

  const updateHabit = useCallback((id, patch) => {
    setSettings((prev) => ({
      ...prev,
      habits: (prev.habits || []).map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));
  }, []);

  const deleteHabit = useCallback((id) => {
    setSettings((prev) => ({
      ...prev,
      habits: (prev.habits || []).filter((h) => h.id !== id),
    }));
  }, []);

  // Reload all state from localStorage (used after Import / Reset)
  const reloadFromStorage = useCallback(() => {
    setEntries(loadEntries());
    setActions(loadActions());
    setSettings(loadSettings());
    setNotes(loadNotes());
    setDailyPlans(loadDailyPlans());
  }, []);

  const value = useMemo(
    () => ({
      entries,
      actions,
      settings,
      notes,
      dailyPlans,
      habits,
      updateSettings,
      updateWeeklyNote,
      updateMonthlyNote,
      updateDailyPlan,
      logAction,
      logActivity,
      addEntryAt,
      updateEntry,
      deleteEntry,
      restoreEntry,
      undoLastEntry,
      undoDelete,
      addAction,
      updateAction,
      deleteAction,
      addHabit,
      updateHabit,
      deleteHabit,
      reloadFromStorage,
    }),
    [
      entries, actions, settings, notes, dailyPlans, habits,
      updateSettings, updateWeeklyNote, updateMonthlyNote, updateDailyPlan,
      logAction, logActivity, addEntryAt, updateEntry, deleteEntry, restoreEntry,
      undoLastEntry, undoDelete, addAction, updateAction, deleteAction,
      addHabit, updateHabit, deleteHabit, reloadFromStorage,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
