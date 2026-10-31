import { COMMAND } from "./commands";
import { selectInstance } from "./selectors";
import { buildExecutionEntry, hasExecutionEffect, executionEffectId } from "./scoringBridge";

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function executionDelta(before, after) {
  if (!before || !after || before.id !== after.id) return 0;
  return Math.max(0, n(after.progress) - n(before.progress));
}

// Produces the scoring side effect from the actual Core transition, not from
// the requested amount. This is what enforces quantity ceilings and prevents
// CBE being awarded for work Core rejected as duplicate/terminal.
export function planExecutionEffect({ beforeState, afterState, command, actions = [], entries = [] }) {
  if (![COMMAND.LOG, COMMAND.COMPLETE].includes(command?.type)) return null;
  const before = selectInstance(beforeState, command.instanceId);
  const after = selectInstance(afterState, command.instanceId);
  const amount = executionDelta(before, after);
  if (!(amount > 0)) return null;

  const action = (actions || []).find(x => x.id === after.actionId);
  if (!action) throw new Error(`CBE v3 action not found for scoring: ${after.actionId}`);
  const commandId = command.commandId;
  if (!commandId) throw new Error("CBE v3 scoring command requires commandId");
  const effectId = executionEffectId({ instanceId: after.id, commandId });
  if (hasExecutionEffect(entries, effectId)) return null;

  return buildExecutionEntry({
    instance: after,
    action,
    amount,
    commandId,
    at: command.at,
    metadata: {
      v3CommandType: command.type,
      v3ProgressBefore: n(before.progress),
      v3ProgressAfter: n(after.progress),
    },
  });
}
