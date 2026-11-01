import { legacyPlanToInstances } from "./legacyAdapter";

const occurrenceKey = x => [x.date,x.actionId,x.recurringId || "",x.secondChanceFor || "",x.metadata?.legacyItemId || ""].join("::");

// The sole legacy -> Core planning ingress. dailyPlans may create an occurrence
// and reconcile planning-owned fields (target/FROG/scope/overdelivery), but can
// never write execution progress or lifecycle state back into Core.
export function ingestLegacyOccurrences(state, { dailyPlans = {}, actions = [] } = {}) {
  const incoming = legacyPlanToInstances(dailyPlans, actions);
  const current = [...(Array.isArray(state?.instances) ? state.instances : [])];
  const byKey = new Map(current.map((x,index)=>[occurrenceKey(x),{instance:x,index}]));
  let changed = false;
  for (const planned of incoming) {
    const key=occurrenceKey(planned),match=byKey.get(key);
    if(!match){current.push(planned);byKey.set(key,{instance:planned,index:current.length-1});changed=true;continue;}
    const existing=match.instance,plannedTarget=existing.status==="active"?Number(planned.target)||0:Number(existing.target)||0,frog=!!planned.metadata?.frog,currentFrog=!!existing.metadata?.frog,executionScope=planned.metadata?.executionScope||"daily",currentScope=existing.metadata?.executionScope||"daily",allowOverdelivery=!!planned.metadata?.allowOverdelivery,currentAllow=!!existing.metadata?.allowOverdelivery;
    const shouldReopen=allowOverdelivery&&!state.closedDays?.[existing.date]&&existing.status==="completed"&&Number(existing.progress)>=Number(existing.target);
    if(plannedTarget!==Number(existing.target||0)||frog!==currentFrog||executionScope!==currentScope||allowOverdelivery!==currentAllow||shouldReopen){
      const next={...existing,target:plannedTarget,status:shouldReopen?"active":existing.status,metadata:{...existing.metadata,frog,executionScope,weeklyFrog:!!planned.metadata?.weeklyFrog,weeklyAction:!!planned.metadata?.weeklyAction,allowOverdelivery}};
      current[match.index]=next;byKey.set(key,{instance:next,index:match.index});changed=true;
    }
  }
  return changed?{...state,instances:current}:state;
}
