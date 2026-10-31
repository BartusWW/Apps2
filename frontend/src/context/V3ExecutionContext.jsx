import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createV3Bridge } from "../core/v3/bridge";
import { todayISO } from "../lib/dateUtils";

const V3ExecutionContext = createContext(null);

// Isolated React boundary for the v3 execution core. It intentionally does not
// replace AppContext yet: rollout is feature-flagged and can be compared against
// legacy state before any production lifecycle ownership is transferred.
export function V3ExecutionProvider({ children, dailyPlans = {}, actions = [], storage = globalThis?.localStorage }) {
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

  const value = useMemo(() => ({
    revision,
    flags: bridge.flags(),
    isEnabled: bridge.isEnabled,
    read: bridge.read,
    day: bridge.day,
    summary: bridge.summary,
    today: () => bridge.day(todayISO()),
    todaySummary: () => bridge.summary(todayISO()),
    log: run(bridge.log),
    complete: run(bridge.complete),
    dismiss: run(bridge.dismiss),
    closeDay: run(bridge.closeDay),
    schedule: run(bridge.schedule),
    refresh,
  }), [bridge, revision, run, refresh]);

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
