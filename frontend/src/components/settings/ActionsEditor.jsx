import { useState } from "react";
import * as Icons from "lucide-react";
import { Zap, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { paletteFor } from "../../lib/categoryColors";
import IconPicker from "../IconPicker";

const blank = {
  name: "",
  category: "",
  minutes: 0,
  points: 0,
  type: "positive",
  icon: "Zap",
};

function ActionForm({ initial, categories, onSave, onCancel, submitLabel, testIdPrefix }) {
  const [form, setForm] = useState({ ...blank, ...(initial || {}) });
  const [pickerOpen, setPickerOpen] = useState(false);
  const Icon = Icons[form.icon] || Zap;
  const cat = categories.find((c) => c.name === form.category);
  const p = paletteFor(cat?.color || (form.type === "negative" ? "red" : "emerald"));
  const isInstant = !Number(form.minutes) || form.minutes <= 0;

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Action name is required", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    if (!form.category) {
      toast("Pick a category", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      minutes: Math.max(0, Number(form.minutes) || 0),
      points: Number(form.points) || 0,
      // Mirror the category's type so logs always agree with their parent.
      type: cat?.type || form.type,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-4 space-y-3"
      data-testid={`${testIdPrefix}-action-form`}
    >
      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. 30 min PT Study"
          data-testid={`${testIdPrefix}-action-name`}
          className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            data-testid={`${testIdPrefix}-action-category`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">— Select —</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Icon</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            data-testid={`${testIdPrefix}-action-icon-btn`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex items-center gap-2 hover:border-emerald-500/40"
          >
            <span className={`h-6 w-6 rounded-md flex items-center justify-center ${p.softBg} ${p.text}`}>
              <Icon size={13} strokeWidth={2.5} />
            </span>
            <span className="flex-1 text-left truncate">{form.icon}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">
            Default Minutes (0 = instant)
          </label>
          <input
            type="number"
            min="0"
            value={form.minutes}
            onChange={(e) => setForm({ ...form, minutes: e.target.value })}
            data-testid={`${testIdPrefix}-action-minutes`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">
            {isInstant ? "Fixed Points" : "Points (auto by duration)"}
          </label>
          <input
            type="number"
            value={form.points}
            onChange={(e) => setForm({ ...form, points: e.target.value })}
            disabled={!isInstant}
            data-testid={`${testIdPrefix}-action-points`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
          />
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-widest text-neutral-500">
        {isInstant
          ? "Instant action — logs immediately with fixed points."
          : "Timed action — asks for duration on log; points = duration × rate."}
      </p>

      <div className="flex items-center justify-end gap-2">
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
          data-testid={`${testIdPrefix}-action-save`}
          className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
        >
          <Check size={12} className="inline mr-1" />
          {submitLabel}
        </button>
      </div>

      <IconPicker
        open={pickerOpen}
        value={form.icon}
        onChange={(name) => setForm({ ...form, icon: name })}
        onClose={() => setPickerOpen(false)}
      />
    </form>
  );
}

export default function ActionsEditor() {
  const { actions, settings, addAction, updateAction, deleteAction } = useApp();
  const categories = settings.categories || [];
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const handleAdd = (payload) => {
    addAction({ id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...payload });
    setAdding(false);
    toast("Action added", { className: "!bg-neutral-900 !border-emerald-500/30 !text-white" });
  };
  const handleUpdate = (id, payload) => {
    updateAction(id, payload);
    setEditing(null);
    toast("Action updated", { className: "!bg-neutral-900 !border-white/10 !text-white" });
  };
  const handleDelete = (a) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${a.name}"?`)) return;
    deleteAction(a.id);
    toast(`${a.name} removed`, { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
  };

  // Group actions by category for readability.
  const grouped = categories.map((c) => ({
    category: c,
    items: (actions || []).filter((a) => a.category === c.name),
  }));
  const orphans = (actions || []).filter(
    (a) => !categories.some((c) => c.name === a.category),
  );

  return (
    <section data-testid="actions-editor" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold flex items-center gap-1.5">
          <Zap size={11} /> Actions
        </h2>
        <button
          type="button"
          onClick={() => setAdding((s) => !s)}
          data-testid="add-action-toggle"
          className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-1.5 hover:bg-emerald-500/10"
        >
          <Plus size={12} />
          {adding ? "Close" : "New"}
        </button>
      </div>

      {adding && (
        <ActionForm
          submitLabel="Add Action"
          testIdPrefix="add"
          categories={categories}
          onCancel={() => setAdding(false)}
          onSave={handleAdd}
        />
      )}

      <div className="space-y-3">
        {grouped.map(({ category, items }) => (
          <div key={category.name} className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
              {category.name}
            </p>
            {items.length === 0 ? (
              <p className="text-xs text-neutral-600 italic">No actions yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((a) => {
                  if (editing === a.id) {
                    return (
                      <li key={a.id}>
                        <ActionForm
                          initial={a}
                          submitLabel="Save"
                          testIdPrefix={`edit-${a.id}`}
                          categories={categories}
                          onCancel={() => setEditing(null)}
                          onSave={(p) => handleUpdate(a.id, p)}
                        />
                      </li>
                    );
                  }
                  const Icon = Icons[a.icon] || Zap;
                  const isInstant = !Number(a.minutes) || a.minutes <= 0;
                  const p = paletteFor(category.color || (category.type === "negative" ? "red" : "emerald"));
                  return (
                    <li
                      key={a.id}
                      className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-2.5"
                      data-testid={`action-row-${a.id}`}
                    >
                      <span className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text}`}>
                        <Icon size={14} strokeWidth={2.5} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{a.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">
                          {isInstant
                            ? `Instant · ${a.points > 0 ? "+" : ""}${a.points} pts`
                            : `Timed · default ${a.minutes}m`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing(a.id)}
                        data-testid={`edit-action-${a.id}`}
                        className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
                        aria-label="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a)}
                        data-testid={`delete-action-${a.id}`}
                        className="p-2 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                        aria-label="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
        {orphans.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
              Orphan actions (category missing)
            </p>
            <ul className="space-y-1.5">
              {orphans.map((a) => (
                <li
                  key={a.id}
                  className="bg-neutral-900 border border-amber-500/20 rounded-lg px-3.5 py-3 flex items-center gap-2.5"
                  data-testid={`action-row-${a.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{a.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-amber-400 truncate">
                      Was: {a.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(a.id)}
                    className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
                    aria-label="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    className="p-2 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                    aria-label="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
