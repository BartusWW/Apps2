import { sameOccurrence } from "./occurrenceIdentity";

function recoveryFor(instances,candidate){
  return (Array.isArray(instances)?instances:[]).find(x =>
    x?.date === candidate?.date &&
    x?.actionId === candidate?.actionId &&
    (x?.source === "second-chance" || x?.kind === "habit-recovery")
  ) || null;
}

// Candidate definitions are canonical for today's base target. Recovery may add
// debt to that target, but an already-materialized occurrence must never replace
// a freshly edited candidate definition.
export function applyRecoveryDebtToCandidate(instances,candidate){
  if(!candidate||candidate.kind!=="habit")return candidate;
  const recovery=recoveryFor(instances,candidate);
  if(!recovery)return candidate;
  const debt=Math.max(0,Number(recovery.metadata?.recoveryDebt)||0);
  if(!(debt>0))return candidate;
  const baseTarget=Math.max(0,Number(candidate.target)||Number(recovery.metadata?.recoveryBaseTarget)||0);
  return{
    ...candidate,
    target:baseTarget+debt,
    source:"recurring",
    secondChanceFor:null,
    metadata:{
      ...(candidate.metadata||{}),
      secondChance:true,
      recoveryDebt:debt,
      recoveryBaseTarget:baseTarget,
      recoveryFor:recovery.secondChanceFor||recovery.metadata?.originalInstanceId||null,
      recoveryOriginalDate:recovery.metadata?.originalDate||null,
    },
  };
}

// Attach an earned recovery debt to today's single base Habit occurrence.
// Second Chance is not a second executable card: it increases today's target
// from base -> base + debt and records the recovery metadata on that Habit.
export function mergeRecoveryIntoHabit(instances, candidate) {
  const list = Array.isArray(instances) ? instances : [];
  if (!candidate || candidate.kind !== "habit") return list;
  const recoveryIndex = list.findIndex(x => x === recoveryFor(list,candidate));
  if (recoveryIndex < 0) return list;

  const recovery = list[recoveryIndex];
  const debt = Math.max(0, Number(recovery.metadata?.recoveryDebt) || 0);
  if (!(debt > 0)) return list.filter((_, i) => i !== recoveryIndex);

  const merged = applyRecoveryDebtToCandidate(list,candidate);
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
