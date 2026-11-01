// Canonical execution-occurrence identity for CBE 3.1.
// Every Core writer/reconciler must use this module; identity must never be
// reimplemented locally in scheduler, legacy ingress, or storage migration.
const mondayFor=date=>{const d=new Date(`${date}T12:00:00`),day=d.getDay();d.setDate(d.getDate()+(day===0?-6:1-day));return d.toISOString().slice(0,10)};

export function occurrenceKey(x){
  if(!x)return "invalid";
  if(x.secondChanceFor||x.source==="second-chance"||x.kind==="habit-recovery")return ["recovery",x.date,x.actionId,x.secondChanceFor||x.metadata?.originalInstanceId||x.metadata?.originalDate||"unknown"].join("::");
  if(x.metadata?.executionScope==="weekly")return ["weekly",x.metadata?.weeklyFocusWeek||mondayFor(x.date),x.actionId,x.recurringId||(x.metadata?.weeklyFrog?"frog":"action")].join("::");
  // One Habit action has one base occurrence per day. Habit rule edits/rekeys
  // reconcile that occurrence instead of creating another copy.
  if(x.kind==="habit")return ["habit",x.date,x.actionId].join("::");
  if(x.recurringId)return ["recurring",x.date,x.actionId,x.recurringId].join("::");
  return ["planned",x.date,x.actionId,x.metadata?.legacyItemId||x.id||""].join("::");
}

export const sameOccurrence=(a,b)=>!!a&&!!b&&occurrenceKey(a)===occurrenceKey(b);
