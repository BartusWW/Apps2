import { COMMAND } from "./commands";
import { selectInstance } from "./selectors";
import { buildExecutionEntry, hasExecutionEffect, executionEffectId } from "./scoringBridge";

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const round = value => Math.round(n(value) * 10) / 10;

export function executionDelta(before, after) {
  if (!before || !after || before.id !== after.id) return 0;
  return Math.max(0, n(after.progress) - n(before.progress));
}

function crossedBonuses(command, beforeProgress, afterProgress) {
  const tiers = Array.isArray(command?.ambitionTiers) ? command.ambitionTiers : [];
  return tiers.filter(t => n(t?.target) > beforeProgress && n(t?.target) <= afterProgress);
}

// CBE 3.1: Entries are produced only from a transition Core actually accepted.
// UI may provide scoring parameters, but it cannot award work rejected by Core.
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

  const bonuses = crossedBonuses(command, n(before.progress), n(after.progress));
  const ambitionBonusPoints = round(bonuses.reduce((sum, tier) => sum + n(tier?.bonus), 0));
  const points = command.pointsPerAmount != null
    ? round(amount * n(command.pointsPerAmount) + ambitionBonusPoints)
    : command.points != null
      ? round(n(command.points) + ambitionBonusPoints)
      : null;

  return buildExecutionEntry({
    instance: after,
    action,
    amount,
    commandId,
    at: command.at,
    points,
    metadata: {
      ...(command.metadata || {}),
      v3CommandType: command.type,
      v3ProgressBefore: n(before.progress),
      v3ProgressAfter: n(after.progress),
      ...(ambitionBonusPoints > 0 ? { ambitionBonusPoints, ambitionTiers: bonuses.map(x => x.id) } : {}),
    },
  });
}
