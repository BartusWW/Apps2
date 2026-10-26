import { useEffect } from "react";
import { useApp } from "../context/AppContext";

// v2.4 retires the old demo bootstrap. Earlier builds seeded example weekly
// focus actions (Publish Reel, Record RAW Video, SBD Session), recurring rules
// and demo goals so fresh builds were immediately populated for testing.
//
// Keep this component temporarily as a one-time compatibility cleanup for
// existing installs: remove only data carrying the old demo IDs/signature.
// It never creates new tasks, habits, goals or recurring rules.
const CLEANUP_MARKER = "cbe.demo.seed.retired-v24";
const DEMO_RECURRING_PREFIX = "demo-";
const DEMO_GOAL_IDS = new Set(["demo-goal-reels", "demo-goal-ruck"]);
const DEMO_WEEKLY_ACTIONS = ["act-publish-reel", "act-raw-video", "act-sbd"];
const DEMO_FROGS = ["act-product-milestone", "act-publish-reel"];

function sameSet(values, expected) {
  const a = [...(values || [])].sort();
  const b = [...expected].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export default function DemoBootstrap() {
  const { settings, goals, updateSettings, deleteGoal } = useApp();

  useEffect(() => {
    if (localStorage.getItem(CLEANUP_MARKER)) return;

    const patch = {};
    const recurring = settings.recurringTasks || [];
    const withoutDemoRecurring = recurring.filter(
      (rule) => !String(rule?.id || "").startsWith(DEMO_RECURRING_PREFIX)
    );
    if (withoutDemoRecurring.length !== recurring.length) {
      patch.recurringTasks = withoutDemoRecurring;
    }

    const focus = settings.weeklyFocus;
    const isLegacyDemoFocus =
      focus &&
      sameSet(focus.actionIds, DEMO_WEEKLY_ACTIONS) &&
      sameSet(focus.frogIds, DEMO_FROGS);
    if (isLegacyDemoFocus) {
      patch.weeklyFocus = {};
    }

    if (Object.keys(patch).length) updateSettings(patch);

    for (const goal of goals || []) {
      if (DEMO_GOAL_IDS.has(goal.id)) deleteGoal(goal.id);
    }

    localStorage.removeItem("cbe.demo.seed.execution-v22");
    localStorage.setItem(CLEANUP_MARKER, "1");
  }, [settings.recurringTasks, settings.weeklyFocus, goals, updateSettings, deleteGoal]);

  return null;
}
