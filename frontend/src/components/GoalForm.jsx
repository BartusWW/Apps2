import { useState } from "react";
import * as Icons from "lucide-react";
import { X, Check, Calendar } from "lucide-react";
import { toast } from "sonner";
import { COLOR_OPTIONS, paletteFor } from "../lib/categoryColors";
import IconPicker from "./IconPicker";
import { useApp } from "../context/AppContext";
import { DISPLAY_PRESETS, metricsForPreset, DEFAULT_DISPLAY_METRICS } from "../lib/goals";

const blank = {
  name: "",
  icon: "Target",
  color: "emerald",
  description: "",
  targetAllocation: 25,
  priorityWeight: 5,
  linkedActivities: [],
  linkedHabits: [],
  notes: "",
  deadline: "",
  deadlineType: "none",
  displayPreset: "balanced",
  displayMetrics: null,
  viewMode: "detailed",
};

function MultiToggleList({ items, value, onToggle, testIdPrefix }) {
  if (items.length === 0) {
    return <p className="text-xs text-neutral-500">No options available.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const id = item.id || item.name;
        const label = item.label || item.name;
        const active = value.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            data-testid={`${testIdPrefix}-${id}`}
            className={`text-[11px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              active
                ? "bg-emerald-500 text-black border-emerald-500"
                : "border-white/15 text-neutral-300 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function GoalForm({ open, initial, onSave, onClose }) {
  const { settings, habits } = useApp();
  const seeded = { ...blank, ...(initial || {}) };
  if (seeded.deadline && seeded.deadline.length > 10) {
    seeded.deadline = seeded.deadline.slice(0, 10);
  }
  if (!seeded.displayMetrics) {
    seeded.displayMetrics = metricsForPreset(seeded.displayPreset);
  }
  const [form, setForm] = useState(seeded);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCustomMetrics, setShowCustomMetrics] = useState(
    seeded.displayPreset === "custom",
  );

  if (!open) return null;
  const Icon = Icons[form.icon] || Icons.Target;
  const p = paletteFor(form.color);

  const setPreset = (presetId) => {
    if (presetId === "custom") {
      setForm((f) => ({ ...f, displayPreset: "custom" }));
      setShowCustomMetrics(true);
    } else {
      setForm((f) => ({
        ...f,
        displayPreset: presetId,
        displayMetrics: metricsForPreset(presetId),
      }));
      setShowCustomMetrics(false);
    }
  };

  const toggleMetric = (key) => {
    setForm((f) => ({
      ...f,
      displayPreset: "custom",
      displayMetrics: { ...f.displayMetrics, [key]: !f.displayMetrics[key] },
    }));
  };

  const toggleActivity = (name) => {
    setForm((f) => {
      const has = f.linkedActivities.includes(name);
      return {
        ...f,
        linkedActivities: has
          ? f.linkedActivities.filter((n) => n !== name)
          : [...f.linkedActivities, name],
      };
    });
  };
  const toggleHabit = (id) => {
    setForm((f) => {
      const has = f.linkedHabits.includes(id);
      return {
        ...f,
        linkedHabits: has
          ? f.linkedHabits.filter((n) => n !== id)
          : [...f.linkedHabits, id],
      };
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Goal name is required", {
        className: "!bg-neutral-900 !border-red-500/30 !text-white",
      });
      return;
    }
    const deadline = form.deadline
      ? new Date(`${form.deadline}T12:00:00`).toISOString()
      : null;
    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      notes: (form.notes || "").trim(),
      targetAllocation: Number(form.targetAllocation) || 0,
      priorityWeight: Number(form.priorityWeight) || 5,
      deadline,
      deadlineType: deadline ? form.deadlineType || "soft" : "none",
      displayPreset: form.displayPreset || "balanced",
      displayMetrics: form.displayMetrics || metricsForPreset(form.displayPreset || "balanced"),
      viewMode: form.viewMode || "detailed",
    });
  };

  const positiveCats = (settings.categories || []).filter((c) => c.type === "positive");
  const habitItems = (habits || []).map((h) => ({ id: h.id, label: h.name }));

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      data-testid="goal-form-modal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-3">
          <span className={`h-10 w-10 rounded-lg flex items-center justify-center ${p.iconBg}`}>
            <Icon size={18} strokeWidth={2.5} />
          </span>
          <div className="flex-1">
            <p className="font-display font-extrabold uppercase tracking-tight text-base text-white">
              {initial ? "Edit Goal" : "New Goal"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
              Strategic direction · target vs actual
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="goal-form-close"
            className="p-2 text-neutral-400 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. BW Strength Systems"
            data-testid="goal-name-input"
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">Icon</label>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              data-testid="goal-icon-btn"
              className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex items-center gap-2 hover:border-emerald-500/40"
            >
              <span className={`h-6 w-6 rounded-md flex items-center justify-center ${p.softBg} ${p.text}`}>
                <Icon size={13} strokeWidth={2.5} />
              </span>
              <span className="flex-1 text-left truncate">{form.icon}</span>
            </button>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">Color</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.id })}
                  data-testid={`goal-color-${c.id}`}
                  aria-label={c.label}
                  title={c.label}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    form.color === c.id
                      ? "border-white scale-110"
                      : "border-white/10 hover:scale-110"
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">
            Description (optional)
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="One-line purpose"
            data-testid="goal-description-input"
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">
              Target Allocation (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.targetAllocation}
              onChange={(e) => setForm({ ...form, targetAllocation: e.target.value })}
              data-testid="goal-target-input"
              className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">
              Priority Weight (1–10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.priorityWeight}
              onChange={(e) => setForm({ ...form, priorityWeight: e.target.value })}
              data-testid="goal-priority-input"
              className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-1.5">
            Linked Activities (positive categories)
          </label>
          <MultiToggleList
            items={positiveCats.map((c) => ({ id: c.name, name: c.name }))}
            value={form.linkedActivities}
            onToggle={toggleActivity}
            testIdPrefix="goal-link-activity"
          />
        </div>

        {habitItems.length > 0 && (
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-1.5">
              Linked Habits
            </label>
            <MultiToggleList
              items={habitItems}
              value={form.linkedHabits}
              onToggle={toggleHabit}
              testIdPrefix="goal-link-habit"
            />
          </div>
        )}

        {/* ----- Deadline ----- */}
        <div className="border-t border-white/5 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-amber-400" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-semibold">
              Deadline (optional)
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-500">
                Date
              </label>
              <input
                type="date"
                value={form.deadline || ""}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                data-testid="goal-deadline-input"
                className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-500">
                Type
              </label>
              <select
                value={form.deadlineType || "none"}
                onChange={(e) => setForm({ ...form, deadlineType: e.target.value })}
                disabled={!form.deadline}
                data-testid="goal-deadline-type"
                className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 disabled:opacity-40"
              >
                <option value="none">No Deadline</option>
                <option value="soft">Soft</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          {form.deadline && (
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
              {form.deadlineType === "hard"
                ? "Hard — must complete by this date."
                : form.deadlineType === "soft"
                  ? "Soft — target date, can slip without changing status."
                  : "Pick Soft or Hard above."}
            </p>
          )}
        </div>

        {/* ----- Display Customization ----- */}
        <div className="border-t border-white/5 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.18em] text-violet-400 font-semibold">
              Card Display
            </p>
            <select
              value={form.viewMode}
              onChange={(e) => setForm({ ...form, viewMode: e.target.value })}
              data-testid="goal-view-mode"
              className="bg-neutral-950 border border-white/10 rounded-lg px-2 py-1 text-[10px] uppercase tracking-widest text-neutral-300 focus:outline-none focus:border-violet-500/50"
            >
              <option value="detailed">Detailed</option>
              <option value="compact">Compact</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(DISPLAY_PRESETS).map(([id, p]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPreset(id)}
                data-testid={`goal-preset-${id}`}
                className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  form.displayPreset === id
                    ? "bg-violet-500 text-white border-violet-500"
                    : "border-white/15 text-neutral-300 hover:bg-white/5"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowCustomMetrics((s) => !s)}
            data-testid="goal-toggle-custom-metrics"
            className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            {showCustomMetrics ? "Hide metric toggles" : "Customize metrics"}
          </button>
          {showCustomMetrics && (
            <ul
              className="grid grid-cols-2 gap-1.5 pt-1"
              data-testid="goal-custom-metrics"
            >
              {Object.keys(DEFAULT_DISPLAY_METRICS).map((key) => {
                const on = form.displayMetrics?.[key];
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggleMetric(key)}
                      data-testid={`goal-metric-${key}`}
                      className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md border text-[11px] ${
                        on
                          ? "border-violet-500/40 bg-violet-500/10 text-white"
                          : "border-white/10 text-neutral-400 hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`h-3 w-3 rounded-sm border flex items-center justify-center ${
                          on ? "bg-violet-500 border-violet-500" : "border-white/20"
                        }`}
                      >
                        {on && <Check size={9} strokeWidth={3} className="text-white" />}
                      </span>
                      <span className="capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Why this goal matters…"
            data-testid="goal-notes-input"
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
          >
            <X size={12} className="inline mr-1" /> Cancel
          </button>
          <button
            type="submit"
            data-testid="goal-form-save"
            className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
          >
            <Check size={12} className="inline mr-1" />
            {initial ? "Save" : "Create Goal"}
          </button>
        </div>

        <IconPicker
          open={pickerOpen}
          value={form.icon}
          onChange={(name) => setForm({ ...form, icon: name })}
          onClose={() => setPickerOpen(false)}
        />
      </form>
    </div>
  );
}
