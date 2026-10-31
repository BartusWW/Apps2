import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createV3Bridge } from "../core/v3/bridge";
import { COMMAND } from "../core/v3/commands";
import { todayISO } from "../lib/dateUtils";
import { useApp } from "./AppContext";

const V3ExecutionContext = createContext(null);

// CBE 3.1 ownership rule:
// - dailyPlans and recurring rules may introduce/schedule occurrences only.
// - Core is the only owner of execution progress/status/lifecycle.
// - Entries are an append-only scoring/history projection of accepted Core commands.
// There is deliberately no Entries -> Core or legacy execution -> Core reconciliation here.
export function V3ExecutionProvider({ children, dailyPlans = {}, recurringTasks = [], actions = [], storage = globalThis?.localStorage }) {
  const { entries, addEntryAt } = useApp();
  const bridgeRef = useRef(null);
  if (!bridgeRef.current) bridgeRef.current = createV3Bridge({ storage, dailyPlans, actions });
  const bridge = bridgeRef.current;
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => setRevision(x => x + 1), []);
  const run = useCallback(fn => (...args) => {
    const result = fn(...args);
    if (result) refresh();
    return result;
  }, [refresh]);

  // Planning is one-way. New legacy plan occurrences may enter Core, but legacy
  // progress/status can never overwrite an existing Core instance.
  useEffect(() => {
    bridge.ingestLegacy({ dailyPlans, actions });
    refresh();
  }, [bridge, dailyPlans, actions, refresh]);

  // Recurring & Habits is a scheduling source, not an execution owner. Every
  // enabled rule due today is materialized as one dated Core occurrence. The
  // scheduler is idempotent, so settings edits/re-renders cannot duplicate it.
  useEffect(() => {
    bridge.schedule({ date: todayISO(), rules: recurringTasks, actions });
    refresh();
  }, [bridge, recurringTasks, actions, refresh]);

  const execute = useCallback(command => {
    const result = bridge.dispatchWithEffect({ command, actions, entries });
    if (!result) return null;
    if (result.effect) addEntryAt(result.effect);
    refresh();
    return result;
  }, [bridge, actions, entries, addEntryAt, refresh]);

  const value = useMemo(() => ({
    revision,
    flags: bridge.flags(),
    isEnabled: bridge.isEnabled,
    read: bridge.read,
    day: bridge.day,
    summary: bridge.summary,
    today: () => bridge.day(todayISO()),
    todaySummary: () => bridge.summary(todayISO()),
    execute,
    log: (instanceId, amount = 1, options = {}) => execute({ type: COMMAND.LOG, instanceId, amount, ...options }),
    complete: (instanceId, options = {}) => execute({ type: COMMAND.COMPLETE, instanceId, ...options }),
    delay: (instanceId, options = {}) => execute({ type: COMMAND.DELAY, instanceId, ...options }),
    dismiss: (instanceId, reason = "dismissed", options = {}) => execute({ type: COMMAND.DISMISS, instanceId, reason, ...options }),
    closeDay: run(bridge.closeDay),
    schedule: run(bridge.schedule),
    refresh,
  }), [bridge, revision, execute, run, refresh]);

  return <V3ExecutionContext.Provider value={value}>{children}</V3ExecutionContext.Provider>;
}

export function useV3Execution() {
  const value = useContext(V3ExecutionContext);
  if (!value) throw new Error("useV3Execution must be used inside V3ExecutionProvider");
  return value;
}

export function useOptionalV3Execution() {
  return useContext(V3ExecutionContext);
}
