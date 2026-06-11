import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  loadEntries,
  saveEntries,
  loadActions,
  saveActions,
  loadSettings,
  saveSettings,
  generateId,
} from "../lib/storage";
import { todayISO, nowTimeHHMM } from "../lib/dateUtils";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [entries, setEntries] = useState(() => loadEntries());
  const [actions, setActions] = useState(() => loadActions());
  const [settings, setSettings] = useState(() => loadSettings());
  const [lastDeleted, setLastDeleted] = useState(null);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    saveActions(actions);
  }, [actions]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

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

  const value = useMemo(
    () => ({
      entries,
      actions,
      settings,
      updateSettings,
      logAction,
      deleteEntry,
      restoreEntry,
      undoLastEntry,
      undoDelete,
      addAction,
      updateAction,
      deleteAction,
    }),
    [entries, actions, settings, updateSettings, logAction, deleteEntry, restoreEntry, undoLastEntry, undoDelete, addAction, updateAction, deleteAction],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
