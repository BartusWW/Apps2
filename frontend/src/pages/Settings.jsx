import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, Pencil, Check, X, Target, Bell, BellOff, PieChart as PieChartIcon, Download } from "lucide-react";
import { onInstallAvailability, promptInstall } from "../lib/pwa";
import HabitsEditor from "../components/settings/HabitsEditor";
import DataManagement from "../components/settings/DataManagement";
import AppearanceEditor from "../components/settings/AppearanceEditor";
import CategoriesEditor from "../components/settings/CategoriesEditor";
import BrainDumpManager from "../components/settings/BrainDumpManager";
import GoalsEditor from "../components/settings/GoalsEditor";

const DEFAULT_CATEGORIES = [
  "PT Study",
  "BW Strength Systems",
  "Content",
  "Reading",
  "AI / Systems",
  "Distraction",
];

const blankAction = {
  name: "",
  category: "PT Study",
  minutes: 30,
  points: 10,
  type: "positive",
  icon: "Zap",
};

function ActionForm({ initial, onSave, onCancel, submitLabel = "Save", testIdPrefix = "form" }) {
  const [form, setForm] = useState({ ...blankAction, ...initial });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Action name is required", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim() || "Uncategorized",
      minutes: Number(form.minutes) || 0,
      points: Number(form.points) || 0,
    };
    // Auto-correct sign based on type
    if (payload.type === "positive" && payload.points < 0) payload.points = Math.abs(payload.points);
    if (payload.type === "negative" && payload.points > 0) payload.points = -Math.abs(payload.points);
    onSave(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-neutral-900 border border-white/10 rounded-xl p-4"
      data-testid={`${testIdPrefix}-action-form`}
    >
      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Action name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          data-testid={`${testIdPrefix}-input-name`}
          className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
          placeholder="e.g. +30 min Deep Work"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Category</label>
          <input
            type="text"
            list="cbe-category-suggestions"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            data-testid={`${testIdPrefix}-input-category`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            data-testid={`${testIdPrefix}-select-type`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Points</label>
          <input
            type="number"
            value={form.points}
            onChange={(e) => setForm({ ...form, points: e.target.value })}
            data-testid={`${testIdPrefix}-input-points`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Minutes</label>
          <input
            type="number"
            min="0"
            value={form.minutes}
            onChange={(e) => setForm({ ...form, minutes: e.target.value })}
            data-testid={`${testIdPrefix}-input-minutes`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            data-testid={`${testIdPrefix}-cancel-btn`}
            className="text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
          >
            <X size={14} className="inline mr-1" /> Cancel
          </button>
        )}
        <button
          type="submit"
          data-testid={`${testIdPrefix}-submit-btn`}
          className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
        >
          <Check size={14} className="inline mr-1" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function Settings() {
  const { actions, addAction, updateAction, deleteAction, settings, updateSettings } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [goalHours, setGoalHours] = useState(
    String(((settings.weeklyGoalMinutes || 1200) / 60).toFixed(1).replace(/\.0$/, "")),
  );

  const positiveActions = actions.filter((a) => a.type === "positive");
  const negativeActions = actions.filter((a) => a.type === "negative");

  const saveGoal = () => {
    const hrs = Number(goalHours);
    if (!hrs || hrs <= 0) {
      toast("Goal must be > 0 hours", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    updateSettings({ weeklyGoalMinutes: Math.round(hrs * 60) });
    toast(`Weekly goal set to ${hrs}h`, { className: "!bg-neutral-900 !border-sky-500/30 !text-white" });
  };

  const toggleReminder = async () => {
    if (settings.reminderEnabled) {
      updateSettings({ reminderEnabled: false });
      toast("Daily reminder disabled", { className: "!bg-neutral-900 !border-white/10 !text-white" });
      return;
    }
    if (typeof Notification === "undefined") {
      toast("Notifications not supported in this browser", {
        className: "!bg-neutral-900 !border-red-500/30 !text-white",
      });
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
    }
    if (perm !== "granted") {
      toast("Notification permission denied. Enable it in your browser settings.", {
        className: "!bg-neutral-900 !border-red-500/30 !text-white",
      });
      return;
    }
    updateSettings({ reminderEnabled: true, lastReminderDate: null });
    toast(`Daily reminder set for ${settings.reminderTime}`, {
      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
    });
  };

  const renderRow = (a) => {
    if (editingId === a.id) {
      return (
        <ActionForm
          key={a.id}
          initial={a}
          submitLabel="Update"
          testIdPrefix={`edit-${a.id}`}
          onCancel={() => setEditingId(null)}
          onSave={(patch) => {
            updateAction(a.id, patch);
            setEditingId(null);
            toast("Action updated", { className: "!bg-neutral-900 !border-white/10 !text-white" });
          }}
        />
      );
    }
    return (
      <li
        key={a.id}
        className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-3"
        data-testid={`action-row-${a.id}`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{a.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
            {a.category}
            {a.minutes ? ` · ${a.minutes}m` : ""}
          </p>
        </div>
        <span
          className={`font-display font-extrabold text-lg tracking-tighter ${
            a.points >= 0 ? "text-emerald-400" : "text-red-500"
          }`}
        >
          {a.points > 0 ? `+${a.points}` : a.points}
        </span>
        <button
          type="button"
          onClick={() => setEditingId(a.id)}
          data-testid={`edit-action-${a.id}`}
          className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
          aria-label="Edit action"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={() => {
            deleteAction(a.id);
            toast(`${a.name} removed`, { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
          }}
          data-testid={`delete-action-${a.id}`}
          className="p-2 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
          aria-label="Delete action"
        >
          <Trash2 size={15} />
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">Actions</h1>
          <p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">
            Manage your CBE catalog
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          data-testid="toggle-add-action-btn"
          className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-2 hover:bg-emerald-500/10"
        >
          <Plus size={14} />
          {showAdd ? "Close" : "Add"}
        </button>
      </header>

      <datalist id="cbe-category-suggestions">
        {DEFAULT_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {showAdd && (
        <ActionForm
          initial={blankAction}
          submitLabel="Add Action"
          testIdPrefix="add"
          onCancel={() => setShowAdd(false)}
          onSave={(payload) => {
            addAction(payload);
            setShowAdd(false);
            toast("Action added", { className: "!bg-neutral-900 !border-emerald-500/30 !text-white" });
          }}
        />
      )}

      <section>
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold mb-2">
          Positive · Build
        </h2>
        <ul className="space-y-1.5" data-testid="positive-actions-list">
          {positiveActions.map(renderRow)}
          {positiveActions.length === 0 && (
            <p className="text-sm text-neutral-500">No positive actions.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-red-500 font-semibold mb-2">
          Negative · Eliminate
        </h2>
        <ul className="space-y-1.5" data-testid="negative-actions-list">
          {negativeActions.map(renderRow)}
          {negativeActions.length === 0 && (
            <p className="text-sm text-neutral-500">No negative actions.</p>
          )}
        </ul>
      </section>

      {/* Preferences */}
      <section data-testid="preferences-section" className="space-y-3 pt-2">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold mb-1">
          Preferences
        </h2>

        <InstallAppCard />

        {/* Weekly goal */}
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3" data-testid="weekly-goal-setting">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-sky-400" />
            <p className="text-sm font-semibold text-white">Weekly Development Goal</p>
          </div>
          <p className="text-xs text-neutral-400">
            Target hours for the Time view progress bar.
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-500">
                Hours per week
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
                data-testid="weekly-goal-input"
                className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>
            <button
              type="button"
              onClick={saveGoal}
              data-testid="weekly-goal-save-btn"
              className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-sky-500 text-black hover:bg-sky-400"
            >
              Save
            </button>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500">
            Current: {(settings.weeklyGoalMinutes / 60).toFixed(1)}h / week
          </p>
        </div>

        {/* Daily reminder */}
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3" data-testid="reminder-setting">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.reminderEnabled ? (
                <Bell size={14} className="text-emerald-400" />
              ) : (
                <BellOff size={14} className="text-neutral-500" />
              )}
              <p className="text-sm font-semibold text-white">Daily Reminder</p>
            </div>
            <button
              type="button"
              onClick={toggleReminder}
              data-testid="reminder-toggle-btn"
              className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                settings.reminderEnabled
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "border-white/15 text-neutral-300 hover:bg-white/5"
              }`}
            >
              {settings.reminderEnabled ? "On" : "Off"}
            </button>
          </div>
          <p className="text-xs text-neutral-400">
            Browser notification nudge if you haven’t logged a dev session by your set time.
            <span className="block mt-1 text-neutral-500">
              Note: only fires while the CBE tab is open.
            </span>
          </p>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">
              Reminder time
            </label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) =>
                updateSettings({ reminderTime: e.target.value, lastReminderDate: null })
              }
              data-testid="reminder-time-input"
              className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Allocation Targets */}
        <AllocationTargetsEditor
          actions={actions}
          targets={settings.allocationTargets || {}}
          onChange={(next) => updateSettings({ allocationTargets: next })}
        />
      </section>

      {/* Habits */}
      <HabitsEditor />

      {/* Goals — strategic layer above categories */}
      <GoalsEditor />

      {/* Categories */}
      <CategoriesEditor />

      {/* Appearance */}
      <AppearanceEditor />

      {/* Brain Dump */}
      <BrainDumpManager />

      {/* Data Management */}
      <DataManagement />
    </div>
  );
}

function InstallAppCard() {
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(
    typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches,
  );

  useEffect(() => {
    const off = onInstallAvailability(setAvailable);
    return () => off();
  }, []);

  const handleInstall = async () => {
    const res = await promptInstall();
    if (res?.outcome === "accepted") {
      setInstalled(true);
      toast("App installed", { className: "!bg-neutral-900 !border-emerald-500/30 !text-white" });
    } else if (res?.outcome === "unavailable") {
      toast("Install prompt not available. On iOS: Share → Add to Home Screen.", {
        className: "!bg-neutral-900 !border-white/10 !text-white",
      });
    }
  };

  if (installed) {
    return (
      <div
        className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3"
        data-testid="install-card-installed"
      >
        <Check size={16} className="text-emerald-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Installed as PWA</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            Launches like a native app from your home screen. Works offline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3" data-testid="install-card">
      <div className="flex items-center gap-2">
        <Download size={14} className="text-emerald-400" />
        <p className="text-sm font-semibold text-white">Install on Device</p>
      </div>
      <p className="text-xs text-neutral-400">
        Add CBE Scoreboard to your home screen for a native-app feel and offline access.
        <span className="block mt-1 text-neutral-500">
          iOS Safari: tap Share → “Add to Home Screen”. Android Chrome: tap the button below or the browser menu.
        </span>
      </p>
      <button
        type="button"
        onClick={handleInstall}
        disabled={!available}
        data-testid="install-app-btn"
        className="w-full text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {available ? "Install App" : "Install Unavailable Here"}
      </button>
    </div>
  );
}

function AllocationTargetsEditor({ actions, targets, onChange }) {  const positiveCategories = Array.from(
    new Set(actions.filter((a) => a.type === "positive").map((a) => a.category)),
  );

  // Include any extra categories already present in targets (in case the user
  // removed an action but the target still exists)
  const allCats = Array.from(new Set([...positiveCategories, ...Object.keys(targets)]));

  const total = Object.values(targets).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalTone =
    total === 100
      ? "text-emerald-400"
      : total === 0
        ? "text-neutral-500"
        : Math.abs(total - 100) <= 5
          ? "text-amber-400"
          : "text-red-500";

  const setVal = (cat, raw) => {
    const num = raw === "" ? 0 : Math.max(0, Math.min(100, Number(raw)));
    const next = { ...targets, [cat]: num };
    // Remove zero entries to keep storage tidy
    if (num === 0) delete next[cat];
    onChange(next);
  };

  const autoBalance = () => {
    if (allCats.length === 0) return;
    const even = Math.floor(100 / allCats.length);
    const next = {};
    allCats.forEach((c, i) => {
      next[c] = i === allCats.length - 1 ? 100 - even * (allCats.length - 1) : even;
    });
    onChange(next);
  };

  const clearAll = () => onChange({});

  return (
    <div
      className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3"
      data-testid="allocation-targets-setting"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChartIcon size={14} className="text-sky-400" />
          <p className="text-sm font-semibold text-white">Allocation Targets</p>
        </div>
        <span className={`text-xs font-semibold ${totalTone}`} data-testid="allocation-total">
          {total}%
        </span>
      </div>
      <p className="text-xs text-neutral-400">
        Ideal % of dev time per category. Used by Monthly Review → Planned vs Actual.
      </p>

      {allCats.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No positive categories yet. Add a positive action above to see allocation rows here.
        </p>
      ) : (
        <ul className="space-y-2">
          {allCats.map((cat) => (
            <li key={cat} className="flex items-center gap-3" data-testid={`allocation-target-${cat}`}>
              <span className="text-sm text-white flex-1 truncate">{cat}</span>
              <input
                type="number"
                min="0"
                max="100"
                value={targets[cat] ?? ""}
                onChange={(e) => setVal(cat, e.target.value)}
                placeholder="0"
                data-testid={`allocation-input-${cat}`}
                className="w-16 bg-neutral-950 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-sky-500/50"
              />
              <span className="text-xs text-neutral-500 w-3">%</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={clearAll}
          data-testid="allocation-clear-btn"
          className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={autoBalance}
          data-testid="allocation-balance-btn"
          className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-lg bg-sky-500 text-black hover:bg-sky-400"
        >
          Auto-balance
        </button>
      </div>
    </div>
  );
}
