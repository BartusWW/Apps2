import { useState } from "react";
import * as Icons from "lucide-react";
import { Zap, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { paletteFor } from "../../lib/categoryColors";
import IconPicker from "../IconPicker";

const blank = { name: "", category: "", subcategory: "", minutes: 0, points: 0, type: "positive", icon: "Zap" };

function ActionForm({ initial, categories, onSave, onCancel, submitLabel, testIdPrefix }) {
  const [form, setForm] = useState({ ...blank, ...(initial || {}) });
  const [pickerOpen, setPickerOpen] = useState(false);
  const Icon = Icons[form.icon] || Zap;
  const cat = categories.find((c) => c.name === form.category);
  const subcategories = (cat?.subcategories || []).filter((s) => s.active !== false);
  const p = paletteFor(cat?.color || (form.type === "negative" ? "red" : "emerald"));
  const isInstant = !Number(form.minutes) || form.minutes <= 0;

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast("Action name is required");
    if (!form.category) return toast("Pick a category");
    if (subcategories.length > 0 && !form.subcategory) return toast("Pick a subcategory");
    const pts = Number(form.points) || 0;
    const signed = form.type === "negative" ? -Math.abs(pts) : Math.abs(pts);
    onSave({ ...form, name: form.name.trim(), minutes: Math.max(0, Number(form.minutes) || 0), points: signed, type: form.type });
  };

  return <form onSubmit={submit} className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-4 space-y-3" data-testid={`${testIdPrefix}-action-form`}>
    <div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Publish reel" className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"/></div>
    <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: "" })} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"><option value="">— Select —</option>{categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div><div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Subcategory</label><select value={form.subcategory || ""} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"><option value="">— Select —</option>{subcategories.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}</select></div></div>
    <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"><option value="positive">Positive</option><option value="negative">Negative</option></select></div><div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Icon</label><button type="button" onClick={() => setPickerOpen(true)} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex items-center gap-2"><span className={`h-6 w-6 rounded-md flex items-center justify-center ${p.softBg} ${p.text}`}><Icon size={13}/></span><span className="truncate">{form.icon}</span></button></div></div>
    <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Default Minutes</label><input type="number" min="0" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"/></div><div><label className="text-[10px] uppercase tracking-widest text-neutral-500">{isInstant ? "Base points per log" : "Base points / 30 min"}</label><input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"/></div></div>
    <p className="text-[10px] uppercase tracking-widest text-neutral-500">Action points stay fixed. Priority multipliers come only from the selected subcategory.</p>
    <div className="flex items-center justify-end gap-2">{onCancel && <button type="button" onClick={onCancel} className="text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300"><X size={12} className="inline mr-1"/>Cancel</button>}<button type="submit" className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black"><Check size={12} className="inline mr-1"/>{submitLabel}</button></div>
    <IconPicker open={pickerOpen} value={form.icon} onChange={(name) => setForm({ ...form, icon: name })} onClose={() => setPickerOpen(false)} />
  </form>;
}

export default function ActionsEditor() {
  const { actions, settings, addAction, updateAction, deleteAction } = useApp();
  const categories = settings.categories || [];
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const handleAdd = (payload) => { addAction(payload); setAdding(false); toast("Action added"); };
  const handleUpdate = (id, payload) => { updateAction(id, payload); setEditing(null); toast("Action updated"); };
  const handleDelete = (a) => { if (typeof window !== "undefined" && !window.confirm(`Delete "${a.name}"?`)) return; deleteAction(a.id); toast(`${a.name} removed`); };
  const positive = (actions || []).filter((a) => (a.type || "positive") === "positive");
  const negative = (actions || []).filter((a) => a.type === "negative");

  const renderRow = (a) => {
    if (editing === a.id) return <li key={a.id}><ActionForm initial={a} submitLabel="Save" testIdPrefix={`edit-${a.id}`} categories={categories} onCancel={() => setEditing(null)} onSave={(p) => handleUpdate(a.id, p)} /></li>;
    const cat = categories.find((c) => c.name === a.category);
    const Icon = Icons[a.icon] || Zap;
    const p = paletteFor(cat?.color || (a.type === "negative" ? "red" : "emerald"));
    return <li key={a.id} className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-2.5"><span className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text}`}><Icon size={14}/></span><div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{a.name}</p><p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">{a.category}{a.subcategory ? ` · ${a.subcategory}` : ""} · {Number(a.minutes) > 0 ? `${a.points} base / 30m` : `${a.points} base`}</p></div><button type="button" onClick={() => setEditing(a.id)} className="p-2 text-neutral-400 hover:text-emerald-400"><Pencil size={13}/></button><button type="button" onClick={() => handleDelete(a)} className="p-2 text-neutral-500 hover:text-red-500"><Trash2 size={13}/></button></li>;
  };

  return <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold flex items-center gap-1.5"><Zap size={11}/>Actions</h2><button type="button" onClick={() => setAdding((s) => !s)} className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-1.5"><Plus size={12}/>{adding ? "Close" : "New"}</button></div>{adding && <ActionForm submitLabel="Add Action" testIdPrefix="add" categories={categories} onCancel={() => setAdding(false)} onSave={handleAdd}/>}<div><h3 className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold mb-2">Positive · Build</h3><ul className="space-y-1.5">{positive.map(renderRow)}</ul></div>{negative.length > 0 && <div><h3 className="text-[10px] uppercase tracking-[0.18em] text-red-500 font-semibold mb-2">Negative</h3><ul className="space-y-1.5">{negative.map(renderRow)}</ul></div>}</section>;
}
