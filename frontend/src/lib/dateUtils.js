// Date helpers — week starts Monday (ISO)
// CBE Clock: debug time is persisted separately from normal app state so every
// lifecycle system can read the same simulated "now" without mutating real time.
const CLOCK_KEY="cbe.debug.clock.v1";
const readClock=()=>{if(typeof window==="undefined")return null;try{const v=JSON.parse(localStorage.getItem(CLOCK_KEY)||"null");return v?.enabled&&v?.now?new Date(v.now):null}catch{return null}};
export function cbeNow(){const d=readClock();return d&&!Number.isNaN(d.getTime())?d:new Date()}
export function getDebugClock(){const d=readClock();return d?{enabled:true,now:d.toISOString()}: {enabled:false,now:null}}
export function setDebugClock(date){if(typeof window==="undefined")return;const d=new Date(date);if(Number.isNaN(d.getTime()))return;localStorage.setItem(CLOCK_KEY,JSON.stringify({enabled:true,now:d.toISOString()}));window.dispatchEvent(new Event("cbe-clock-change"))}
export function clearDebugClock(){if(typeof window==="undefined")return;localStorage.removeItem(CLOCK_KEY);window.dispatchEvent(new Event("cbe-clock-change"))}
export function advanceDebugClock({days=0,hours=0}={}){const d=cbeNow();d.setHours(d.getHours()+hours);d.setDate(d.getDate()+days);setDebugClock(d);return d}
export function localISO(date=cbeNow()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`}
export function todayISO(){return localISO(cbeNow())}
export function nowTimeHHMM(){return cbeNow().toTimeString().slice(0,5)}
export function startOfWeek(date=cbeNow()){const d=new Date(date);d.setHours(0,0,0,0);const day=d.getDay(),diff=day===0?-6:1-day;d.setDate(d.getDate()+diff);return d}
export function endOfWeek(date=cbeNow()){const s=startOfWeek(date),e=new Date(s);e.setDate(e.getDate()+7);return e}
export function startOfLastWeek(date=cbeNow()){const s=startOfWeek(date);s.setDate(s.getDate()-7);return s}
export function isSameDay(dateStr,ref=cbeNow()){return dateStr===localISO(ref)}
export function entryDateTime(entry){return new Date(`${entry.date}T${entry.time||"00:00"}:00`)}
export function isInRange(entry,start,end){const t=entryDateTime(entry).getTime();return t>=start.getTime()&&t<end.getTime()}
export function formatDateShort(dateStr){return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"})}
export function formatWeekRange(start){const end=new Date(start);end.setDate(end.getDate()+6);const opts={month:"short",day:"numeric"};return `${start.toLocaleDateString(undefined,opts)} – ${end.toLocaleDateString(undefined,opts)}`}
export function calcStudyStreak(entries){const studyDays=new Set(entries.filter(e=>e.category==="PT Study"&&e.type==="positive").map(e=>e.date));if(!studyDays.size)return 0;let streak=0,today=cbeNow();today.setHours(0,0,0,0);const cursor=new Date(today);if(!studyDays.has(localISO(cursor))){cursor.setDate(cursor.getDate()-1);if(!studyDays.has(localISO(cursor)))return 0}while(studyDays.has(localISO(cursor))){streak++;cursor.setDate(cursor.getDate()-1)}return streak}
export function startOfMonth(date=cbeNow()){const d=new Date(date);d.setDate(1);d.setHours(0,0,0,0);return d}
export function endOfMonth(date=cbeNow()){const d=startOfMonth(date);d.setMonth(d.getMonth()+1);return d}
export function startOfLastMonth(date=cbeNow()){const d=startOfMonth(date);d.setMonth(d.getMonth()-1);return d}
export function monthKey(date=cbeNow()){const d=new Date(date),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0");return `${y}-${m}`}
export function formatMonth(date=cbeNow()){return new Date(date).toLocaleDateString(undefined,{month:"long",year:"numeric"})}
export function weekKey(date=cbeNow()){const d=new Date(date);d.setHours(0,0,0,0);const dayNr=(d.getDay()+6)%7;d.setDate(d.getDate()-dayNr+3);const firstThursday=new Date(d.getFullYear(),0,4),diff=(d-firstThursday)/86400000,week=1+Math.round((diff-3+((firstThursday.getDay()+6)%7))/7);return `${d.getFullYear()}-W${String(week).padStart(2,"0")}`}
export function weeksInMonth(monthAnchor=cbeNow()){const mStart=startOfMonth(monthAnchor),mEnd=endOfMonth(monthAnchor),result=[];let cursor=startOfWeek(mStart);while(cursor<mEnd){const wEnd=new Date(cursor);wEnd.setDate(wEnd.getDate()+7);result.push({start:new Date(cursor),end:wEnd});cursor=wEnd}return result}
