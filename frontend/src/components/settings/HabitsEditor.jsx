import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
];

function formatHM(m) {
  m = Number(m) || 0;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

function HabitForm({ initial, categories, onSave, onCancel, submitLabel = "Save", testIdPrefix = "form" }) {
  const positiveCats = (categories || []).filter((c) => c.type === "positive");
  const [name, setName] = useState(initial?.name || "");
  const [period, setPeriod] = useState(initial?.period || "daily");
  const [goalH, setGoalH] = useState(
    initial?.goalMinutes ? Math.floor(initial.goalMinutes / 60) : 0,
  );
  const [goalM, setGoalM] = useState(
    initial?.goalMinutes ? initial.goalMinutes % 60 : 30,
  );
  const [selected, setSelected] = useState(initial?.categories || []);

  const toggleCat = (c) =>
    setSelected((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Habit name is required", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    const totalMin = (Number(goalH) || 0) * 60 + (Number(goalM) || 0);
    if (totalMin <= 0) {
      toast("Goal must be > 0 minutes", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    if (selected.length === 0) {
      toast("Select at least one source category", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    onSave({
      name: name.trim(),
      period,
      goalMinutes: totalMin,
      categories: selected,
      type: "positive",
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-4 space-y-3"
      data-testid={`${testIdPrefix}-habit-form`}
    >
      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Habit name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Reading"
          data-testid={`${testIdPrefix}-habit-name`}
          className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Period</label>
          <div className="flex items-center gap-1 mt-1 bg-neutral-950 border border-white/10 rounded-lg p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                data-testid={`${testIdPrefix}-period-${p.id}`}
                className={`flex-1 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-semibold ${
                  period === p.id ? "bg-emerald-500 text-black" : "text-neutral-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Goal</label>
          <div className="flex items-center gap-1 mt-1">
            <input
              type="number"
              min="0"
              value={goalH}
              onChange={(e) => setGoalH(e.target.value)}
              placeholder="h"
              data-testid={`${testIdPrefix}-habit-hours`}
              className="w-12 bg-neutral-950 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-emerald-500/50"
            />
            <span className="text-xs text-neutral-500">h</span>
            <input
              type="number"
              min="0"
              max="59"
              value={goalM}
              onChange={(e) => setGoalM(e.target.value)}
              placeholder="m"
              data-testid={`${testIdPrefix}-habit-minutes`}
              className="w-12 bg-neutral-950 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center focus:outline-none focus:border-emerald-500/50"
            />
            <span className="text-xs text-neutral-500">m</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Source Categories</label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {positiveCats.map((c) => {
            const on = selected.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => toggleCat(c.name)}
                data-testid={`${testIdPrefix}-cat-${c.name}`}
                className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1.5 rounded-full border transition-colors ${
                  on
                    ? "bg-emerald-500 text-black border-emerald-500"
                    : "border-white/15 text-neutral-300 hover:bg-white/5"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
          >
            <X size={12} className="inline mr-1" /> Cancel
          </button>
        )}
        <button
          type="submit"
          data-testid={`${testIdPrefix}-habit-save`}
          className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
        >
          <Check size={12} className="inline mr-1" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function HabitsEditor() {
  const { habits, settings, addHabit, updateHabit, deleteHabit } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);

  return (
    <section data-testid="habits-editor" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">
          Habits
        </h2>
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          data-testid="add-habit-toggle"
          className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-1.5 hover:bg-emerald-500/10"
        >
          <Plus size={12} />
          {showAdd ? "Close" : "New"}
        </button>
      </div>

      {showAdd && (
        <HabitForm
          categories={settings.categories || []}
          submitLabel="Add Habit"
          testIdPrefix="add"
          onCancel={() => setShowAdd(false)}
          onSave={(payload) => {
            addHabit(payload);
            setShowAdd(false);
            toast("Habit created", { className: "!bg-neutral-900 !border-emerald-500/30 !text-white" });
          }}
        />
      )}

      <ul className="space-y-1.5">
        {(habits || []).map((h) =>
          editingId === h.id ? (
            <li key={h.id}>
              <HabitForm
                initial={h}
                categories={settings.categories || []}
                submitLabel="Update"
                testIdPrefix={`edit-${h.id}`}
                onCancel={() => setEditingId(null)}
                onSave={(patch) => {
                  updateHabit(h.id, patch);
                  setEditingId(null);
                  toast("Habit updated", { className: "!bg-neutral-900 !border-white/10 !text-white" });
                }}
              />
            </li>
          ) : (
            <li
              key={h.id}
              className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-3"
              data-testid={`habit-row-${h.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{h.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5 truncate">
                  {h.period} · {formatHM(h.goalMinutes)} · {(h.categories || []).join(", ") || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(h.id)}
                data-testid={`edit-habit-${h.id}`}
                className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
                aria-label="Edit habit"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteHabit(h.id);
                  toast(`${h.name} removed`, { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
                }}
                data-testid={`delete-habit-${h.id}`}
                className="p-2 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                aria-label="Delete habit"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ),
        )}
        {(habits || []).length === 0 && !showAdd && (
          <p className="text-sm text-neutral-500">No habits yet — tap “New” to create one.</p>
        )}
      </ul>
    </section>
  );
}
