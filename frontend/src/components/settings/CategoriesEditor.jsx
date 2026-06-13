import { useState } from "react";
import * as Icons from "lucide-react";
import { Palette, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { COLOR_OPTIONS, paletteFor } from "../../lib/categoryColors";

function ColorSwatchPicker({ value, onChange, testIdPrefix }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          data-testid={`${testIdPrefix}-color-${c.id}`}
          aria-label={c.label}
          title={c.label}
          className={`h-6 w-6 rounded-full border-2 transition-transform ${
            value === c.id ? "border-white scale-110" : "border-white/10 hover:scale-110"
          }`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

const blank = { name: "", type: "positive", icon: "Zap", color: "emerald", description: "" };

function CategoryForm({ initial, onSave, onCancel, submitLabel, testIdPrefix }) {
  const [form, setForm] = useState({ ...blank, ...(initial || {}) });
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Name is required", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    onSave({ ...form, name: form.name.trim(), description: (form.description || "").trim() });
  };
  return (
    <form
      onSubmit={submit}
      className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-4 space-y-3"
      data-testid={`${testIdPrefix}-category-form`}
    >
      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Recovery"
          data-testid={`${testIdPrefix}-cat-name`}
          className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            data-testid={`${testIdPrefix}-cat-type`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Icon (Lucide name)</label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="e.g. BookOpen"
            data-testid={`${testIdPrefix}-cat-icon`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Color</label>
        <div className="mt-1">
          <ColorSwatchPicker
            value={form.color}
            onChange={(c) => setForm({ ...form, color: c })}
            testIdPrefix={testIdPrefix}
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Description (optional)</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short purpose / context"
          data-testid={`${testIdPrefix}-cat-description`}
          className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        />
      </div>
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
          data-testid={`${testIdPrefix}-cat-save`}
          className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
        >
          <Check size={12} className="inline mr-1" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function CategoriesEditor() {
  const { settings, updateSettings } = useApp();
  const categories = settings.categories || [];
  const [editing, setEditing] = useState(null); // name being edited
  const [adding, setAdding] = useState(false);

  const updateCategory = (name, patch) => {
    const next = categories.map((c) => (c.name === name ? { ...c, ...patch } : c));
    updateSettings({ categories: next });
  };
  const addCategory = (cat) => {
    if (categories.some((c) => c.name === cat.name)) {
      toast("Category name already exists", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    updateSettings({ categories: [...categories, cat] });
    setAdding(false);
    toast("Category added", { className: "!bg-neutral-900 !border-emerald-500/30 !text-white" });
  };
  const deleteCategory = (name) => {
    updateSettings({ categories: categories.filter((c) => c.name !== name) });
    toast(`${name} removed`, { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
  };

  return (
    <section data-testid="categories-editor" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold flex items-center gap-1.5">
          <Palette size={11} /> Categories
        </h2>
        <button
          type="button"
          onClick={() => setAdding((s) => !s)}
          data-testid="add-category-toggle"
          className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-1.5 hover:bg-emerald-500/10"
        >
          <Plus size={12} />
          {adding ? "Close" : "New"}
        </button>
      </div>

      {adding && (
        <CategoryForm
          submitLabel="Add Category"
          testIdPrefix="add"
          onCancel={() => setAdding(false)}
          onSave={addCategory}
        />
      )}

      <ul className="space-y-1.5">
        {categories.map((c) => {
          const Icon = Icons[c.icon] || Icons.Zap;
          const p = paletteFor(c.color || (c.type === "negative" ? "red" : "emerald"));
          if (editing === c.name) {
            return (
              <li key={c.name}>
                <CategoryForm
                  initial={c}
                  submitLabel="Save"
                  testIdPrefix={`edit-${c.name}`}
                  onCancel={() => setEditing(null)}
                  onSave={(patch) => {
                    updateCategory(c.name, patch);
                    setEditing(null);
                    toast("Category updated", { className: "!bg-neutral-900 !border-white/10 !text-white" });
                  }}
                />
              </li>
            );
          }
          return (
            <li
              key={c.name}
              className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-3"
              data-testid={`category-row-${c.name}`}
            >
              <span className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text}`}>
                <Icon size={14} strokeWidth={2.5} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{c.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">
                  {c.type} · {c.color || "default"}
                  {c.description ? ` · ${c.description}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(c.name)}
                data-testid={`edit-category-${c.name}`}
                className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
                aria-label="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => deleteCategory(c.name)}
                data-testid={`delete-category-${c.name}`}
                className="p-2 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </li>
          );
        })}
        {categories.length === 0 && !adding && (
          <p className="text-sm text-neutral-500">No categories. Tap “New” to create one.</p>
        )}
      </ul>
    </section>
  );
}
