// Versioned data migrations for CBE Life Scoreboard
// Each migration takes the current localStorage state and upgrades it idempotently.
// IMPORTANT: migrations MUST preserve user data. Never wipe.

import { DEFAULT_SETTINGS } from "./storage";

const SCHEMA_KEY = "cbe.schema.version";
const TARGET_VERSION = 2;

// Default categories (v2 — drives Quick Add UX)
export const DEFAULT_CATEGORIES = [
  { name: "PT Study", type: "positive", icon: "BookOpen" },
  { name: "BW Strength Systems", type: "positive", icon: "Dumbbell" },
  { name: "Content", type: "positive", icon: "Camera" },
  { name: "Reading", type: "positive", icon: "Book" },
  { name: "AI / Systems", type: "positive", icon: "Cpu" },
  { name: "Scrolling", type: "negative", icon: "Smartphone" },
  { name: "Gaming", type: "negative", icon: "Gamepad2" },
  { name: "Wasted Time", type: "negative", icon: "Clock" },
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
  // Settings: ensure new fields exist
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

  // Daily plans bucket
  if (!localStorage.getItem("cbe.daily-plans.v1")) {
    writeJSON("cbe.daily-plans.v1", {});
  }

  setVersion(2);
}

export function runMigrations() {
  const current = getVersion();
  if (current >= TARGET_VERSION) return { from: current, to: current };
  let v = current;
  if (v < 2) {
    migrate_1_to_2();
    v = 2;
  }
  return { from: current, to: v };
}

export { TARGET_VERSION, SCHEMA_KEY };
