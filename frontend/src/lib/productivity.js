export const PRODUCTIVITY_LEVELS=[
 {id:"low",label:"Low",min:0},
 {id:"average",label:"Average",min:60},
 {id:"high",label:"High",min:100},
 {id:"very-high",label:"Very High",min:150},
 {id:"ambitious",label:"Ambitious",min:220},
];
export const WEEKLY_PRODUCTIVITY_LEVELS=[
 {id:"low",label:"Low",min:0},
 {id:"average",label:"Average",min:300},
 {id:"high",label:"High",min:500},
 {id:"very-high",label:"Very High",min:750},
 {id:"ambitious",label:"Ambitious",min:1100},
];
export const r1=n=>Math.round((Number(n)||0)*10)/10;
export function levelFor(value,levels=PRODUCTIVITY_LEVELS){const n=Math.max(0,Number(value)||0);return [...levels].reverse().find(x=>n>=x.min)||levels[0]}
export function nextLevelFor(value,levels=PRODUCTIVITY_LEVELS){const n=Math.max(0,Number(value)||0);return levels.find(x=>x.min>n)||null}
export const productivityLevel=value=>levelFor(value,PRODUCTIVITY_LEVELS);
export const nextProductivityLevel=value=>nextLevelFor(value,PRODUCTIVITY_LEVELS);
export function ambitionTiers(action){return [
 {id:"ambitious",label:"Ambitious",target:Number(action?.ambition?.ambitiousTarget)||0,bonus:Number(action?.ambition?.ambitiousBonus)||0},
 {id:"very-ambitious",label:"Very Ambitious",target:Number(action?.ambition?.veryAmbitiousTarget)||0,bonus:Number(action?.ambition?.veryAmbitiousBonus)||0},
].filter(x=>x.target>0).sort((a,b)=>a.target-b.target)}
export function crossedAmbitionTiers(action,before,after){return ambitionTiers(action).filter(t=>Number(before)<t.target&&Number(after)>=t.target)}
export function productiveWeight(entry,context={}){if(Number(entry?.points)<=0)return 0;if(entry?.ambitionBonus)return 1.35;if(entry?.frog)return 1.25;if(context.goalActionIds?.has(entry?.actionId))return 1.15;if(context.missionActionIds?.has(entry?.actionId))return 1.15;if(entry?.planItemId||entry?.plannedFor)return 1;return .65}
export function productiveCBE(entries,context={}){return r1((entries||[]).reduce((s,e)=>s+Math.max(0,Number(e.points)||0)*productiveWeight(e,context),0))}
