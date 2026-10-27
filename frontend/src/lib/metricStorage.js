const METRICS_KEY="cbe.metrics.v1",METRIC_LOGS_KEY="cbe.metric-logs.v1";
export const DEFAULT_METRICS=[{id:"metric-lifetime-cbe",name:"Lifetime CBE",kind:"value",mode:"system",systemKey:"lifetime-cbe",unit:"CBE",startFrom:0,icon:"Hexagon",color:"sky",active:true},{id:"metric-books-finished",name:"Books Finished",kind:"counter",mode:"manual",unit:"books",startFrom:0,icon:"BookOpenCheck",color:"emerald",active:true},{id:"metric-spanish-modules",name:"Spanish Modules",kind:"counter",mode:"manual",unit:"modules",startFrom:0,icon:"Languages",color:"amber",active:true}];
function read(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}}
export function loadMetrics(){const v=read(METRICS_KEY,null);return Array.isArray(v)?v:DEFAULT_METRICS}
export function saveMetrics(v){localStorage.setItem(METRICS_KEY,JSON.stringify(v))}
export function loadMetricLogs(){const v=read(METRIC_LOGS_KEY,[]);return Array.isArray(v)?v:[]}
export function saveMetricLogs(v){localStorage.setItem(METRIC_LOGS_KEY,JSON.stringify(v))}
export function metricBackupKeys(){return[METRICS_KEY,METRIC_LOGS_KEY]}
