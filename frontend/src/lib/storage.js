// localStorage helpers for CBE Life Scoreboard
const ENTRIES_KEY = "cbe.entries.v1";
const ACTIONS_KEY = "cbe.actions.v1";
const SETTINGS_KEY = "cbe.settings.v1";
const NOTES_KEY = "cbe.notes.v1";
const DAILY_PLANS_KEY = "cbe.daily-plans.v1";
const BRAIN_DUMP_KEY = "cbe.brain-dump.v1";

export const DEFAULT_SETTINGS = {
  weeklyGoalMinutes: 20 * 60, // 20 hours
  reminderEnabled: false,
  reminderTime: "20:00", // 8pm
  lastReminderDate: null, // YYYY-MM-DD
  allocationTargets: {}, // { "BW Strength Systems": 30, ... } percentages
  habits: [], // populated by migrations
  categories: [], // populated by migrations
  pinnedCategories: [], // category names pinned to top
  collapsedCategories: [], // category names whose dropdown is collapsed
  homeLayout: [], // [{ id, visible }] in display order
};

export const DEFAULT_ACTIONS = [
  {
    id: "act-pt-study",
    name: "+30 min PT Study",
    category: "PT Study",
    minutes: 30,
    points: 10,
    type: "positive",
    icon: "BookOpen",
  },
  {
    id: "act-bw-strength",
    name: "+30 min BW Strength Systems",
    category: "BW Strength Systems",
    minutes: 30,
    points: 10,
    type: "positive",
    icon: "Dumbbell",
  },
  {
    id: "act-content",
    name: "+30 min Content Creation",
    category: "Content",
    minutes: 30,
    points: 10,
    type: "positive",
    icon: "Camera",
  },
  {
    id: "act-reading",
    name: "+30 min Reading",
    category: "Reading",
    minutes: 30,
    points: 5,
    type: "positive",
    icon: "Book",
  },
  {
    id: "act-ai-systems",
    name: "+30 min AI / Systems Work",
    category: "AI / Systems",
    minutes: 30,
    points: 10,
    type: "positive",
    icon: "Cpu",
  },
  {
    id: "act-published",
    name: "Published Post/Reel",
    category: "Content",
    minutes: 0,
    points: 25,
    type: "positive",
    icon: "Rocket",
  },
  {
    id: "act-scrolling",
    name: "Mindless Scrolling",
    category: "Distraction",
    minutes: 0,
    points: -20,
    type: "negative",
    icon: "Smartphone",
  },
  {
    id: "act-gaming",
    name: "Gaming/YouTube outside plan",
    category: "Distraction",
    minutes: 0,
    points: -30,
    type: "negative",
    icon: "Gamepad2",
  },
  {
    id: "act-missed-study",
    name: "Missed planned study session",
    category: "Distraction",
    minutes: 0,
    points: -20,
    type: "negative",
    icon: "XCircle",
  },
  {
    id: "act-late-phone",
    name: "Late night phone use",
    category: "Distraction",
    minutes: 0,
    points: -15,
    type: "negative",
    icon: "MoonOff",
  },
];

export function loadEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function loadActions() {
  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(ACTIONS_KEY, JSON.stringify(DEFAULT_ACTIONS));
      return DEFAULT_ACTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACTIONS;
  } catch {
    return DEFAULT_ACTIONS;
  }
}

export function saveActions(actions) {
  localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return { weekly: {}, monthly: {} };
    const parsed = JSON.parse(raw);
    return {
      weekly: parsed.weekly && typeof parsed.weekly === "object" ? parsed.weekly : {},
      monthly: parsed.monthly && typeof parsed.monthly === "object" ? parsed.monthly : {},
    };
  } catch {
    return { weekly: {}, monthly: {} };
  }
}

export function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadDailyPlans() {
  try {
    const raw = localStorage.getItem(DAILY_PLANS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveDailyPlans(plans) {
  localStorage.setItem(DAILY_PLANS_KEY, JSON.stringify(plans));
}

export function loadBrainDumps() {
  try {
    const raw = localStorage.getItem(BRAIN_DUMP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBrainDumps(items) {
  localStorage.setItem(BRAIN_DUMP_KEY, JSON.stringify(items));
}

// ---------- Backup / Restore / Reset ----------
const BACKUP_KEYS = [
  ENTRIES_KEY,
  ACTIONS_KEY,
  SETTINGS_KEY,
  NOTES_KEY,
  DAILY_PLANS_KEY,
  BRAIN_DUMP_KEY,
  "cbe.schema.version",
];

export function exportAllData() {
  const data = {};
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  return {
    app: "cbe-life-scoreboard",
    exportedAt: new Date().toISOString(),
    schemaVersion: Number(localStorage.getItem("cbe.schema.version") || 1),
    data,
  };
}

export function validateBackup(payload) {
  if (!payload || typeof payload !== "object") return { ok: false, reason: "Not a JSON object" };
  if (payload.app !== "cbe-life-scoreboard") return { ok: false, reason: "Not a CBE backup file" };
  if (!payload.data || typeof payload.data !== "object") return { ok: false, reason: "Missing data" };
  return { ok: true };
}

export function importAllData(payload) {
  const v = validateBackup(payload);
  if (!v.ok) throw new Error(v.reason);
  // Wipe existing app keys, then write new ones
  for (const key of BACKUP_KEYS) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(payload.data)) {
    if (!BACKUP_KEYS.includes(key)) continue; // safety: ignore foreign keys
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  }
}

export function resetAllData() {
  for (const key of BACKUP_KEYS) localStorage.removeItem(key);
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
