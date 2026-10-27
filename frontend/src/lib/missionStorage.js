const KEY="cbe.missions.v1";
export function loadMissions(){try{const r=localStorage.getItem(KEY);return r?JSON.parse(r):[]}catch{return[]}}
export function saveMissions(v){localStorage.setItem(KEY,JSON.stringify(v))}
export const missionBackupKey=KEY;
export const missionId=()=>`mission-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
export function missionMetricDelta(mission,metric,entries,logs,metricValue){const start=mission.startDate||"0000-00-00",end=mission.endDate||"9999-99-99";if(metric.mode==="action"){return entries.filter(e=>e.actionId===metric.actionId&&e.date>=start&&e.date<=end).reduce((s,e)=>s+(Number(e.units??e.quantity)||0),0)}const before={...metric,startFrom:0};const inRange=logs.filter(x=>x.metricId===metric.id&&x.date>=start&&x.date<=end);if(metric.kind==="counter")return inRange.reduce((s,x)=>s+(Number(x.delta)||0),0);const allBefore=logs.filter(x=>x.metricId===metric.id&&x.date<start);const baseline=metricValue(before,entries.filter(e=>e.date<start),allBefore),current=metricValue(before,entries.filter(e=>e.date<=end),logs.filter(x=>x.metricId===metric.id&&x.date<=end));return Math.round((current-baseline)*100)/100}
