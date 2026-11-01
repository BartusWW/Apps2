import { legacyPlanToInstances } from "./legacyAdapter";

// A recurring rule owns exactly one normal occurrence for a given date. The
// legacy plan item id is only a projection detail and must never create a
// second Core occurrence for the same recurring rule. Second Chance is a
// separate lifecycle occurrence and is therefore keyed independently.
const occurrenceKey = x => {
  if (x.secondChanceFor) return ["second-chance", x.secondChanceFor].join("::");
  if (x.recurringId) return ["recurring", x.date, x.actionId, x.recurringId].join("::");
  return ["planned", x.date, x.actionId, x.metadata?.legacyItemId || x.id || ""].join("::");
};

const terminalRank = status => ({ missed: 5, resolved: 4, dismissed: 3, completed: 2, active: 1 }[status] || 0);
const preferredOccurrence = (a, b) => {
  const primary = a?.source === "recurring" ? a : (b?.source === "recurring" ? b : a);
  const other = primary === a ? b : a;
  const lifecycle = terminalRank(other?.status) > terminalRank(primary?.status) ? other : primary;
  return {
    ...primary,
    progress: Math.max(Number(a?.progress) || 0, Number(b?.progress) || 0),
    status: lifecycle?.status || primary.status,
    completedAt: a?.completedAt || b?.completedAt || null,
    dismissedAt: a?.dismissedAt || b?.dismissedAt || null,
    missedAt: a?.missedAt || b?.missedAt || null,
    resolvedAt: a?.resolvedAt || b?.resolvedAt || null,
    metadata: { ...(other?.metadata || {}), ...(primary?.metadata || {}) },
  };
};

function dedupeCurrent(instances = []) {
  const out = [], byKey = new Map();
  let changed = false;
  for (const instance of instances) {
    const key = occurrenceKey(instance), index = byKey.get(key);
    if (index == null) {
      byKey.set(key, out.length);
      out.push(instance);
      continue;
    }
    out[index] = preferredOccurrence(out[index], instance);
    changed = true;
  }
  return { instances: out, changed };
}

// The sole legacy -> Core planning ingress. dailyPlans may create an occurrence
// and reconcile planning-owned identity/configuration, but can never write
// execution progress or lifecycle state back into Core.
export function ingestLegacyOccurrences(state, { dailyPlans = {}, actions = [] } = {}) {
  const incoming = legacyPlanToInstances(dailyPlans, actions);
  const normalized = dedupeCurrent(Array.isArray(state?.instances) ? state.instances : []);
  const current = [...normalized.instances];
  const byKey = new Map(current.map((x,index)=>[occurrenceKey(x),{instance:x,index}]));
  let changed = normalized.changed;
  for (const planned of incoming) {
    const key=occurrenceKey(planned),match=byKey.get(key);
    if(!match){current.push(planned);byKey.set(key,{instance:planned,index:current.length-1});changed=true;continue;}
    const existing=match.instance,plannedTarget=existing.status==="active"?Number(planned.target)||0:Number(existing.target)||0,frog=!!planned.metadata?.frog,currentFrog=!!existing.metadata?.frog,executionScope=planned.metadata?.executionScope||"daily",currentScope=existing.metadata?.executionScope||"daily",allowOverdelivery=!!planned.metadata?.allowOverdelivery,currentAllow=!!existing.metadata?.allowOverdelivery;
    const identityChanged=planned.kind!==existing.kind||planned.mode!==existing.mode||planned.unit!==existing.unit||planned.name!==existing.name||planned.recurringId!==existing.recurringId;
    const shouldReopen=allowOverdelivery&&!state.closedDays?.[existing.date]&&existing.status==="completed"&&Number(existing.progress)>=Number(existing.target);
    if(identityChanged||plannedTarget!==Number(existing.target||0)||frog!==currentFrog||executionScope!==currentScope||allowOverdelivery!==currentAllow||shouldReopen){
      const next={...existing,name:planned.name,kind:planned.kind,mode:planned.mode,unit:planned.unit,recurringId:planned.recurringId,target:plannedTarget,status:shouldReopen?"active":existing.status,metadata:{...existing.metadata,frog,executionScope,weeklyFrog:!!planned.metadata?.weeklyFrog,weeklyAction:!!planned.metadata?.weeklyAction,allowOverdelivery}};
      current[match.index]=next;byKey.set(key,{instance:next,index:match.index});changed=true;
    }
  }
  return changed?{...state,instances:current}:state;
}
