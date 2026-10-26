// localStorage helpers for CBE Life Scoreboard
import { DEFAULT_THEME } from "./themes";
const ENTRIES_KEY="cbe.entries.v1", ACTIONS_KEY="cbe.actions.v1", SETTINGS_KEY="cbe.settings.v1", NOTES_KEY="cbe.notes.v1", DAILY_PLANS_KEY="cbe.daily-plans.v1", BRAIN_DUMP_KEY="cbe.brain-dump.v1", GOALS_KEY="cbe.goals.v1";
export const DEFAULT_CATEGORIES=[
{name:"BW Strength Systems",type:"positive",icon:"Rocket",color:"red",description:"Business, content, products and coaching.",sortOrder:0,special:false,subcategories:["Content Creation","Publishing / Exposure","Product Development","Coaching / Programming","Education / Research","Business / Systems"].map(name=>({name,active:true}))},
{name:"Performance",type:"positive",icon:"Dumbbell",color:"emerald",description:"Strength, conditioning and physical capability.",sortOrder:1,special:false,subcategories:["Strength / SBD","Strongman","Conditioning / Running","Rucking","Mobility / Recovery","OCR / Skills"].map(name=>({name,active:true}))},
{name:"Self Development",type:"positive",icon:"Brain",color:"sky",description:"Deliberate learning and personal development.",sortOrder:2,special:false,subcategories:["Reading","Professional Education","Spanish","Reflection / Mental Skills"].map(name=>({name,active:true}))},
{name:"Life / Systems",type:"positive",icon:"ListChecks",color:"amber",description:"Planning, reviews, organisation and personal systems.",sortOrder:3,special:false,subcategories:["Planning / Reviews","Organisation / Admin","Home / Maintenance","Nutrition / Prep","Personal Projects"].map(name=>({name,active:true}))},
{name:"Discomfort / Exposure",type:"positive",icon:"Flame",color:"red",description:"Voluntary discomfort and deliberate exposure.",sortOrder:4,special:true,subcategories:["Avoided Tasks","Social / Public Exposure","Voluntary Hardship","New / Intimidating"].map(name=>({name,active:true}))},
{name:"Execution",type:"positive",icon:"Zap",color:"amber",description:"Execution quality: FROGs, commitments and anti-procrastination.",sortOrder:5,special:true,subcategories:["FROG / High Impact","Long-delayed Tasks","Commitments"].map(name=>({name,active:true}))},];
export const DEFAULT_PRIORITY_PROFILES=[
{id:"content-push",name:"Content Push",description:"Bias the system toward publishing, exposure and shipping content instead of endlessly preparing it.",categoryPriorities:{"BW Strength Systems":120,Performance:80,"Self Development":70,"Life / Systems":60,"Discomfort / Exposure":110,Execution:110},subcategoryPriorities:{"BW Strength Systems::Content Creation":160,"BW Strength Systems::Publishing / Exposure":200,"BW Strength Systems::Product Development":70,"BW Strength Systems::Coaching / Programming":70,"BW Strength Systems::Education / Research":50,"BW Strength Systems::Business / Systems":50,"Discomfort / Exposure::Social / Public Exposure":160,"Execution::FROG / High Impact":150}},
{id:"execution-mode",name:"Execution Mode",description:"Reward high-impact execution, FROGs and closing delayed commitments while reducing planning-as-procrastination.",categoryPriorities:{"BW Strength Systems":100,Performance:80,"Self Development":70,"Life / Systems":70,"Discomfort / Exposure":110,Execution:120},subcategoryPriorities:{"Execution::FROG / High Impact":200,"Execution::Long-delayed Tasks":200,"Execution::Commitments":160,"Life / Systems::Planning / Reviews":50,"BW Strength Systems::Education / Research":50,"BW Strength Systems::Business / Systems":50}},
{id:"build-ship",name:"Build & Ship",description:"Prioritise product development and getting finished work into the world.",categoryPriorities:{"BW Strength Systems":120,Performance:80,"Self Development":70,"Life / Systems":70,"Discomfort / Exposure":100,Execution:110},subcategoryPriorities:{"BW Strength Systems::Product Development":190,"BW Strength Systems::Publishing / Exposure":180,"BW Strength Systems::Content Creation":120,"BW Strength Systems::Coaching / Programming":90,"BW Strength Systems::Education / Research":60,"BW Strength Systems::Business / Systems":80}},
{id:"learning-qualification",name:"Learning / Qualification",description:"Shift attention toward professional education, active learning and qualification work without letting research consume everything.",categoryPriorities:{"BW Strength Systems":80,Performance:80,"Self Development":120,"Life / Systems":70,"Discomfort / Exposure":80,Execution:100},subcategoryPriorities:{"Self Development::Professional Education":200,"Self Development::Reading":110,"Self Development::Spanish":70,"Self Development::Reflection / Mental Skills":60,"BW Strength Systems::Content Creation":70,"BW Strength Systems::Publishing / Exposure":70,"BW Strength Systems::Product Development":70,"BW Strength Systems::Coaching / Programming":70,"BW Strength Systems::Education / Research":150,"BW Strength Systems::Business / Systems":50}},
{id:"performance-block",name:"Performance Block",description:"Put physical performance first: strength, strongman, conditioning, rucking and athletic capability.",categoryPriorities:{"BW Strength Systems":80,Performance:120,"Self Development":70,"Life / Systems":70,"Discomfort / Exposure":90,Execution:100},subcategoryPriorities:{"Performance::Strength / SBD":170,"Performance::Strongman":130,"Performance::Conditioning / Running":130,"Performance::Rucking":110,"Performance::Mobility / Recovery":90,"Performance::OCR / Skills":80}}];
export const DEFAULT_SETTINGS={weeklyGoalMinutes:1200,reminderEnabled:false,reminderTime:"20:00",lastReminderDate:null,allocationTargets:{},priorityProfiles:DEFAULT_PRIORITY_PROFILES,activePriorityProfileId:"base",theme:{...DEFAULT_THEME},habits:[],categories:DEFAULT_CATEGORIES,pinnedCategories:[],pinnedActionIds:["act-publish-reel","act-raw-video","act-sbd","act-meal-prep"],collapsedCategories:[],homeLayout:[{id:"carousel",visible:true},{id:"dailyPlan",visible:true},{id:"nextDeadline",visible:true},{id:"pinnedGoals",visible:true},{id:"pinned",visible:true},{id:"habits",visible:true}]};

const fixed=(id,name,category,subcategory,points,icon,outputMetric="")=>({id,name,category,subcategory,minutes:0,points,type:"positive",icon,scoringType:"fixed",outputMetric});
const unit=(id,name,category,subcategory,pointsPerUnit,unitName,icon,outputMetric="")=>({id,name,category,subcategory,minutes:0,points:pointsPerUnit,type:"positive",icon,scoringType:"per-unit",unit:unitName,pointsPerUnit,outputMetric});
const minute=(id,name,category,subcategory,pointsPerMinute,icon,outputMetric="")=>unit(id,name,category,subcategory,pointsPerMinute,"min",icon,outputMetric);

// v2.3: Actions describe the activity, not a baked-in duration. Time-based work is scored per minute;
// natural outputs keep their real unit (pages, km, meals, loads, etc.). Output Metric is independent of CBE scoring.
export const DEFAULT_ACTIONS=[
 fixed("act-raw-video","Record RAW Video","BW Strength Systems","Content Creation",10,"Video","Raw videos recorded"),
 minute("act-script","Write Reel Script / Outline","BW Strength Systems","Content Creation",0.5,"FileText","Minutes scripting"),
 minute("act-edit-reel","Edit Reel","BW Strength Systems","Content Creation",0.5,"Clapperboard","Minutes editing"),
 fixed("act-publish-reel","Publish Reel","BW Strength Systems","Publishing / Exposure",30,"Rocket","Reels published"),
 fixed("act-publish-carousel","Publish Carousel / Post","BW Strength Systems","Publishing / Exposure",25,"PanelsTopLeft","Posts published"),
 minute("act-product-work","Product Development","BW Strength Systems","Product Development",0.5,"Package","Minutes product development"),
 fixed("act-product-milestone","Finish Product Milestone","BW Strength Systems","Product Development",35,"Flag","Product milestones shipped"),
 minute("act-coaching-plan","Coaching / Programming Work","BW Strength Systems","Coaching / Programming",0.5,"ClipboardList","Minutes coaching work"),
 minute("act-bw-research","Applied BWSS Research","BW Strength Systems","Education / Research",0.35,"Search","Minutes applied research"),
 minute("act-business-system","Business / Systems Work","BW Strength Systems","Business / Systems",0.35,"Workflow","Minutes business systems work"),

 fixed("act-sbd","SBD Session","Performance","Strength / SBD",25,"Dumbbell","SBD sessions"),
 fixed("act-strongman","Strongman Session","Performance","Strongman",25,"BicepsFlexed","Strongman sessions"),
 unit("act-run","Run / Conditioning","Performance","Conditioning / Running",2,"km","Activity","Kilometres run"),
 fixed("act-intervals","Intervals / Hard Conditioning","Performance","Conditioning / Running",20,"Gauge","Conditioning sessions"),
 unit("act-ruck","Ruck","Performance","Rucking",2,"km","Backpack","Kilometres rucked"),
 minute("act-mobility","Mobility / Recovery","Performance","Mobility / Recovery",0.5,"HeartPulse","Minutes mobility"),
 fixed("act-ocr","OCR / Obstacle Skill Session","Performance","OCR / Skills",20,"Mountain","OCR sessions"),

 unit("act-read-10","Read","Self Development","Reading",0.5,"pages","BookOpen","Pages read"),
 minute("act-pro-study","Professional Study","Self Development","Professional Education",0.5,"GraduationCap","Minutes professional study"),
 minute("act-spanish","Spanish","Self Development","Spanish",0.35,"Languages","Minutes Spanish"),
 minute("act-reflection","Reflection / Mental Practice","Self Development","Reflection / Mental Skills",0.35,"Brain","Minutes reflection"),

 fixed("act-daily-review","Daily Review","Life / Systems","Planning / Reviews",5,"CalendarCheck","Daily reviews"),
 fixed("act-weekly-review","Weekly Review + Plan","Life / Systems","Planning / Reviews",15,"CalendarRange","Weekly reviews"),
 fixed("act-monthly-review","Monthly Review + Plan","Life / Systems","Planning / Reviews",25,"CalendarDays","Monthly reviews"),
 minute("act-admin","Admin / Organisation","Life / Systems","Organisation / Admin",0.35,"FolderCog","Minutes admin"),
 minute("act-personal-project","Personal Project","Life / Systems","Personal Projects",0.35,"Wrench","Minutes personal projects"),
 fixed("act-make-bed","Make Your Bed","Life / Systems","Home / Maintenance",3,"BedDouble","Beds made"),
 minute("act-cleaning","Cleaning","Life / Systems","Home / Maintenance",0.35,"Sparkles","Minutes cleaning"),
 unit("act-laundry","Laundry","Life / Systems","Home / Maintenance",8,"loads","Shirt","Laundry loads"),
 unit("act-meal-prep","Meal Prep","Life / Systems","Nutrition / Prep",4,"meals","CookingPot","Meals prepped"),
 fixed("act-groceries","Groceries / Food Shop","Life / Systems","Nutrition / Prep",10,"ShoppingCart","Food shops completed"),
 minute("act-life-admin","Personal Life Admin","Life / Systems","Organisation / Admin",0.35,"Files","Minutes life admin"),

 fixed("act-avoided-3d","Do Task Avoided 3+ Days","Discomfort / Exposure","Avoided Tasks",15,"Flame","Avoided tasks closed"),
 fixed("act-avoided-7d","Do Task Avoided 7+ Days","Discomfort / Exposure","Avoided Tasks",25,"FlameKindling","Avoided tasks closed"),
 fixed("act-avoided-30d","Do Task Avoided 30+ Days","Discomfort / Exposure","Avoided Tasks",40,"CircleAlert","Avoided tasks closed"),
 fixed("act-public-exposure","Deliberate Public / Social Exposure","Discomfort / Exposure","Social / Public Exposure",20,"Megaphone","Exposure reps"),
 fixed("act-hardship","Voluntary Hardship Challenge","Discomfort / Exposure","Voluntary Hardship",15,"Shield","Hardship challenges"),
 fixed("act-new-intimidating","Do Something Intimidating / New","Discomfort / Exposure","New / Intimidating",20,"Sparkles","New / intimidating reps"),

 fixed("act-frog","Complete Today’s FROG","Execution","FROG / High Impact",30,"Zap","FROGs completed"),
 fixed("act-top-before-noon","Top Task Completed Before Noon","Execution","FROG / High Impact",15,"Sun","Top tasks before noon"),
 fixed("act-long-delayed","Close a Long-delayed Commitment","Execution","Long-delayed Tasks",25,"CheckCheck","Delayed commitments closed"),
 fixed("act-3-priorities","Complete All 3 Daily Priorities","Execution","Commitments",20,"ListTodo","3-priority days")
];

const RETIRED_DEFAULT_ACTION_IDS=new Set(["act-read-25"]);
const DEFAULT_ACTION_IDS=new Set(DEFAULT_ACTIONS.map(a=>a.id));
function migrateActionLibrary(actions){
 const current=Array.isArray(actions)?actions:[], custom=current.filter(a=>!DEFAULT_ACTION_IDS.has(a.id)&&!RETIRED_DEFAULT_ACTION_IDS.has(a.id));
 // v2.3 deliberately refreshes built-in Actions to the new scoring/output model while preserving user-created Actions.
 return [...DEFAULT_ACTIONS,...custom];
}

export function loadEntries(){try{const raw=localStorage.getItem(ENTRIES_KEY);return raw?JSON.parse(raw):[]}catch{return[]}} export function saveEntries(v){localStorage.setItem(ENTRIES_KEY,JSON.stringify(v))}
export function loadActions(){try{const raw=localStorage.getItem(ACTIONS_KEY);if(!raw){localStorage.setItem(ACTIONS_KEY,JSON.stringify(DEFAULT_ACTIONS));return DEFAULT_ACTIONS}const migrated=migrateActionLibrary(JSON.parse(raw));localStorage.setItem(ACTIONS_KEY,JSON.stringify(migrated));return migrated}catch{return DEFAULT_ACTIONS}} export function saveActions(v){localStorage.setItem(ACTIONS_KEY,JSON.stringify(v))}
export function loadSettings(){try{const raw=localStorage.getItem(SETTINGS_KEY);if(!raw)return{...DEFAULT_SETTINGS};const parsed=JSON.parse(raw),cats=Array.isArray(parsed.categories)?parsed.categories:DEFAULT_CATEGORIES;const life=cats.find(c=>c.name==="Life / Systems");if(life){const names=new Set((life.subcategories||[]).map(s=>typeof s==="string"?s:s.name));for(const name of ["Home / Maintenance","Nutrition / Prep"])if(!names.has(name))life.subcategories=[...(life.subcategories||[]),{name,active:true}]}return{...DEFAULT_SETTINGS,...parsed,categories:cats}}catch{return{...DEFAULT_SETTINGS}}} export function saveSettings(v){localStorage.setItem(SETTINGS_KEY,JSON.stringify(v))}
export function loadNotes(){try{const r=localStorage.getItem(NOTES_KEY),p=r?JSON.parse(r):{};return{weekly:p.weekly||{},monthly:p.monthly||{}}}catch{return{weekly:{},monthly:{}}}} export function saveNotes(v){localStorage.setItem(NOTES_KEY,JSON.stringify(v))}
export function loadDailyPlans(){try{const r=localStorage.getItem(DAILY_PLANS_KEY);return r?JSON.parse(r):{}}catch{return{}}} export function saveDailyPlans(v){localStorage.setItem(DAILY_PLANS_KEY,JSON.stringify(v))}
export function loadBrainDumps(){try{const r=localStorage.getItem(BRAIN_DUMP_KEY);return r?JSON.parse(r):[]}catch{return[]}} export function saveBrainDumps(v){localStorage.setItem(BRAIN_DUMP_KEY,JSON.stringify(v))}
export function loadGoals(){try{const r=localStorage.getItem(GOALS_KEY);return r?JSON.parse(r):[]}catch{return[]}} export function saveGoals(v){localStorage.setItem(GOALS_KEY,JSON.stringify(v))}
const BACKUP_KEYS=[ENTRIES_KEY,ACTIONS_KEY,SETTINGS_KEY,NOTES_KEY,DAILY_PLANS_KEY,BRAIN_DUMP_KEY,GOALS_KEY,"cbe.schema.version"];
export function exportAllData(){const data={};for(const key of BACKUP_KEYS){const raw=localStorage.getItem(key);if(raw!==null){try{data[key]=JSON.parse(raw)}catch{data[key]=raw}}}return{app:"cbe-life-scoreboard",exportedAt:new Date().toISOString(),schemaVersion:Number(localStorage.getItem("cbe.schema.version")||1),data}}
export function validateBackup(p){if(!p||typeof p!=="object")return{ok:false,reason:"Not a JSON object"};if(p.app!=="cbe-life-scoreboard")return{ok:false,reason:"Not a CBE backup file"};if(!p.data||typeof p.data!=="object")return{ok:false,reason:"Missing data"};return{ok:true}}
export function importAllData(p){const v=validateBackup(p);if(!v.ok)throw new Error(v.reason);for(const k of BACKUP_KEYS)localStorage.removeItem(k);for(const[k,vv]of Object.entries(p.data)){if(BACKUP_KEYS.includes(k))localStorage.setItem(k,typeof vv==="string"?vv:JSON.stringify(vv))}}
export function resetAllData(){for(const k of BACKUP_KEYS)localStorage.removeItem(k)} export function generateId(){return`${Date.now()}-${Math.random().toString(36).slice(2,9)}`}
