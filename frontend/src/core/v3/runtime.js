import { executeCommand } from "./commands";
import { bootstrapV3State, loadV3State, saveV3State, transactV3State } from "./storage";
import { scheduleRecurringForDate } from "./scheduler";
import { syncLegacyShadow } from "./shadowSync";
import { planExecutionEffect } from "./writeEffects";

// Runtime is the only intended write gateway for UI code. Components dispatch
// commands; they never mutate persisted instances directly.
export function createV3Runtime({ storage = globalThis?.localStorage, now = () => new Date().toISOString() } = {}) {
  const read = () => loadV3State(storage);

  const bootstrap = ({ dailyPlans = {}, actions = [] } = {}) =>
    bootstrapV3State({ dailyPlans, actions, storage, at: now() });

  const dispatch = command => transactV3State(
    state => executeCommand(state, { ...command, at: command?.at || now() }),
    storage,
    now()
  );

  // Returns both the committed Core state and the legacy-compatible scoring
  // entry derived from the actual transition. Persisting the entry remains the
  // React/AppContext responsibility during the migration window.
  const dispatchWithEffect = ({ command, actions = [], entries = [] } = {}) => {
    if (!command?.type) throw new Error("CBE v3 effect dispatch requires command");
    const beforeState = read();
    const normalizedCommand = {
      ...command,
      commandId: command.commandId || `v3-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      at: command.at || now(),
    };
    const afterState = transactV3State(
      state => executeCommand(state, normalizedCommand),
      storage,
      now()
    );
    const effect = planExecutionEffect({
      beforeState,
      afterState,
      command: normalizedCommand,
      actions,
      entries,
    });
    return { state: afterState, effect, command: normalizedCommand };
  };

  const schedule = ({ date, rules = [], actions = [] } = {}) => transactV3State(
    state => ({ ...state, instances: scheduleRecurringForDate(state.instances, rules, actions, date) }),
    storage,
    now()
  );

  const shadowSync = ({ dailyPlans = {}, actions = [] } = {}) => transactV3State(
    state => syncLegacyShadow(state, { dailyPlans, actions }),
    storage,
    now()
  );

  const replace = state => saveV3State(state, storage, now());

  return { read, bootstrap, dispatch, dispatchWithEffect, schedule, shadowSync, replace };
}
