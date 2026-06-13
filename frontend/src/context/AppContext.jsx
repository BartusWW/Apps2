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
  loadBrainDumps,
  saveBrainDumps,
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
  const [brainDumps, setBrainDumps] = useState(() => loadBrainDumps());
  const [lastDeleted, setLastDeleted] = useState(null);

  useEffect(() => saveEntries(entries), [entries]);
  useEffect(() => saveActions(actions), [actions]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveNotes(notes), [notes]);
  useEffect(() => saveDailyPlans(dailyPlans), [dailyPlans]);
  useEffect(() => saveBrainDumps(brainDumps), [brainDumps]);

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
    setBrainDumps(loadBrainDumps());
  }, []);

  // ----- Brain Dump -----
  const addBrainDump = useCallback(({ text, category = "General" }) => {
    if (!text || !text.trim()) return null;
    const item = {
      id: generateId(),
      ts: new Date().toISOString(),
      date: todayISO(),
      category,
      text: text.trim(),
    };
    setBrainDumps((prev) => [item, ...prev]);
    return item;
  }, []);

  const updateBrainDump = useCallback((id, patch) => {
    setBrainDumps((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);

  const deleteBrainDump = useCallback((id) => {
    setBrainDumps((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ----- Pinned categories -----
  const togglePinCategory = useCallback((name) => {
    setSettings((prev) => {
      const pinned = prev.pinnedCategories || [];
      const next = pinned.includes(name)
        ? pinned.filter((n) => n !== name)
        : [...pinned, name];
      return { ...prev, pinnedCategories: next };
    });
  }, []);

  // ----- Category collapsed state -----
  const toggleCategoryCollapsed = useCallback((name) => {
    setSettings((prev) => {
      const collapsed = prev.collapsedCategories || [];
      const next = collapsed.includes(name)
        ? collapsed.filter((n) => n !== name)
        : [...collapsed, name];
      return { ...prev, collapsedCategories: next };
    });
  }, []);

  // ----- Category sort order -----
  const moveCategoryOrder = useCallback((name, delta) => {
    setSettings((prev) => {
      const cats = [...(prev.categories || [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      const idx = cats.findIndex((c) => c.name === name);
      const newIdx = idx + delta;
      if (idx < 0 || newIdx < 0 || newIdx >= cats.length) return prev;
      [cats[idx], cats[newIdx]] = [cats[newIdx], cats[idx]];
      const renumbered = cats.map((c, i) => ({ ...c, sortOrder: i }));
      return { ...prev, categories: renumbered };
    });
  }, []);

  // ----- Log Modal global state -----
  const [logModal, setLogModal] = useState({ open: false, categoryName: null });
  const openLogModal = useCallback((categoryName) => {
    setLogModal({ open: true, categoryName });
  }, []);
  const closeLogModal = useCallback(() => {
    setLogModal({ open: false, categoryName: null });
  }, []);

  const reorderPinned = useCallback((fromIndex, toIndex) => {
    setSettings((prev) => {
      const arr = [...(prev.pinnedCategories || [])];
      if (
        fromIndex < 0 ||
        fromIndex >= arr.length ||
        toIndex < 0 ||
        toIndex >= arr.length
      ) return prev;
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return { ...prev, pinnedCategories: arr };
    });
  }, []);

  // ----- Home layout -----
  const setLayoutVisible = useCallback((id, visible) => {
    setSettings((prev) => ({
      ...prev,
      homeLayout: (prev.homeLayout || []).map((l) =>
        l.id === id ? { ...l, visible } : l,
      ),
    }));
  }, []);

  const moveLayoutItem = useCallback((id, delta) => {
    setSettings((prev) => {
      const arr = [...(prev.homeLayout || [])];
      const idx = arr.findIndex((l) => l.id === id);
      const newIdx = idx + delta;
      if (idx < 0 || newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, homeLayout: arr };
    });
  }, []);

  const value = useMemo(
    () => ({
      entries,
      actions,
      settings,
      notes,
      dailyPlans,
      brainDumps,
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
      addBrainDump,
      updateBrainDump,
      deleteBrainDump,
      togglePinCategory,
      reorderPinned,
      toggleCategoryCollapsed,
      moveCategoryOrder,
      logModal,
      openLogModal,
      closeLogModal,
      setLayoutVisible,
      moveLayoutItem,
      reloadFromStorage,
    }),
    [
      entries, actions, settings, notes, dailyPlans, brainDumps, habits,
      updateSettings, updateWeeklyNote, updateMonthlyNote, updateDailyPlan,
      logAction, logActivity, addEntryAt, updateEntry, deleteEntry, restoreEntry,
      undoLastEntry, undoDelete, addAction, updateAction, deleteAction,
      addHabit, updateHabit, deleteHabit,
      addBrainDump, updateBrainDump, deleteBrainDump,
      togglePinCategory, reorderPinned, toggleCategoryCollapsed, moveCategoryOrder,
      logModal, openLogModal, closeLogModal,
      setLayoutVisible, moveLayoutItem,
      reloadFromStorage,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
