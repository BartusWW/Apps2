// v2.3 one-time clean start: remove test execution data while preserving the Action library,
// categories, priorities, theme and other user configuration.
const CLEAN_START_KEY = "cbe.v23.clean-start";

export function runV23CleanStart() {
  if (localStorage.getItem(CLEAN_START_KEY) === "done") return;
  localStorage.setItem("cbe.entries.v1", JSON.stringify([]));
  localStorage.setItem("cbe.daily-plans.v1", JSON.stringify({}));
  localStorage.setItem("cbe.goals.v1", JSON.stringify([]));
  localStorage.setItem("cbe.notes.v1", JSON.stringify({ weekly: {}, monthly: {} }));
  localStorage.setItem("cbe.brain-dump.v1", JSON.stringify([]));
  try {
    const raw = localStorage.getItem("cbe.settings.v1");
    if (raw) {
      const settings = JSON.parse(raw);
      settings.habits = [];
      settings.recurringTasks = [];
      localStorage.setItem("cbe.settings.v1", JSON.stringify(settings));
    }
  } catch {}
  localStorage.setItem(CLEAN_START_KEY, "done");
}
