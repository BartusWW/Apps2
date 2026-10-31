import { COMMAND } from "./commands";
import { selectExecutionDay, selectDayExecutionSummary } from "./selectors";

// The adapter is deliberately boring. Components receive view models and command
// creators only; lifecycle implementation stays inside Core.
export function createV3UIAdapter({ getState, dispatch }) {
  if (typeof getState !== "function" || typeof dispatch !== "function") {
    throw new Error("CBE v3 UI adapter requires getState and dispatch");
  }

  return {
    day(date) {
      return selectExecutionDay(getState(), date);
    },
    summary(date) {
      return selectDayExecutionSummary(getState(), date);
    },
    log(instanceId, amount = 1, at = null) {
      return dispatch({ type: COMMAND.LOG, instanceId, amount, at });
    },
    complete(instanceId, at = null) {
      return dispatch({ type: COMMAND.COMPLETE, instanceId, at });
    },
    dismiss(instanceId, reason = "dismissed", at = null) {
      return dispatch({ type: COMMAND.DISMISS, instanceId, reason, at });
    },
    closeDay(date, source = "manual", at = null) {
      return dispatch({ type: COMMAND.CLOSE_DAY, date, source, at });
    },
  };
}
