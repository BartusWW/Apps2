const R=n=>Math.round((Number(n)||0)*10)/10;
const totalOf=i=>Math.max(1,Number(i?.stackCount)||1);
const rawDone=i=>Math.max(0,Number(i?.stackDone)||0);

export const AMBITION_UNLOCK_SCORE=75;

export function liveExecutionScore(date,plan,entries=[],actions=[],settings={}){
  const items=Array.isArray(plan?.items)?plan.items:[];
  const dayEntries=(entries||[]).filter(e=>e.date===date&&!e.ambitionBonus);
  const actionMap=Object.fromEntries((actions||[]).map(a=>[a.id,a]));
  const recurringMap=Object.fromEntries((settings?.recurringTasks||[]).map(r=>[r.id,r]));
  const quantityFor=i=>dayEntries.filter(e=>e.actionId===i.actionId).reduce((s,e)=>s+(Number(e.quantity)||0),0);
  const complete=i=>{
    const a=actionMap[i.actionId];
    if(i.status==="done")return true;
    if(a?.scoringType==="per-unit"&&Number(i.habitAmount)>0)return quantityFor(i)>=Number(i.habitAmount);
    return rawDone(i)>=totalOf(i);
  };
  const tasks=items.filter(i=>!i.habit),habits=items.filter(i=>i.habit);
  const taskTotal=tasks.reduce((s,i)=>s+totalOf(i),0);
  const taskDone=tasks.reduce((s,i)=>s+(complete(i)?totalOf(i):Math.min(totalOf(i),rawDone(i))),0);
  const frogs=tasks.filter(i=>i.frog),frogTotal=frogs.reduce((s,i)=>s+totalOf(i),0),frogDone=frogs.reduce((s,i)=>s+(complete(i)?totalOf(i):Math.min(totalOf(i),rawDone(i))),0);
  const habitDone=habits.filter(i=>complete(i)||dayEntries.some(e=>e.actionId===i.actionId&&e.habit));
  const execution=taskTotal?taskDone/taskTotal*100:100,frogScore=frogTotal?frogDone/frogTotal*100:100,habitScore=habits.length?habitDone.length/habits.length*100:100;
  return R(execution*.4+frogScore*.4+habitScore*.2);
}

export function gatedAmbitionReward(tier,bonus,score){
  const full=Math.max(0,Number(bonus)||0),unlocked=Number(score)>=AMBITION_UNLOCK_SCORE;
  if(unlocked)return{earned:full,locked:0,unlocked:true};
  if(tier==="very-ambitious")return{earned:0,locked:full,unlocked:false};
  const earned=R(full*.5);
  return{earned,locked:R(full-earned),unlocked:false};
}
