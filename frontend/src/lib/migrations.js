// Versioned data migrations for CBE Life Scoreboard
// Each migration takes the current localStorage state and upgrades it idempotently.
// IMPORTANT: migrations MUST preserve user data. Never wipe.

import { DEFAULT_SETTINGS } from "./storage";
import { DEFAULT_CATEGORY_COLORS } from "./categoryColors";

const SCHEMA_KEY = "cbe.schema.version";
const TARGET_VERSION = 4;

// Default categories (v2 — drives Quick Add UX, v3 adds color)
export const DEFAULT_CATEGORIES = [
  { name: "PT Study", type: "positive", icon: "BookOpen", color: "sky", description: "Coaching study & curriculum" },
  { name: "BW Strength Systems", type: "positive", icon: "Dumbbell", color: "emerald", description: "Strength programming & systems work" },
  { name: "Content", type: "positive", icon: "Camera", color: "violet", description: "Creating posts, reels, videos" },
  { name: "Reading", type: "positive", icon: "Book", color: "amber", description: "Books, essays, papers" },
  { name: "AI / Systems", type: "positive", icon: "Cpu", color: "indigo", description: "Automation & dev work" },
  { name: "Scrolling", type: "negative", icon: "Smartphone", color: "red", description: "Mindless feed scrolling" },
  { name: "Gaming", type: "negative", icon: "Gamepad2", color: "red", description: "Out-of-plan gaming or video bingeing" },
  { name: "Wasted Time", type: "negative", icon: "Clock", color: "red", description: "Unproductive idle time" },
];

// Default home layout (v3+): visible + ordered sections on Dashboard
export const DEFAULT_HOME_LAYOUT = [
  { id: "carousel", visible: true },
  { id: "dailyPlan", visible: true },
  { id: "search", visible: true },
  { id: "pinned", visible: true },
  { id: "recent", visible: true },
  { id: "habits", visible: true },
  { id: "build", visible: true },
  { id: "eliminate", visible: true },
];

// Default habits (v2)
export const DEFAULT_HABITS = [
  {
    id: "habit-reading-daily",
    name: "Reading",
    period: "daily",
    goalMinutes: 30,
    categories: ["Reading"],
    type: "positive",
  },
  {
    id: "habit-reading-weekly",
    name: "Reading Weekly",
    period: "weekly",
    goalMinutes: 5 * 60,
    categories: ["Reading"],
    type: "positive",
  },
  {
    id: "habit-productive-daily",
    name: "Productive Work",
    period: "daily",
    goalMinutes: 120,
    categories: ["BW Strength Systems", "PT Study", "Content", "AI / Systems"],
    type: "positive",
  },
];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getVersion() {
  const v = localStorage.getItem(SCHEMA_KEY);
  return v ? Number(v) : 1;
}

function setVersion(v) {
  localStorage.setItem(SCHEMA_KEY, String(v));
}

// v1 → v2: adds habits, categories, dailyPlans, schema version field.
// Preserves entries, actions, notes, existing settings.
function migrate_1_to_2() {
  const settings = readJSON("cbe.settings.v1", null) || { ...DEFAULT_SETTINGS };
  if (!Array.isArray(settings.habits) || settings.habits.length === 0) {
    settings.habits = [...DEFAULT_HABITS];
  }
  if (!Array.isArray(settings.categories) || settings.categories.length === 0) {
    settings.categories = [...DEFAULT_CATEGORIES];
  }
  if (typeof settings.allocationTargets !== "object" || settings.allocationTargets === null) {
    settings.allocationTargets = {};
  }
  writeJSON("cbe.settings.v1", settings);

  if (!localStorage.getItem("cbe.daily-plans.v1")) {
    writeJSON("cbe.daily-plans.v1", {});
  }

  setVersion(2);
}

// v2 → v3: adds colors + description to categories, seeds homeLayout,
// pinnedCategories, brain dump bucket.
function migrate_2_to_3() {
  const settings = readJSON("cbe.settings.v1", null) || { ...DEFAULT_SETTINGS };
  if (Array.isArray(settings.categories)) {
    settings.categories = settings.categories.map((c) => ({
      ...c,
      color:
        c.color ||
        DEFAULT_CATEGORY_COLORS[c.name] ||
        (c.type === "negative" ? "red" : "emerald"),
      description: c.description || "",
    }));
  } else {
    settings.categories = [...DEFAULT_CATEGORIES];
  }
  if (!Array.isArray(settings.pinnedCategories)) settings.pinnedCategories = [];
  if (!Array.isArray(settings.homeLayout) || settings.homeLayout.length === 0) {
    settings.homeLayout = [...DEFAULT_HOME_LAYOUT];
  } else {
    const existing = new Set(settings.homeLayout.map((l) => l.id));
    for (const def of DEFAULT_HOME_LAYOUT) {
      if (!existing.has(def.id)) settings.homeLayout.push({ ...def });
    }
  }
  writeJSON("cbe.settings.v1", settings);

  if (!localStorage.getItem("cbe.brain-dump.v1")) {
    writeJSON("cbe.brain-dump.v1", []);
  }

  setVersion(3);
}

// v3 → v4: adds collapsedCategories list and sortOrder field on every category.
// Forward-compatible: ensures any new home-layout sections defined post-v3 are
// appended at the end of the user's saved layout.
function migrate_3_to_4() {
  const settings = readJSON("cbe.settings.v1", null) || { ...DEFAULT_SETTINGS };

  // Ensure sortOrder exists on every category. Preserve the existing order.
  if (Array.isArray(settings.categories)) {
    settings.categories = settings.categories.map((c, i) => ({
      ...c,
      sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : i,
    }));
  }

  // Append any new known home-layout sections at the end of saved layout.
  if (!Array.isArray(settings.homeLayout) || settings.homeLayout.length === 0) {
    settings.homeLayout = [...DEFAULT_HOME_LAYOUT];
  } else {
    const existing = new Set(settings.homeLayout.map((l) => l.id));
    for (const def of DEFAULT_HOME_LAYOUT) {
      if (!existing.has(def.id)) settings.homeLayout.push({ ...def });
    }
  }

  if (!Array.isArray(settings.collapsedCategories)) {
    // Default to empty — categories open by default. Each user toggles per taste.
    settings.collapsedCategories = [];
  }

  writeJSON("cbe.settings.v1", settings);
  setVersion(4);
}

export function runMigrations() {
  const current = getVersion();
  if (current >= TARGET_VERSION) return { from: current, to: current };
  let v = current;
  if (v < 2) {
    migrate_1_to_2();
    v = 2;
  }
  if (v < 3) {
    migrate_2_to_3();
    v = 3;
  }
  if (v < 4) {
    migrate_3_to_4();
    v = 4;
  }
  return { from: current, to: v };
}

export { TARGET_VERSION, SCHEMA_KEY };
