import { useState } from "react";
import * as Icons from "lucide-react";
import { X, Check, Calendar, ListChecks, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { COLOR_OPTIONS, paletteFor } from "../lib/categoryColors";
import IconPicker from "./IconPicker";
import { useApp } from "../context/AppContext";
import { DISPLAY_PRESETS, metricsForPreset, DEFAULT_DISPLAY_METRICS } from "../lib/goals";
import { PROGRESS_TYPES } from "../lib/goalProgress";

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
  progressType: "hours",
  progress: {
    manualPct: 0,
    valueCurrent: 0,
    valueTarget: 0,
    valueUnit: "items",
    checklist: [],
    hoursTarget: 0,
    ongoing: { weeklyTargetMinutes: 0, monthlyTargetMinutes: 0, milestones: [] },
  },
};

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

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
  // Deep-merge progress so legacy goals still get all the nested defaults.
  seeded.progress = {
    ...blank.progress,
    ...(seeded.progress || {}),
    ongoing: {
      ...blank.progress.ongoing,
      ...((seeded.progress && seeded.progress.ongoing) || {}),
    },
  };
  const [form, setForm] = useState(seeded);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCustomMetrics, setShowCustomMetrics] = useState(
    seeded.displayPreset === "custom",
  );

  if (!open) return null;
  const Icon = Icons[form.icon] || Icons.Target;
  const p = paletteFor(form.color);

  const setProgress = (patch) => {
    setForm((f) => ({ ...f, progress: { ...f.progress, ...patch } }));
  };

  const addChecklistItem = () => {
    setProgress({
      checklist: [...(form.progress.checklist || []), { id: genId(), label: "", done: false }],
    });
  };
  const updateChecklistItem = (id, patch) => {
    setProgress({
      checklist: (form.progress.checklist || []).map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });
  };
  const deleteChecklistItem = (id) => {
    setProgress({
      checklist: (form.progress.checklist || []).filter((c) => c.id !== id),
    });
  };

  const addMilestone = () => {
    const next = [
      ...(form.progress.ongoing.milestones || []),
      { id: genId(), label: "", hoursTarget: 0 },
    ];
    setForm((f) => ({
      ...f,
      progress: { ...f.progress, ongoing: { ...f.progress.ongoing, milestones: next } },
    }));
  };
  const updateMilestone = (id, patch) => {
    const next = (form.progress.ongoing.milestones || []).map((m) =>
      m.id === id ? { ...m, ...patch } : m,
    );
    setForm((f) => ({
      ...f,
      progress: { ...f.progress, ongoing: { ...f.progress.ongoing, milestones: next } },
    }));
  };
  const deleteMilestone = (id) => {
    const next = (form.progress.ongoing.milestones || []).filter((m) => m.id !== id);
    setForm((f) => ({
      ...f,
      progress: { ...f.progress, ongoing: { ...f.progress.ongoing, milestones: next } },
    }));
  };

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
      progressType: form.progressType || "manual",
      progress: form.progress,
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

        {/* ----- Progress Tracking ----- */}
        <div className="border-t border-white/5 pt-3 space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks size={12} className="text-sky-400" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold">
              Progress Tracking
            </p>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">Type</label>
            <select
              value={form.progressType}
              onChange={(e) => setForm({ ...form, progressType: e.target.value })}
              data-testid="goal-progress-type"
              className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
            >
              {PROGRESS_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {form.progressType === "manual" && (
            <div data-testid="progress-fields-manual">
              <label className="text-[10px] uppercase tracking-widest text-neutral-500">
                Current Progress %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.progress.manualPct}
                onChange={(e) => setProgress({ manualPct: e.target.value })}
                data-testid="progress-manual-pct"
                className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>
          )}

          {form.progressType === "value" && (
            <div className="grid grid-cols-3 gap-2" data-testid="progress-fields-value">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Current</label>
                <input
                  type="number"
                  min="0"
                  value={form.progress.valueCurrent}
                  onChange={(e) => setProgress({ valueCurrent: e.target.value })}
                  data-testid="progress-value-current"
                  className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Target</label>
                <input
                  type="number"
                  min="0"
                  value={form.progress.valueTarget}
                  onChange={(e) => setProgress({ valueTarget: e.target.value })}
                  data-testid="progress-value-target"
                  className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Unit</label>
                <input
                  type="text"
                  value={form.progress.valueUnit}
                  onChange={(e) => setProgress({ valueUnit: e.target.value })}
                  placeholder="pages"
                  data-testid="progress-value-unit"
                  className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>
            </div>
          )}

          {form.progressType === "checklist" && (
            <div data-testid="progress-fields-checklist" className="space-y-1.5">
              <ul className="space-y-1.5">
                {(form.progress.checklist || []).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 bg-neutral-950 border border-white/10 rounded-lg px-2 py-1.5"
                    data-testid={`checklist-row-${item.id}`}
                  >
                    <GripVertical size={11} className="text-neutral-600 shrink-0" />
                    <button
                      type="button"
                      onClick={() => updateChecklistItem(item.id, { done: !item.done })}
                      data-testid={`checklist-toggle-${item.id}`}
                      className={`h-4 w-4 rounded border flex items-center justify-center ${
                        item.done ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                      }`}
                      aria-label="Toggle"
                    >
                      {item.done && <Check size={10} strokeWidth={3} className="text-black" />}
                    </button>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateChecklistItem(item.id, { label: e.target.value })}
                      placeholder="Item label"
                      data-testid={`checklist-label-${item.id}`}
                      className={`flex-1 bg-transparent text-sm text-white focus:outline-none ${
                        item.done ? "line-through text-neutral-500" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => deleteChecklistItem(item.id)}
                      data-testid={`checklist-delete-${item.id}`}
                      className="p-1 text-neutral-500 hover:text-red-400"
                      aria-label="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addChecklistItem}
                data-testid="checklist-add"
                className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-lg border border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
              >
                + Add Item
              </button>
            </div>
          )}

          {form.progressType === "hours" && (
            <div data-testid="progress-fields-hours">
              <label className="text-[10px] uppercase tracking-widest text-neutral-500">
                Target Hours
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.progress.hoursTarget}
                onChange={(e) => setProgress({ hoursTarget: e.target.value })}
                placeholder="e.g. 500"
                data-testid="progress-hours-target"
                className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
              />
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
                Progress fills from goal-linked logged hours.
              </p>
            </div>
          )}

          {form.progressType === "ongoing" && (
            <div data-testid="progress-fields-ongoing" className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">
                    Weekly Target (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.progress.ongoing.weeklyTargetMinutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        progress: {
                          ...f.progress,
                          ongoing: { ...f.progress.ongoing, weeklyTargetMinutes: e.target.value },
                        },
                      }))
                    }
                    data-testid="progress-ongoing-weekly"
                    className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500">
                    Monthly Target (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.progress.ongoing.monthlyTargetMinutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        progress: {
                          ...f.progress,
                          ongoing: { ...f.progress.ongoing, monthlyTargetMinutes: e.target.value },
                        },
                      }))
                    }
                    data-testid="progress-ongoing-monthly"
                    className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                Milestones (optional)
              </p>
              <ul className="space-y-1.5" data-testid="ongoing-milestones">
                {(form.progress.ongoing.milestones || []).map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 bg-neutral-950 border border-white/10 rounded-lg px-2 py-1.5"
                    data-testid={`milestone-row-${m.id}`}
                  >
                    <input
                      type="text"
                      value={m.label}
                      onChange={(e) => updateMilestone(m.id, { label: e.target.value })}
                      placeholder="e.g. 100h reading"
                      data-testid={`milestone-label-${m.id}`}
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      value={m.hoursTarget}
                      onChange={(e) => updateMilestone(m.id, { hoursTarget: e.target.value })}
                      placeholder="Hours"
                      data-testid={`milestone-hours-${m.id}`}
                      className="w-16 bg-neutral-900 border border-white/10 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-sky-500/50"
                    />
                    <span className="text-[10px] text-neutral-500">h</span>
                    <button
                      type="button"
                      onClick={() => deleteMilestone(m.id)}
                      data-testid={`milestone-delete-${m.id}`}
                      className="p-1 text-neutral-500 hover:text-red-400"
                      aria-label="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addMilestone}
                data-testid="milestone-add"
                className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-lg border border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
              >
                + Add Milestone
              </button>
            </div>
          )}
        </div>

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
