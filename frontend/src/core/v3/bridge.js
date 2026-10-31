import { createV3Runtime } from "./runtime";
import { createV3UIAdapter } from "./uiAdapter";
import { isV3FeatureEnabled, loadV3Flags } from "./featureFlags";

// Transitional bridge used by React/AppContext while v2 lifecycle still exists.
// v3 remains opt-in until each subsystem passes its regression gate.
export function createV3Bridge({
  storage = globalThis?.localStorage,
  now,
  dailyPlans = {},
  actions = [],
} = {}) {
  const runtime = createV3Runtime({ storage, now });
  runtime.bootstrap({ dailyPlans, actions });

  const adapter = createV3UIAdapter({
    getState: runtime.read,
    dispatch: runtime.dispatch,
  });

  const flags = () => loadV3Flags(storage);

  return {
    read: runtime.read,
    flags,
    isEnabled: feature => isV3FeatureEnabled(flags(), feature),
    day: date => adapter.day(date),
    summary: date => adapter.summary(date),
    log: (...args) => {
      if (!isV3FeatureEnabled(flags(), "executionWrite")) return null;
      return adapter.log(...args);
    },
    complete: (...args) => {
      if (!isV3FeatureEnabled(flags(), "executionWrite")) return null;
      return adapter.complete(...args);
    },
    dismiss: (...args) => {
      if (!isV3FeatureEnabled(flags(), "executionWrite")) return null;
      return adapter.dismiss(...args);
    },
    closeDay: (...args) => {
      if (!isV3FeatureEnabled(flags(), "dayClose")) return null;
      return adapter.closeDay(...args);
    },
    schedule: runtime.schedule,
  };
}
