import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createV3Bridge } from "../core/v3/bridge";
import { COMMAND } from "../core/v3/commands";
import { todayISO } from "../lib/dateUtils";
import { useApp } from "./AppContext";

const V3ExecutionContext = createContext(null);

// Isolated React boundary for the v3 execution core. During migration AppContext
// remains the persistence owner for scoring entries while v3 owns execution state.
export function V3ExecutionProvider({ children, dailyPlans = {}, actions = [], storage = globalThis?.localStorage }) {
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

  // Shadow sync is strictly a migration mechanism. The moment v3 owns writes,
  // legacy state must no longer be allowed to feed execution state back into Core.
  useEffect(() => {
    if (bridge.isEnabled("executionWrite")) return;
    bridge.shadowSync({ dailyPlans, actions });
    refresh();
  }, [bridge, dailyPlans, actions, refresh]);

  // Single React write gateway. Core commits first; only the scoring effect derived
  // from that accepted transition is appended to legacy Entries. addEntryAt keeps
  // the effect id intact so retries can be detected by the bridge.
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
