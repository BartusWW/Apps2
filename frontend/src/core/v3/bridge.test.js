import { createV3Bridge } from "./bridge";
import { saveV3Flags } from "./featureFlags";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
  };
}

describe("CBE v3 feature-flagged bridge", () => {
  test("writes are inert while v3 executionWrite is disabled", () => {
    const storage = memoryStorage();
    const bridge = createV3Bridge({ storage, dailyPlans: {}, actions: [], now: () => "2026-10-31T12:00:00.000Z" });
    expect(bridge.log("missing", 1)).toBeNull();
    expect(bridge.complete("missing")).toBeNull();
    expect(bridge.dismiss("missing")).toBeNull();
  });

  test("day close is inert until its independent gate is enabled", () => {
    const storage = memoryStorage();
    saveV3Flags({ enabled: true, executionWrite: true, dayClose: false }, storage);
    const bridge = createV3Bridge({ storage, dailyPlans: {}, actions: [], now: () => "2026-10-31T12:00:00.000Z" });
    expect(bridge.closeDay("2026-10-31")).toBeNull();
  });

  test("flags can expose read model without enabling writes", () => {
    const storage = memoryStorage();
    saveV3Flags({ enabled: true, executionRead: true }, storage);
    const bridge = createV3Bridge({ storage, dailyPlans: {}, actions: [], now: () => "2026-10-31T12:00:00.000Z" });
    expect(bridge.isEnabled("executionRead")).toBe(true);
    expect(bridge.isEnabled("executionWrite")).toBe(false);
    expect(bridge.day("2026-10-31")).toEqual([]);
  });
});
