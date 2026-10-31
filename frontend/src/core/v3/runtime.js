import { executeCommand } from "./commands";
import { bootstrapV3State, loadV3State, saveV3State, transactV3State } from "./storage";
import { scheduleDay } from "./scheduler";

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

  const schedule = ({ date, rules = [], actions = [] } = {}) => transactV3State(
    state => ({ ...state, instances: scheduleDay(state.instances, { date, rules, actions }) }),
    storage,
    now()
  );

  const replace = state => saveV3State(state, storage, now());

  return { read, bootstrap, dispatch, schedule, replace };
}
