import { createV3Bridge } from "../core/v3/bridge";
import { saveV3Flags } from "../core/v3/featureFlags";

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
}

describe("CBE v3 React rollout contract", () => {
  test("diagnostic reads are available without granting UI write ownership", () => {
    const storage = memoryStorage();
    saveV3Flags({ executionRead: true, executionWrite: false, dayClose: false }, storage);
    const bridge = createV3Bridge({ storage, dailyPlans: { "2026-10-31": { items: [{ id: "x", actionId: "clean", name: "Cleaning", status: "planned" }] } } });
    expect(bridge.isEnabled("executionRead")).toBe(true);
    expect(bridge.isEnabled("executionWrite")).toBe(false);
    const item = bridge.day("2026-10-31")[0];
    expect(item.name).toBe("Cleaning");
    expect(bridge.complete(item.id)).toBeNull();
    expect(bridge.day("2026-10-31")[0].complete).toBe(false);
  });

  test("write ownership can be enabled independently after read comparison", () => {
    const storage = memoryStorage();
    saveV3Flags({ executionRead: true, executionWrite: true, dayClose: false }, storage);
    const bridge = createV3Bridge({ storage, dailyPlans: { "2026-10-31": { items: [{ id: "x", actionId: "clean", name: "Cleaning", status: "planned" }] } } });
    const item = bridge.day("2026-10-31")[0];
    bridge.complete(item.id);
    expect(bridge.day("2026-10-31")[0].complete).toBe(true);
    expect(bridge.isEnabled("dayClose")).toBe(false);
  });
});
