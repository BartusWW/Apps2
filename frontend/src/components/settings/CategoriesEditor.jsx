import { useState } from "react";
import * as Icons from "lucide-react";
import { Palette, Plus, Trash2, Pencil, Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import IconPicker from "../IconPicker";

const PRESETS = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#e5e7eb"];
const LEGACY = {
  emerald: "#10b981",
  sky: "#38bdf8",
  violet: "#a78bfa",
  amber: "#f59e0b",
  red: "#ef4444",
  yellow: "#facc15",
  indigo: "#6366f1",
  neutral: "#a3a3a3",
};

const toHex = (value) => {
  if (/^#[0-9a-f]{6}$/i.test(value || "")) return value;
  return LEGACY[value] || "#ef4444";
};

function ColorPicker({ value, onChange, canInherit = false, onInherit }) {
  const resolved = toHex(value);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={resolved}
          onChange={(e) => onChange(e.target.value)}
          className="w-11 h-9 rounded-lg bg-neutral-950 border border-white/10 p-1"
        />
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            if (!/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(resolved);
          }}
          placeholder="#EF4444"
          className="w-28 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-xs uppercase"
        />
        {canInherit && (
          <button type="button" onClick={onInherit} className="text-[9px] uppercase border border-white/10 rounded-lg px-2 py-2 text-neutral-400">
            Inherit
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="h-6 w-6 rounded-full border-2"
            style={{ background: color, borderColor: resolved.toLowerCase() === color.toLowerCase() ? "white" : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

const blank = {
  name: "",
  type: "positive",
  icon: "Zap",
  color: "#10b981",
  description: "",
  special: false,
  subcategories: [],
};

export function CategoryForm({ initial, onSave, onCancel, submitLabel, testIdPrefix }) {
  const normalizeSubcategory = (sub) =>
    typeof sub === "string" ? { name: sub, active: true, color: null } : { ...sub, color: sub.color || null };

  const [form, setForm] = useState({
    ...blank,
    ...(initial || {}),
    color: toHex(initial?.color || blank.color),
    subcategories: (initial?.subcategories || []).map(normalizeSubcategory),
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [subName, setSubName] = useState("");
  const Icon = Icons[form.icon] || Icons.Zap;

  const updateSubcategory = (index, patch) => {
    setForm((current) => ({
      ...current,
      subcategories: current.subcategories.map((sub, i) => (i === index ? { ...sub, ...patch } : sub)),
    }));
  };

  const addSubcategory = () => {
    const name = subName.trim();
    if (!name || form.subcategories.some((sub) => sub.name === name)) return;
    setForm((current) => ({
      ...current,
      subcategories: [...current.subcategories, { name, active: true, color: null }],
    }));
    setSubName("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast("Name is required");
    onSave({ ...form, name: form.name.trim(), description: (form.description || "").trim() });
  };

  return (
    <form onSubmit={submit} className="bg-neutral-900 border theme-primary-border rounded-xl p-4 space-y-4" data-testid={`${testIdPrefix}-category-form`}>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm">
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Icon</label>
          <button type="button" onClick={() => setPickerOpen(true)} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded-md flex items-center justify-center" style={{ color: form.color, background: `${form.color}18` }}>
              <Icon size={13} />
            </span>
            <span className="truncate text-sm">{form.icon}</span>
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Category color</label>
        <div className="mt-2">
          <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
        </div>
      </div>

      <label className="flex gap-2 border border-amber-400/20 bg-amber-400/5 p-3 rounded-lg">
        <input type="checkbox" checked={form.special === true} onChange={(e) => setForm({ ...form, special: e.target.checked })} />
        <span className="text-sm"><ShieldCheck size={13} className="inline text-amber-300 mr-1" />Special Category</span>
      </label>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Description</label>
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Subcategories</label>
        {form.subcategories.map((sub, index) => {
          const resolvedColor = sub.color || form.color;
          return (
            <div key={`${sub.name}-${index}`} className="rounded-xl border border-white/10 p-3 space-y-2">
              <div className="flex gap-2">
                <input type="checkbox" checked={sub.active !== false} onChange={(e) => updateSubcategory(index, { active: e.target.checked })} />
                <input value={sub.name} onChange={(e) => updateSubcategory(index, { name: e.target.value })} className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => setForm((current) => ({ ...current, subcategories: current.subcategories.filter((_, i) => i !== index) }))}>
                  <Trash2 size={13} />
                </button>
              </div>
              <div>
                <p className="text-[9px] uppercase text-neutral-600 mb-1">Color · {sub.color ? "Custom" : "Inherits category"}</p>
                <ColorPicker
                  value={resolvedColor}
                  canInherit={Boolean(sub.color)}
                  onInherit={() => updateSubcategory(index, { color: null })}
                  onChange={(color) => updateSubcategory(index, { color })}
                />
              </div>
            </div>
          );
        })}
        <div className="flex gap-2">
          <input
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubcategory();
              }
            }}
            placeholder="New subcategory"
            className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm"
          />
          <button type="button" onClick={addSubcategory} className="px-3 border border-white/15 rounded-lg"><Plus size={14} /></button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && <button type="button" onClick={onCancel} className="px-3 py-2 border border-white/15 rounded-lg text-xs"><X size={12} className="inline" /> Cancel</button>}
        <button type="submit" className="px-3 py-2 theme-primary-bg rounded-lg text-xs font-bold"><Check size={12} className="inline" /> {submitLabel}</button>
      </div>
      <IconPicker open={pickerOpen} value={form.icon} onChange={(name) => setForm({ ...form, icon: name })} onClose={() => setPickerOpen(false)} />
    </form>
  );
}

export default function CategoriesEditor() {
  const { settings, updateSettings } = useApp();
  const categories = [...(settings.categories || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const saveExisting = (name, patch) => {
    updateSettings({ categories: (settings.categories || []).map((category) => category.name === name ? { ...category, ...patch } : category) });
    setEditing(null);
    toast("Category updated");
  };

  const addCategory = (category) => {
    if ((settings.categories || []).some((item) => item.name === category.name)) return toast("Category name already exists");
    updateSettings({ categories: [...(settings.categories || []), { ...category, sortOrder: (settings.categories || []).length }] });
    setAdding(false);
  };

  const deleteCategory = (name) => {
    if (window.confirm(`Delete category “${name}”?`)) {
      updateSettings({ categories: (settings.categories || []).filter((category) => category.name !== name) });
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex justify-between">
        <h2 className="text-[10px] uppercase tracking-[.18em] theme-secondary-text font-semibold"><Palette size={11} className="inline" /> Categories & Subcategories</h2>
        <button onClick={() => setAdding((value) => !value)} className="border theme-primary-border theme-primary-text rounded-lg px-3 py-1.5 text-xs uppercase"><Plus size={12} className="inline" /> {adding ? "Close" : "New"}</button>
      </div>

      {adding && <CategoryForm submitLabel="Add Category" testIdPrefix="add" onCancel={() => setAdding(false)} onSave={addCategory} />}

      <div className="space-y-2">
        {categories.map((category) => {
          if (editing === category.name) {
            return <CategoryForm key={category.name} initial={category} submitLabel="Save" testIdPrefix={`edit-${category.name}`} onCancel={() => setEditing(null)} onSave={(patch) => saveExisting(category.name, patch)} />;
          }

          return (
            <div key={category.name} className="bg-neutral-900 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ background: toHex(category.color) }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{category.name}</p>
                  <p className="text-[10px] text-neutral-500">{(category.subcategories || []).filter((sub) => typeof sub === "string" || sub.active !== false).length} active subcategories</p>
                </div>
                <button onClick={() => setEditing(category.name)}><Pencil size={13} /></button>
                <button onClick={() => deleteCategory(category.name)}><Trash2 size={13} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(category.subcategories || []).map((sub) => {
                  const normalized = typeof sub === "string" ? { name: sub, color: null } : sub;
                  const color = toHex(normalized.color || category.color);
                  return (
                    <span key={normalized.name} className="text-[10px] px-2 py-1 rounded-full border" style={{ borderColor: `${color}55`, color, background: `${color}10` }}>
                      {normalized.name}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
