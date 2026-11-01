import { sameOccurrence } from "./occurrenceIdentity";

// Attach an earned recovery debt to today's single base Habit occurrence.
// Second Chance is not a second executable card: it increases today's target
// from base -> base + debt and records the recovery metadata on that Habit.
export function mergeRecoveryIntoHabit(instances, candidate) {
  const list = Array.isArray(instances) ? instances : [];
  if (!candidate || candidate.kind !== "habit") return list;
  const recoveryIndex = list.findIndex(x =>
    x?.date === candidate.date &&
    x?.actionId === candidate.actionId &&
    (x?.source === "second-chance" || x?.kind === "habit-recovery")
  );
  if (recoveryIndex < 0) return list;

  const recovery = list[recoveryIndex];
  const debt = Math.max(0, Number(recovery.metadata?.recoveryDebt) || 0);
  if (!(debt > 0)) return list.filter((_, i) => i !== recoveryIndex);

  const baseTarget = Math.max(0, Number(candidate.target) || Number(recovery.metadata?.recoveryBaseTarget) || 0);
  const merged = {
    ...candidate,
    target: baseTarget + debt,
    source: "recurring",
    secondChanceFor: null,
    metadata: {
      ...(candidate.metadata || {}),
      secondChance: true,
      recoveryDebt: debt,
      recoveryBaseTarget: baseTarget,
      recoveryFor: recovery.secondChanceFor || recovery.metadata?.originalInstanceId || null,
      recoveryOriginalDate: recovery.metadata?.originalDate || null,
    },
  };

  const baseIndex = list.findIndex((x, i) => i !== recoveryIndex && sameOccurrence(x, candidate));
  const next = list.filter((_, i) => i !== recoveryIndex && i !== baseIndex);
  const existing = baseIndex >= 0 ? list[baseIndex] : null;
  next.push(existing ? {
    ...existing,
    ...merged,
    progress: Number(existing.progress) || 0,
    status: existing.status,
    createdAt: existing.createdAt,
  } : merged);
  return next;
}
