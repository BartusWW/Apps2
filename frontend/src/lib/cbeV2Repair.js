import { DEFAULT_ACTIONS, DEFAULT_CATEGORIES, DEFAULT_PRIORITY_PROFILES } from "./storage";

const SETTINGS_KEY="cbe.settings.v1"; const ACTIONS_KEY="cbe.actions.v1"; const REPAIR_KEY="cbe.v2.repair.2";
const clone=(v)=>JSON.parse(JSON.stringify(v));

export function repairCbeV2Data(){
  if(typeof window==="undefined"||localStorage.getItem(REPAIR_KEY)==="1") return;
  try{
    let settings={}; try{settings=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}catch{}
    let actions=[]; try{actions=JSON.parse(localStorage.getItem(ACTIONS_KEY)||"[]")}catch{}
    const cats=Array.isArray(settings.categories)?settings.categories:[];
    const legacyCategories=cats.length===0||cats.some(c=>!["BW Strength Systems","Performance","Self Development","Life / Systems","Discomfort / Exposure","Execution"].includes(c.name))||!cats.some(c=>Array.isArray(c.subcategories)&&c.subcategories.length>0);
    const legacyActions=!Array.isArray(actions)||actions.length===0||actions.filter(a=>a&&a.subcategory).length<Math.max(3,Math.floor(actions.length*.5));
    if(legacyCategories) settings.categories=clone(DEFAULT_CATEGORIES);
    if(legacyActions) localStorage.setItem(ACTIONS_KEY,JSON.stringify(DEFAULT_ACTIONS));
    // Refresh built-in profiles to their current valid factory definitions while preserving user-created profiles.
    const builtInIds=new Set(DEFAULT_PRIORITY_PROFILES.map(p=>p.id));
    const custom=(Array.isArray(settings.priorityProfiles)?settings.priorityProfiles:[]).filter(p=>!builtInIds.has(p.id));
    settings.priorityProfiles=[...clone(DEFAULT_PRIORITY_PROFILES),...custom];
    if(settings.activePriorityProfileId!=="base"&&!settings.priorityProfiles.some(p=>p.id===settings.activePriorityProfileId)) settings.activePriorityProfileId="base";
    localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings)); localStorage.setItem(REPAIR_KEY,"1");
  }catch(e){ console.warn("CBE v2 repair skipped",e); }
}
