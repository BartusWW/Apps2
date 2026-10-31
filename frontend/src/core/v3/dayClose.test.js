import { createInstance, INSTANCE_STATUS, selectDay } from "./engine";
import { closeExecutionDay, DAY_CLOSE_SOURCE, nextISODate } from "./dayClose";

describe("CBE v3 unified day close", () => {
  test("date rollover works across month and year boundaries", () => {
    expect(nextISODate("2026-10-31")).toBe("2026-11-01");
    expect(nextISODate("2026-12-31")).toBe("2027-01-01");
  });

  test.each([DAY_CLOSE_SOURCE.MANUAL, DAY_CLOSE_SOURCE.AUTO])(
    "%s close uses identical habit recovery semantics",
    source => {
      const habit = createInstance({ date: "2026-10-31", actionId: "read", kind: "habit" });
      const task = createInstance({ date: "2026-10-31", actionId: "clean", kind: "task" });
      const state = closeExecutionDay({ instances: [habit, task], closedDays: {} }, {
        date: "2026-10-31",
        source,
        at: "close-time",
      });
      const today = selectDay(state.instances, "2026-10-31");
      const tomorrow = selectDay(state.instances, "2026-11-01");
      expect(today.find(x => x.kind === "habit").status).toBe(INSTANCE_STATUS.MISSED);
      expect(today.find(x => x.kind === "task").status).toBe(INSTANCE_STATUS.RESOLVED);
      expect(tomorrow).toHaveLength(1);
      expect(tomorrow[0].source).toBe("second-chance");
      expect(state.closedDays["2026-10-31"].source).toBe(source);
    }
  );

  test("closing the same day twice is idempotent", () => {
    const habit = createInstance({ date: "2026-10-31", actionId: "read", kind: "habit" });
    const first = closeExecutionDay({ instances: [habit], closedDays: {} }, {
      date: "2026-10-31",
      source: DAY_CLOSE_SOURCE.MANUAL,
      at: "first",
    });
    const second = closeExecutionDay(first, {
      date: "2026-10-31",
      source: DAY_CLOSE_SOURCE.AUTO,
      at: "second",
    });
    expect(second).toEqual(first);
    expect(selectDay(second.instances, "2026-11-01")).toHaveLength(1);
  });
});
