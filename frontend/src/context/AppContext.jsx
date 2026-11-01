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
  loadGoals,
  saveGoals,
  generateId,
} from "../lib/storage";
import { todayISO, nowTimeHHMM } from "../lib/dateUtils";
import { computePoints } from "../lib/scoring";
import { buildCompletionSnapshot } from "../lib/goals";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [entries, setEntries] = useState(() => loadEntries());
  const [actions, setActions] = useState(() => loadActions());
  const [settings, setSettings] = useState(() => loadSettings());
  const [notes, setNotes] = useState(() => loadNotes());
  const [dailyPlans, setDailyPlans] = useState(() => loadDailyPlans());
  const [brainDumps, setBrainDumps] = useState(() => loadBrainDumps());
  const [goals, setGoals] = useState(() => loadGoals());
  const [lastDeleted, setLastDeleted] = useState(null);

  useEffect(() => saveEntries(entries), [entries]);
  useEffect(() => saveActions(actions), [actions]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveNotes(notes), [notes]);
  useEffect(() => saveDailyPlans(dailyPlans), [dailyPlans]);
  useEffect(() => saveBrainDumps(brainDumps), [brainDumps]);
  useEffect(() => saveGoals(goals), [goals]);

  const updateSettings = useCallback((patch) => setSettings((prev) => ({ ...prev, ...patch })), []);
  const updateWeeklyNote = useCallback((key, patch) => setNotes((prev) => ({ ...prev, weekly: { ...prev.weekly, [key]: { ...prev.weekly[key], ...patch } } })), []);
  const updateMonthlyNote = useCallback((key, patch) => setNotes((prev) => ({ ...prev, monthly: { ...prev.monthly, [key]: { ...prev.monthly[key], ...patch } } })), []);
  const updateDailyPlan = useCallback((date, patch) => setDailyPlans((prev) => ({ ...prev, [date]: { ...(prev[date] || {}), ...patch } })), []);

  const logAction = useCallback((action) => {
    const entry = {
      id: generateId(),
      date: todayISO(),
      time: nowTimeHHMM(),
      category: action.category,
      subcategory: action.subcategory || null,
      actionName: action.name,
      minutes: action.minutes || 0,
      points: action.points,
      type: action.type,
    };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const logActivity = useCallback(({ actionId, category, subcategory, type, minutes, icon, date, time, points, actionName }) => {
    const safeMin = Math.max(0, Number(minutes) || 0);
    const pts = typeof points === "number" ? points : safeMin > 0 ? computePoints(safeMin, type) : 0;
    const entry = {
      id: generateId(),
      date: date || todayISO(),
      time: time || nowTimeHHMM(),
      category,
      subcategory: subcategory || null,
      actionId: actionId || null,
      actionName: actionName || `${safeMin}m ${category}`,
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
      subcategory: entry.subcategory || null,
      actionName: entry.actionName || `${entry.minutes}m ${entry.category}`,
      minutes: Number(entry.minutes) || 0,
      points: typeof entry.points === "number" ? entry.points : computePoints(entry.minutes, entry.type),
      type: entry.type,
      icon: entry.icon,
    };
    setEntries((prev) => [safeEntry, ...prev]);
    return safeEntry;
  }, []);

  const updateEntry = useCallback((id, patch) => setEntries((prev) => prev.map((e) => {
    if (e.id !== id) return e;
    const next = { ...e, ...patch };
    if ((patch.minutes !== undefined || patch.type !== undefined) && patch.points === undefined) next.points = computePoints(next.minutes, next.type);
    return next;
  })), []);

  const deleteEntry = useCallback((id) => setEntries((prev) => { const target = prev.find((e) => e.id === id); if (target) setLastDeleted(target); return prev.filter((e) => e.id !== id); }), []);
  const restoreEntry = useCallback((entry) => setEntries((prev) => [entry, ...prev]), []);
  const undoDelete = useCallback(() => { if (lastDeleted) { setEntries((prev) => [lastDeleted, ...prev]); setLastDeleted(null); } }, [lastDeleted]);
  const undoLastEntry = useCallback(() => setEntries((prev) => prev.slice(1)), []);

  const addAction = useCallback((action) => { const newAction = { ...action, id: generateId() }; setActions((prev) => [...prev, newAction]); return newAction; }, []);
  const updateAction = useCallback((id, patch) => setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))), []);
  const deleteAction = useCallback((id) => setActions((prev) => prev.filter((a) => a.id !== id)), []);

  const habits = settings.habits || [];
  const addHabit = useCallback((habit) => { const next = { ...habit, id: habit.id || generateId() }; setSettings((prev) => ({ ...prev, habits: [...(prev.habits || []), next] })); return next; }, []);
  const updateHabit = useCallback((id, patch) => setSettings((prev) => ({ ...prev, habits: (prev.habits || []).map((h) => (h.id === id ? { ...h, ...patch } : h)) })), []);
  const deleteHabit = useCallback((id) => setSettings((prev) => ({ ...prev, habits: (prev.habits || []).filter((h) => h.id !== id) })), []);

  const reloadFromStorage = useCallback(() => { setEntries(loadEntries()); setActions(loadActions()); setSettings(loadSettings()); setNotes(loadNotes()); setDailyPlans(loadDailyPlans()); setBrainDumps(loadBrainDumps()); setGoals(loadGoals()); }, []);

  const addBrainDump = useCallback(({ text, category = "General" }) => { if (!text || !text.trim()) return null; const item = { id: generateId(), ts: new Date().toISOString(), date: todayISO(), category, text: text.trim() }; setBrainDumps((prev) => [item, ...prev]); return item; }, []);
  const updateBrainDump = useCallback((id, patch) => setBrainDumps((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b))), []);
  const deleteBrainDump = useCallback((id) => setBrainDumps((prev) => prev.filter((b) => b.id !== id)), []);

  const togglePinCategory = useCallback((name) => setSettings((prev) => { const pinned = prev.pinnedCategories || []; const next = pinned.includes(name) ? pinned.filter((n) => n !== name) : [...pinned, name]; return { ...prev, pinnedCategories: next }; }), []);
  const togglePinAction = useCallback((id) => setSettings((prev) => { const pinned = prev.pinnedActionIds || []; const next = pinned.includes(id) ? pinned.filter((x) => x !== id) : [...pinned, id]; return { ...prev, pinnedActionIds: next }; }), []);
  const toggleCategoryCollapsed = useCallback((name) => setSettings((prev) => { const collapsed = prev.collapsedCategories || []; const next = collapsed.includes(name) ? collapsed.filter((n) => n !== name) : [...collapsed, name]; return { ...prev, collapsedCategories: next }; }), []);

  const moveCategoryOrder = useCallback((name, delta) => setSettings((prev) => {
    const cats = [...(prev.categories || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const idx = cats.findIndex((c) => c.name === name);
    const newIdx = idx + delta;
    if (idx < 0 || newIdx < 0 || newIdx >= cats.length) return prev;
    [cats[idx], cats[newIdx]] = [cats[newIdx], cats[idx]];
    return { ...prev, categories: cats.map((c, i) => ({ ...c, sortOrder: i })) };
  }), []);

  const setCategoryOrder = useCallback((orderedNames) => setSettings((prev) => {
    const byName = Object.fromEntries((prev.categories || []).map((c) => [c.name, c]));
    const next = orderedNames.map((name, i) => (byName[name] ? { ...byName[name], sortOrder: i } : null)).filter(Boolean);
    const seen = new Set(orderedNames);
    for (const c of prev.categories || []) if (!seen.has(c.name)) next.push({ ...c, sortOrder: next.length });
    return { ...prev, categories: next };
  }), []);

  const addGoal = useCallback((goal) => {
    const next = {
      id: goal.id || generateId(), name: (goal.name || "").trim() || "Untitled Goal", icon: goal.icon || "Target", color: goal.color || "emerald", description: (goal.description || "").trim(),
      targetAllocation: Math.max(0, Math.min(100, Number(goal.targetAllocation) || 0)), priorityWeight: Math.max(1, Math.min(10, Number(goal.priorityWeight) || 5)), status: goal.status || "active",
      linkedActivities: Array.isArray(goal.linkedActivities) ? goal.linkedActivities : [], linkedHabits: Array.isArray(goal.linkedHabits) ? goal.linkedHabits : [], notes: (goal.notes || "").trim(),
      createdAt: goal.createdAt || new Date().toISOString(), completedAt: null, finalNotes: null, deadline: goal.deadline || null, deadlineType: goal.deadlineType || "none", displayPreset: goal.displayPreset || "balanced",
      displayMetrics: goal.displayMetrics || null, viewMode: goal.viewMode || "detailed", progressType: goal.progressType || (Array.isArray(goal.linkedActivities) && goal.linkedActivities.length > 0 ? "hours" : "manual"),
      progress: { manualPct: 0, valueCurrent: 0, valueTarget: 0, valueUnit: "items", checklist: [], hoursTarget: 0, ongoing: { weeklyTargetMinutes: 0, monthlyTargetMinutes: 0, milestones: [] }, ...(goal.progress || {}) }, pinned: goal.pinned === true,
    };
    setGoals((prev) => [next, ...prev]); return next;
  }, []);
  const updateGoal = useCallback((id, patch) => setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g))), []);
  const completeGoal = useCallback((id, { completedAt, finalNotes } = {}) => setGoals((prev) => prev.map((g) => {
    if (g.id !== id) return g;
    const snapshot = buildCompletionSnapshot(g, entries);
    return { ...g, ...snapshot, status: "completed", completedAt: completedAt || new Date().toISOString(), finalNotes: finalNotes ? String(finalNotes).trim() : null };
  })), [entries]);
  const archiveGoal = useCallback((id) => setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status: "archived" } : g))), []);
  const restoreGoal = useCallback((id) => setGoals((prev) => prev.map((g) => g.id === id ? { ...g, status: "active", completedAt: null, finalNotes: null } : g)), []);
  const deleteGoal = useCallback((id) => setGoals((prev) => prev.filter((g) => g.id !== id)), []);
  const togglePinGoal = useCallback((id) => setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, pinned: !g.pinned } : g))), []);
  const updateGoalProgress = useCallback((id, patch) => setGoals((prev) => prev.map((g) => {
    if (g.id !== id) return g;
    const merged = { ...(g.progress || {}), ...patch };
    if (patch.ongoing) merged.ongoing = { ...(g.progress?.ongoing || {}), ...patch.ongoing };
    return { ...g, progress: merged };
  })), []);

  const [logModal, setLogModal] = useState({ open: false, actionId: null, categoryName: null });
  const openLogModal = useCallback((payload) => {
    if (typeof payload === "string") setLogModal({ open: true, actionId: null, categoryName: payload });
    else setLogModal({ open: true, actionId: payload?.actionId || null, categoryName: payload?.categoryName || null });
  }, []);
  const closeLogModal = useCallback(() => setLogModal({ open: false, actionId: null, categoryName: null }), []);

  const reorderPinned = useCallback((fromIndex, toIndex) => setSettings((prev) => {
    const arr = [...(prev.pinnedActionIds || [])];
    if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) return prev;
    const [moved] = arr.splice(fromIndex, 1); arr.splice(toIndex, 0, moved); return { ...prev, pinnedActionIds: arr };
  }), []);

  const setLayoutVisible = useCallback((id, visible) => setSettings((prev) => ({ ...prev, homeLayout: (prev.homeLayout || []).map((l) => l.id === id ? { ...l, visible } : l) })), []);
  const moveLayoutItem = useCallback((id, delta) => setSettings((prev) => {
    const arr = [...(prev.homeLayout || [])]; const idx = arr.findIndex((l) => l.id === id); const newIdx = idx + delta;
    if (idx < 0 || newIdx < 0 || newIdx >= arr.length) return prev; [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]; return { ...prev, homeLayout: arr };
  }), []);

  const value = useMemo(() => ({ entries, actions, settings, notes, dailyPlans, brainDumps, habits, goals, updateSettings, updateWeeklyNote, updateMonthlyNote, updateDailyPlan, logAction, logActivity, addEntryAt, updateEntry, deleteEntry, restoreEntry, undoLastEntry, undoDelete, addAction, updateAction, deleteAction, addHabit, updateHabit, deleteHabit, addBrainDump, updateBrainDump, deleteBrainDump, addGoal, updateGoal, completeGoal, archiveGoal, restoreGoal, deleteGoal, togglePinGoal, updateGoalProgress, togglePinCategory, togglePinAction, reorderPinned, toggleCategoryCollapsed, moveCategoryOrder, setCategoryOrder, logModal, openLogModal, closeLogModal, setLayoutVisible, moveLayoutItem, reloadFromStorage }), [entries, actions, settings, notes, dailyPlans, brainDumps, habits, goals, logModal, updateSettings, updateWeeklyNote, updateMonthlyNote, updateDailyPlan, logAction, logActivity, addEntryAt, updateEntry, deleteEntry, restoreEntry, undoLastEntry, undoDelete, addAction, updateAction, deleteAction, addHabit, updateHabit, deleteHabit, addBrainDump, updateBrainDump, deleteBrainDump, addGoal, updateGoal, completeGoal, archiveGoal, restoreGoal, deleteGoal, togglePinGoal, updateGoalProgress, togglePinCategory, togglePinAction, reorderPinned, toggleCategoryCollapsed, moveCategoryOrder, setCategoryOrder, openLogModal, closeLogModal, setLayoutVisible, moveLayoutItem, reloadFromStorage]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { const ctx = useContext(AppContext); if (!ctx) throw new Error("useApp must be used inside AppProvider"); return ctx; }
