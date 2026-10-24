import { useMemo, useState } from "react";
import { Gauge, Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { BASE_PROFILE_ID, clampCategoryPercent, clampSubcategoryPercent, validateProfileBudgets } from "../../lib/priorityProfiles";

export default function PriorityProfilesEditor() {
  const { settings, updateSettings } = useApp();
  const categories = useMemo(() => [...(settings.categories || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [settings.categories]);
  const profiles = settings.priorityProfiles || [];
  const activeId = settings.activePriorityProfileId || BASE_PROFILE_ID;
  const [name, setName] = useState("");
  const [draft, setDraft] = useState(null);

  const activeProfile = profiles.find((p) => p.id === activeId) || null;
  const editing = draft && draft.id === activeId ? draft : activeProfile;
  const validation = editing ? validateProfileBudgets(settings, editing) : null;

  const addProfile = () => {
    const clean = name.trim();
    if (!clean) return;
    const profile = { id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: clean, categoryPriorities: {}, subcategoryPriorities: {} };
    updateSettings({ priorityProfiles: [...profiles, profile], activePriorityProfileId: profile.id });
    setDraft(profile);
    setName("");
  };

  const patchDraft = (patch) => setDraft((prev) => ({ ...(prev || activeProfile), ...patch }));
  const setCategory = (cat, raw) => {
    const next = { ...(editing?.categoryPriorities || {}), [cat]: clampCategoryPercent(raw) };
    patchDraft({ categoryPriorities: next });
  };
  const setSubcategory = (cat, sub, raw) => {
    const key = `${cat}::${sub}`;
    const next = { ...(editing?.subcategoryPriorities || {}), [key]: clampSubcategoryPercent(raw) };
    patchDraft({ subcategoryPriorities: next });
  };

  const save = () => {
    if (!editing) return;
    const check = validateProfileBudgets(settings, editing);
    if (!check.valid) {
      toast("Priority budget exceeded", { description: check.categoryOver ? `${check.categorySpend}/${check.categoryCap}% category budget` : `${check.subcategoryErrors[0].category}: ${check.subcategoryErrors[0].spend}/${check.subcategoryErrors[0].cap}%`, className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    updateSettings({ priorityProfiles: profiles.map((p) => p.id === editing.id ? editing : p) });
    setDraft(null);
    toast("Priority profile saved");
  };

  const deleteProfile = (profile) => {
    if (!window.confirm(`Delete priority profile “${profile.name}”?`)) return;
    updateSettings({ priorityProfiles: profiles.filter((p) => p.id !== profile.id), activePriorityProfileId: activeId === profile.id ? BASE_PROFILE_ID : activeId });
    setDraft(null);
  };

  return <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-4" data-testid="priority-profiles-setting">
    <div className="flex items-start gap-2"><Gauge size={14} className="text-violet-400 mt-0.5" /><div><p className="text-sm font-semibold text-white">Priority Profiles</p><p className="text-xs text-neutral-400 mt-0.5">Category 50–120% controls budget. Subcategory 50–200% controls actual CBE multiplier.</p></div></div>
    <div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Active profile</label><select value={activeId} onChange={(e) => { updateSettings({ activePriorityProfileId: e.target.value }); setDraft(null); }} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"><option value={BASE_PROFILE_ID}>Balanced · 100%</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="New profile name" className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"/><button type="button" onClick={addProfile} className="px-3 rounded-lg bg-violet-500 text-black"><Plus size={16}/></button></div>
    {activeId === BASE_PROFILE_ID ? <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-3 text-xs text-neutral-300">Balanced is fixed at 100% everywhere. Select a custom profile to overclock priorities.</div> : editing ? <div className="space-y-4">
      <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">{editing.name}</p>{validation && <p className={`text-xs mt-1 ${validation.categoryOver ? "text-red-400" : "text-emerald-400"}`}>Main budget: {validation.categorySpend}/{validation.categoryCap}%</p>}</div><button type="button" onClick={() => deleteProfile(editing)} className="p-1.5 text-neutral-500 hover:text-red-500"><Trash2 size={13}/></button></div>
      {categories.map((cat) => {
        const catPct = clampCategoryPercent(editing.categoryPriorities?.[cat.name] ?? editing.priorities?.[cat.name] ?? 100);
        const subs = (cat.subcategories || []).filter((s) => s.active !== false);
        const cap = subs.length * catPct;
        const spend = subs.reduce((sum, sub) => sum + clampSubcategoryPercent(editing.subcategoryPriorities?.[`${cat.name}::${sub.name}`] ?? 100), 0);
        const over = spend > cap;
        return <div key={cat.name} className="rounded-xl border border-white/10 p-3 space-y-3">
          <div className="flex items-center gap-3"><div className="flex-1"><div className="flex items-center gap-2"><span className="text-sm font-semibold text-white">{cat.name}</span>{cat.special && <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-300 flex items-center gap-1"><ShieldCheck size={9}/>Special</span>}</div><p className={`text-[10px] mt-1 uppercase tracking-widest ${over ? "text-red-400" : "text-neutral-500"}`}>Sub budget {spend}/{cap}%</p></div><input type="number" min="50" max="120" step="5" value={catPct} onChange={(e) => setCategory(cat.name, e.target.value)} className="w-20 bg-neutral-950 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-right"/><span className="text-xs text-neutral-500">%</span></div>
          {subs.map((sub) => { const key = `${cat.name}::${sub.name}`; const val = clampSubcategoryPercent(editing.subcategoryPriorities?.[key] ?? 100); return <div key={sub.name} className="grid grid-cols-[1fr_90px] gap-3 items-center pl-3 border-l border-white/10"><span className="text-xs text-neutral-300 truncate">{sub.name}</span><div className="flex items-center gap-1"><input type="number" min="50" max="200" step="5" value={val} onChange={(e) => setSubcategory(cat.name, sub.name, e.target.value)} className="w-16 bg-neutral-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-right"/><span className="text-[10px] text-neutral-500">%</span></div></div>; })}
        </div>;
      })}
      <div className="flex items-center justify-between"><p className="text-[10px] text-neutral-500">Unused budget is allowed. Overspending is not.</p><button type="button" onClick={save} disabled={!validation?.valid} className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-violet-500 text-black disabled:opacity-40">Save Profile</button></div>
    </div> : null}
  </div>;
}
