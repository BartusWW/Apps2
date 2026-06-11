import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, Pencil, Check, X, Target, Bell, BellOff } from "lucide-react";

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
      </section>
    </div>
  );
}
