// localStorage helpers for CBE Life Scoreboard
const ENTRIES_KEY = "cbe.entries.v1";
const ACTIONS_KEY = "cbe.actions.v1";
const SETTINGS_KEY = "cbe.settings.v1";
const NOTES_KEY = "cbe.notes.v1";
const DAILY_PLANS_KEY = "cbe.daily-plans.v1";
const BRAIN_DUMP_KEY = "cbe.brain-dump.v1";
const GOALS_KEY = "cbe.goals.v1";

export const DEFAULT_CATEGORIES = [
  { name: "BW Strength Systems", type: "positive", icon: "Rocket", color: "violet", description: "Business, content, products and coaching.", sortOrder: 0, special: false, subcategories: [
    { name: "Content Creation", active: true },
    { name: "Publishing / Exposure", active: true },
    { name: "Product Development", active: true },
    { name: "Coaching / Programming", active: true },
    { name: "Education / Research", active: true },
    { name: "Business / Systems", active: true },
  ]},
  { name: "Performance", type: "positive", icon: "Dumbbell", color: "emerald", description: "Strength, conditioning and physical capability.", sortOrder: 1, special: false, subcategories: [
    { name: "Strength / SBD", active: true },
    { name: "Strongman", active: true },
    { name: "Conditioning / Running", active: true },
    { name: "Rucking", active: true },
    { name: "Mobility / Recovery", active: true },
    { name: "OCR / Skills", active: true },
  ]},
  { name: "Self Development", type: "positive", icon: "Brain", color: "sky", description: "Deliberate learning and personal development.", sortOrder: 2, special: false, subcategories: [
    { name: "Reading", active: true },
    { name: "Professional Education", active: true },
    { name: "Spanish", active: true },
    { name: "Reflection / Mental Skills", active: true },
  ]},
  { name: "Life / Systems", type: "positive", icon: "ListChecks", color: "amber", description: "Planning, reviews, organisation and personal systems.", sortOrder: 3, special: false, subcategories: [
    { name: "Planning / Reviews", active: true },
    { name: "Organisation / Admin", active: true },
    { name: "Personal Projects", active: true },
  ]},
  { name: "Discomfort / Exposure", type: "positive", icon: "Flame", color: "red", description: "Voluntary discomfort and deliberate exposure.", sortOrder: 4, special: true, subcategories: [
    { name: "Avoided Tasks", active: true },
    { name: "Social / Public Exposure", active: true },
    { name: "Voluntary Hardship", active: true },
    { name: "New / Intimidating", active: true },
  ]},
  { name: "Execution", type: "positive", icon: "Zap", color: "orange", description: "Execution quality: FROGs, commitments and anti-procrastination.", sortOrder: 5, special: true, subcategories: [
    { name: "FROG / High Impact", active: true },
    { name: "Long-delayed Tasks", active: true },
    { name: "Commitments", active: true },
  ]},
];

export const DEFAULT_PRIORITY_PROFILES = [
  {
    id: "content-push",
    name: "Content Push",
    categoryPriorities: { "BW Strength Systems": 120, Performance: 80, "Self Development": 70, "Life / Systems": 60, "Discomfort / Exposure": 110, Execution: 110 },
    subcategoryPriorities: {
      "BW Strength Systems::Content Creation": 160,
      "BW Strength Systems::Publishing / Exposure": 200,
      "BW Strength Systems::Product Development": 70,
      "BW Strength Systems::Coaching / Programming": 70,
      "BW Strength Systems::Education / Research": 50,
      "BW Strength Systems::Business / Systems": 50,
      "Discomfort / Exposure::Social / Public Exposure": 160,
      "Execution::FROG / High Impact": 150,
    },
  },
  {
    id: "execution-mode",
    name: "Execution Mode",
    categoryPriorities: { "BW Strength Systems": 100, Performance: 80, "Self Development": 70, "Life / Systems": 70, "Discomfort / Exposure": 110, Execution: 120 },
    subcategoryPriorities: {
      "Execution::FROG / High Impact": 200,
      "Execution::Long-delayed Tasks": 200,
      "Execution::Commitments": 160,
      "Life / Systems::Planning / Reviews": 50,
      "BW Strength Systems::Education / Research": 50,
      "BW Strength Systems::Business / Systems": 50,
    },
  },
  {
    id: "build-ship",
    name: "Build & Ship",
    categoryPriorities: { "BW Strength Systems": 120, Performance: 80, "Self Development": 70, "Life / Systems": 70, "Discomfort / Exposure": 100, Execution: 110 },
    subcategoryPriorities: {
      "BW Strength Systems::Product Development": 190,
      "BW Strength Systems::Publishing / Exposure": 180,
      "BW Strength Systems::Content Creation": 120,
      "BW Strength Systems::Coaching / Programming": 90,
      "BW Strength Systems::Education / Research": 60,
      "BW Strength Systems::Business / Systems": 80,
    },
  },
  {
    id: "learning-qualification",
    name: "Learning / Qualification",
    categoryPriorities: { "BW Strength Systems": 80, Performance: 80, "Self Development": 120, "Life / Systems": 70, "Discomfort / Exposure": 80, Execution: 100 },
    subcategoryPriorities: {
      "Self Development::Professional Education": 200,
      "Self Development::Reading": 110,
      "Self Development::Spanish": 70,
      "Self Development::Reflection / Mental Skills": 60,
      "BW Strength Systems::Education / Research": 150,
    },
  },
  {
    id: "performance-block",
    name: "Performance Block",
    categoryPriorities: { "BW Strength Systems": 80, Performance: 120, "Self Development": 70, "Life / Systems": 70, "Discomfort / Exposure": 90, Execution: 100 },
    subcategoryPriorities: {
      "Performance::Strength / SBD": 170,
      "Performance::Strongman": 130,
      "Performance::Conditioning / Running": 130,
      "Performance::Rucking": 110,
      "Performance::Mobility / Recovery": 90,
      "Performance::OCR / Skills": 80,
    },
  },
];

export const DEFAULT_SETTINGS = {
  weeklyGoalMinutes: 20 * 60,
  reminderEnabled: false,
  reminderTime: "20:00",
  lastReminderDate: null,
  allocationTargets: {},
  priorityProfiles: DEFAULT_PRIORITY_PROFILES,
  activePriorityProfileId: "base",
  habits: [],
  categories: DEFAULT_CATEGORIES,
  pinnedCategories: [],
  pinnedActionIds: ["act-publish-reel", "act-raw-video", "act-frog", "act-sbd"],
  collapsedCategories: [],
  homeLayout: [
    { id: "carousel", visible: true },
    { id: "dailyPlan", visible: true },
    { id: "nextDeadline", visible: true },
    { id: "pinnedGoals", visible: true },
    { id: "pinned", visible: true },
    { id: "habits", visible: true },
  ],
};

export const DEFAULT_ACTIONS = [
  { id: "act-raw-video", name: "Record RAW video", category: "BW Strength Systems", subcategory: "Content Creation", minutes: 0, points: 10, type: "positive", icon: "Video" },
  { id: "act-script", name: "Write reel script / outline", category: "BW Strength Systems", subcategory: "Content Creation", minutes: 0, points: 10, type: "positive", icon: "FileText" },
  { id: "act-edit-reel", name: "Edit reel", category: "BW Strength Systems", subcategory: "Content Creation", minutes: 30, points: 15, type: "positive", icon: "Clapperboard" },
  { id: "act-publish-reel", name: "Publish reel", category: "BW Strength Systems", subcategory: "Publishing / Exposure", minutes: 0, points: 30, type: "positive", icon: "Rocket" },
  { id: "act-publish-carousel", name: "Publish carousel / post", category: "BW Strength Systems", subcategory: "Publishing / Exposure", minutes: 0, points: 25, type: "positive", icon: "PanelsTopLeft" },
  { id: "act-product-work", name: "30 min product development", category: "BW Strength Systems", subcategory: "Product Development", minutes: 30, points: 15, type: "positive", icon: "Package" },
  { id: "act-product-milestone", name: "Finish product milestone", category: "BW Strength Systems", subcategory: "Product Development", minutes: 0, points: 35, type: "positive", icon: "Flag" },
  { id: "act-coaching-plan", name: "Build / improve coaching plan", category: "BW Strength Systems", subcategory: "Coaching / Programming", minutes: 30, points: 15, type: "positive", icon: "ClipboardList" },
  { id: "act-bw-research", name: "30 min applied BWSS research", category: "BW Strength Systems", subcategory: "Education / Research", minutes: 30, points: 10, type: "positive", icon: "Search" },
  { id: "act-business-system", name: "30 min business / systems work", category: "BW Strength Systems", subcategory: "Business / Systems", minutes: 30, points: 10, type: "positive", icon: "Workflow" },

  { id: "act-sbd", name: "SBD session", category: "Performance", subcategory: "Strength / SBD", minutes: 0, points: 25, type: "positive", icon: "Dumbbell" },
  { id: "act-strongman", name: "Strongman session", category: "Performance", subcategory: "Strongman", minutes: 0, points: 25, type: "positive", icon: "BicepsFlexed" },
  { id: "act-run", name: "Run / conditioning session", category: "Performance", subcategory: "Conditioning / Running", minutes: 0, points: 20, type: "positive", icon: "Activity" },
  { id: "act-intervals", name: "Intervals / hard conditioning", category: "Performance", subcategory: "Conditioning / Running", minutes: 0, points: 20, type: "positive", icon: "Gauge" },
  { id: "act-ruck", name: "Ruck", category: "Performance", subcategory: "Rucking", minutes: 0, points: 20, type: "positive", icon: "Backpack" },
  { id: "act-mobility", name: "Mobility / recovery 20+ min", category: "Performance", subcategory: "Mobility / Recovery", minutes: 0, points: 10, type: "positive", icon: "HeartPulse" },
  { id: "act-ocr", name: "OCR / obstacle skill session", category: "Performance", subcategory: "OCR / Skills", minutes: 0, points: 20, type: "positive", icon: "Mountain" },

  { id: "act-read-10", name: "Read 10 pages", category: "Self Development", subcategory: "Reading", minutes: 0, points: 5, type: "positive", icon: "BookOpen" },
  { id: "act-read-25", name: "Read 25 pages", category: "Self Development", subcategory: "Reading", minutes: 0, points: 10, type: "positive", icon: "BookOpenCheck" },
  { id: "act-pro-study", name: "30 min professional study", category: "Self Development", subcategory: "Professional Education", minutes: 30, points: 15, type: "positive", icon: "GraduationCap" },
  { id: "act-spanish", name: "30 min Spanish", category: "Self Development", subcategory: "Spanish", minutes: 30, points: 10, type: "positive", icon: "Languages" },
  { id: "act-reflection", name: "Deliberate reflection / mental practice", category: "Self Development", subcategory: "Reflection / Mental Skills", minutes: 0, points: 10, type: "positive", icon: "Brain" },

  { id: "act-daily-review", name: "Daily review", category: "Life / Systems", subcategory: "Planning / Reviews", minutes: 0, points: 5, type: "positive", icon: "CalendarCheck" },
  { id: "act-weekly-review", name: "Weekly review + plan", category: "Life / Systems", subcategory: "Planning / Reviews", minutes: 0, points: 15, type: "positive", icon: "CalendarRange" },
  { id: "act-monthly-review", name: "Monthly review + plan", category: "Life / Systems", subcategory: "Planning / Reviews", minutes: 0, points: 25, type: "positive", icon: "CalendarDays" },
  { id: "act-admin", name: "30 min admin / organisation", category: "Life / Systems", subcategory: "Organisation / Admin", minutes: 30, points: 10, type: "positive", icon: "FolderCog" },
  { id: "act-personal-project", name: "30 min personal project", category: "Life / Systems", subcategory: "Personal Projects", minutes: 30, points: 10, type: "positive", icon: "Wrench" },

  { id: "act-avoided-3d", name: "Do task avoided 3+ days", category: "Discomfort / Exposure", subcategory: "Avoided Tasks", minutes: 0, points: 15, type: "positive", icon: "Flame" },
  { id: "act-avoided-7d", name: "Do task avoided 7+ days", category: "Discomfort / Exposure", subcategory: "Avoided Tasks", minutes: 0, points: 25, type: "positive", icon: "FlameKindling" },
  { id: "act-avoided-30d", name: "Do task avoided 30+ days", category: "Discomfort / Exposure", subcategory: "Avoided Tasks", minutes: 0, points: 40, type: "positive", icon: "CircleAlert" },
  { id: "act-public-exposure", name: "Deliberate public / social exposure", category: "Discomfort / Exposure", subcategory: "Social / Public Exposure", minutes: 0, points: 20, type: "positive", icon: "Megaphone" },
  { id: "act-hardship", name: "Voluntary hardship challenge", category: "Discomfort / Exposure", subcategory: "Voluntary Hardship", minutes: 0, points: 15, type: "positive", icon: "Shield" },
  { id: "act-new-intimidating", name: "Do something intimidating / new", category: "Discomfort / Exposure", subcategory: "New / Intimidating", minutes: 0, points: 20, type: "positive", icon: "Sparkles" },

  { id: "act-frog", name: "Complete today’s FROG", category: "Execution", subcategory: "FROG / High Impact", minutes: 0, points: 30, type: "positive", icon: "Zap" },
  { id: "act-top-before-noon", name: "Top task completed before noon", category: "Execution", subcategory: "FROG / High Impact", minutes: 0, points: 15, type: "positive", icon: "Sun" },
  { id: "act-long-delayed", name: "Close a long-delayed commitment", category: "Execution", subcategory: "Long-delayed Tasks", minutes: 0, points: 25, type: "positive", icon: "CheckCheck" },
  { id: "act-3-priorities", name: "Complete all 3 daily priorities", category: "Execution", subcategory: "Commitments", minutes: 0, points: 20, type: "positive", icon: "ListTodo" },
];

export function loadEntries() {
  try { const raw = localStorage.getItem(ENTRIES_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
export function saveEntries(entries) { localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)); }

export function loadActions() {
  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    if (!raw) { localStorage.setItem(ACTIONS_KEY, JSON.stringify(DEFAULT_ACTIONS)); return DEFAULT_ACTIONS; }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACTIONS;
  } catch { return DEFAULT_ACTIONS; }
}
export function saveActions(actions) { localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions)); }

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

export function loadNotes() { try { const raw = localStorage.getItem(NOTES_KEY); if (!raw) return { weekly: {}, monthly: {} }; const parsed = JSON.parse(raw); return { weekly: parsed.weekly && typeof parsed.weekly === "object" ? parsed.weekly : {}, monthly: parsed.monthly && typeof parsed.monthly === "object" ? parsed.monthly : {} }; } catch { return { weekly: {}, monthly: {} }; } }
export function saveNotes(notes) { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }
export function loadDailyPlans() { try { const raw = localStorage.getItem(DAILY_PLANS_KEY); if (!raw) return {}; const parsed = JSON.parse(raw); return parsed && typeof parsed === "object" ? parsed : {}; } catch { return {}; } }
export function saveDailyPlans(plans) { localStorage.setItem(DAILY_PLANS_KEY, JSON.stringify(plans)); }
export function loadBrainDumps() { try { const raw = localStorage.getItem(BRAIN_DUMP_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
export function saveBrainDumps(items) { localStorage.setItem(BRAIN_DUMP_KEY, JSON.stringify(items)); }
export function loadGoals() { try { const raw = localStorage.getItem(GOALS_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
export function saveGoals(goals) { localStorage.setItem(GOALS_KEY, JSON.stringify(goals)); }

const BACKUP_KEYS = [ENTRIES_KEY, ACTIONS_KEY, SETTINGS_KEY, NOTES_KEY, DAILY_PLANS_KEY, BRAIN_DUMP_KEY, GOALS_KEY, "cbe.schema.version"];
export function exportAllData() { const data = {}; for (const key of BACKUP_KEYS) { const raw = localStorage.getItem(key); if (raw !== null) { try { data[key] = JSON.parse(raw); } catch { data[key] = raw; } } } return { app: "cbe-life-scoreboard", exportedAt: new Date().toISOString(), schemaVersion: Number(localStorage.getItem("cbe.schema.version") || 1), data }; }
export function validateBackup(payload) { if (!payload || typeof payload !== "object") return { ok: false, reason: "Not a JSON object" }; if (payload.app !== "cbe-life-scoreboard") return { ok: false, reason: "Not a CBE backup file" }; if (!payload.data || typeof payload.data !== "object") return { ok: false, reason: "Missing data" }; return { ok: true }; }
export function importAllData(payload) { const v = validateBackup(payload); if (!v.ok) throw new Error(v.reason); for (const key of BACKUP_KEYS) localStorage.removeItem(key); for (const [key, value] of Object.entries(payload.data)) { if (!BACKUP_KEYS.includes(key)) continue; localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); } }
export function resetAllData() { for (const key of BACKUP_KEYS) localStorage.removeItem(key); }
export function generateId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
