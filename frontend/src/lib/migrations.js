// Versioned data migrations for CBE Life Scoreboard
// Each migration takes the current localStorage state and upgrades it idempotently.
// IMPORTANT: migrations MUST preserve user data. Never wipe.

import { DEFAULT_SETTINGS } from "./storage";
import { DEFAULT_CATEGORY_COLORS } from "./categoryColors";

const SCHEMA_KEY = "cbe.schema.version";
const TARGET_VERSION = 10;

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
  { id: "nextDeadline", visible: true },
  { id: "pinnedGoals", visible: true },
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

// v4 → v5: seeds the goals bucket. Strategic layer above categories/habits.
// Idempotent: only creates the key when missing; never mutates existing goals.
function migrate_4_to_5() {
  if (localStorage.getItem("cbe.goals.v1") === null) {
    localStorage.setItem("cbe.goals.v1", JSON.stringify([]));
  }
  setVersion(5);
}

// Default display-metric flags for goals. Used by migration + form.
const DEFAULT_DISPLAY_METRICS = {
  targetAllocation: true,
  actualAllocation: true,
  alignment: true,
  goalHours: true,
  goalPoints: false,
  priorityWeight: true,
  daysRemaining: true,
  timeRemainingPct: true,
  deadlineStatus: true,
  createdDate: false,
  lastActivity: true,
  completionEstimate: false,
  progressTrend: false,
};

// v5 → v6: deadline + display-customization fields on every existing goal.
// Strictly additive — preserves existing data, defaults to no-deadline.
function migrate_5_to_6() {
  const raw = localStorage.getItem("cbe.goals.v1");
  let goals = [];
  if (raw) {
    try {
      goals = JSON.parse(raw);
      if (!Array.isArray(goals)) goals = [];
    } catch {
      goals = [];
    }
  }
  goals = goals.map((g) => ({
    ...g,
    deadline: g.deadline ?? null,
    deadlineType: g.deadlineType || "none",
    displayPreset: g.displayPreset || "balanced",
    displayMetrics: { ...DEFAULT_DISPLAY_METRICS, ...(g.displayMetrics || {}) },
    viewMode: g.viewMode || "detailed",
  }));
  localStorage.setItem("cbe.goals.v1", JSON.stringify(goals));

  // Ensure home layout knows about the Next Deadline widget.
  try {
    const sRaw = localStorage.getItem("cbe.settings.v1");
    if (sRaw) {
      const settings = JSON.parse(sRaw);
      if (Array.isArray(settings.homeLayout)) {
        const has = settings.homeLayout.some((l) => l.id === "nextDeadline");
        if (!has) {
          // Insert after dailyPlan so it sits beneath Today's Focus.
          const idx = settings.homeLayout.findIndex((l) => l.id === "dailyPlan");
          const item = { id: "nextDeadline", visible: true };
          if (idx >= 0) settings.homeLayout.splice(idx + 1, 0, item);
          else settings.homeLayout.push(item);
          localStorage.setItem("cbe.settings.v1", JSON.stringify(settings));
        }
      }
    }
  } catch {
    /* ignore home-layout patch errors; defaults will appear for new users */
  }

  setVersion(6);
}

export { DEFAULT_DISPLAY_METRICS };

// v6 → v7: per-goal Progress Type. Default each existing goal to:
//   - "hours" when the goal already links activities (so logged hours flow in)
//   - "manual" otherwise
// Strictly additive — preserves every existing goal field.
function migrate_6_to_7() {
  const raw = localStorage.getItem("cbe.goals.v1");
  let goals = [];
  if (raw) {
    try {
      goals = JSON.parse(raw);
      if (!Array.isArray(goals)) goals = [];
    } catch {
      goals = [];
    }
  }
  goals = goals.map((g) => {
    if (g.progressType) return g; // already migrated
    const linked = Array.isArray(g.linkedActivities) ? g.linkedActivities.length : 0;
    return {
      ...g,
      progressType: linked > 0 ? "hours" : "manual",
      progress: {
        manualPct: 0,
        valueCurrent: 0,
        valueTarget: 0,
        valueUnit: "items",
        checklist: [],
        hoursTarget: 0,
        ongoing: {
          weeklyTargetMinutes: 0,
          monthlyTargetMinutes: 0,
          milestones: [],
        },
      },
    };
  });
  localStorage.setItem("cbe.goals.v1", JSON.stringify(goals));
  setVersion(7);
}

// v7 → v8: adds the `pinned` flag (default false) on every existing goal +
// injects `pinnedGoals` into existing users' homeLayout (right under
// nextDeadline). Strictly additive — no wipe.
function migrate_7_to_8() {
  const raw = localStorage.getItem("cbe.goals.v1");
  if (raw) {
    try {
      const goals = JSON.parse(raw);
      if (Array.isArray(goals)) {
        const next = goals.map((g) => ({ ...g, pinned: g.pinned === true }));
        localStorage.setItem("cbe.goals.v1", JSON.stringify(next));
      }
    } catch {
      /* ignore malformed goals; defaults will apply for new goals */
    }
  }

  try {
    const sRaw = localStorage.getItem("cbe.settings.v1");
    if (sRaw) {
      const settings = JSON.parse(sRaw);
      if (Array.isArray(settings.homeLayout)) {
        const has = settings.homeLayout.some((l) => l.id === "pinnedGoals");
        if (!has) {
          const idx = settings.homeLayout.findIndex((l) => l.id === "nextDeadline");
          const item = { id: "pinnedGoals", visible: true };
          if (idx >= 0) settings.homeLayout.splice(idx + 1, 0, item);
          else settings.homeLayout.push(item);
          localStorage.setItem("cbe.settings.v1", JSON.stringify(settings));
        }
      }
    }
  } catch {
    /* ignore */
  }

  setVersion(8);
}

// v8 → v9: milestones gain a `type` field (default "hours" for legacy data) +
// per-type sub-fields. Strictly additive — preserves every legacy hour-target.
function migrate_8_to_9() {
  const raw = localStorage.getItem("cbe.goals.v1");
  if (!raw) {
    setVersion(9);
    return;
  }
  try {
    const goals = JSON.parse(raw);
    if (!Array.isArray(goals)) {
      setVersion(9);
      return;
    }
    const next = goals.map((g) => {
      const ms = g.progress?.ongoing?.milestones;
      if (!Array.isArray(ms)) return g;
      const upgraded = ms.map((m) => ({
        type: m.type || "hours",
        // type-agnostic fields
        id: m.id,
        label: m.label || "",
        reached: m.reached === true,
        // hours
        hoursTarget: Number(m.hoursTarget) || 0,
        // counter
        counterCurrent: Number(m.counterCurrent) || 0,
        counterTarget: Number(m.counterTarget) || 0,
        // value
        valueCurrent: Number(m.valueCurrent) || 0,
        valueTarget: Number(m.valueTarget) || 0,
        valueUnit: m.valueUnit || "",
        // manual
        manualPct: Math.max(0, Math.min(100, Number(m.manualPct) || 0)),
        // checklist
        checklist: Array.isArray(m.checklist) ? m.checklist : [],
      }));
      return {
        ...g,
        progress: {
          ...g.progress,
          ongoing: { ...(g.progress?.ongoing || {}), milestones: upgraded },
        },
      };
    });
    localStorage.setItem("cbe.goals.v1", JSON.stringify(next));
  } catch {
    /* ignore */
  }
  setVersion(9);
}

// v9 → v10: pinning becomes action-level. Convert legacy pinnedCategories
// (array of category name strings) → pinnedActionIds (array of action ids)
// by best-effort: for each pinned category name, pin every current action
// whose `category` matches. Legacy pinnedCategories is left in place for
// import/export compatibility but is no longer read by the UI.
function migrate_9_to_10() {
  const sRaw = localStorage.getItem("cbe.settings.v1");
  if (!sRaw) {
    setVersion(10);
    return;
  }
  try {
    const settings = JSON.parse(sRaw);
    if (Array.isArray(settings.pinnedActionIds)) {
      setVersion(10);
      return;
    }
    const aRaw = localStorage.getItem("cbe.actions.v1");
    const actions = aRaw ? JSON.parse(aRaw) : [];
    const oldPins = Array.isArray(settings.pinnedCategories)
      ? settings.pinnedCategories
      : [];
    const pinSet = new Set(oldPins);
    const pinnedActionIds = (Array.isArray(actions) ? actions : [])
      .filter((a) => pinSet.has(a.category))
      .map((a) => a.id);
    settings.pinnedActionIds = pinnedActionIds;
    localStorage.setItem("cbe.settings.v1", JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  setVersion(10);
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
  if (v < 5) {
    migrate_4_to_5();
    v = 5;
  }
  if (v < 6) {
    migrate_5_to_6();
    v = 6;
  }
  if (v < 7) {
    migrate_6_to_7();
    v = 7;
  }
  if (v < 8) {
    migrate_7_to_8();
    v = 8;
  }
  if (v < 9) {
    migrate_8_to_9();
    v = 9;
  }
  if (v < 10) {
    migrate_9_to_10();
    v = 10;
  }
  return { from: current, to: v };
}

export { TARGET_VERSION, SCHEMA_KEY };
