import { useMemo, useState } from "react";
import { Gauge, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { BASE_PROFILE_ID, clampPriorityPercent } from "../../lib/priorityProfiles";

export default function PriorityProfilesEditor() {
  const { settings, updateSettings } = useApp();
  const categories = useMemo(
    () => [...(settings.categories || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [settings.categories],
  );
  const profiles = settings.priorityProfiles || [];
  const activeId = settings.activePriorityProfileId || BASE_PROFILE_ID;
  const [name, setName] = useState("");

  const addProfile = () => {
    const clean = name.trim();
    if (!clean) return;
    const profile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: clean,
      priorities: {},
    };
    updateSettings({ priorityProfiles: [...profiles, profile], activePriorityProfileId: profile.id });
    setName("");
    toast(`Priority profile “${clean}” created`);
  };

  const updatePriority = (profileId, category, value) => {
    const percent = clampPriorityPercent(value);
    updateSettings({
      priorityProfiles: profiles.map((p) =>
        p.id === profileId
          ? { ...p, priorities: { ...(p.priorities || {}), [category]: percent } }
          : p,
      ),
    });
  };

  const deleteProfile = (profile) => {
    if (!window.confirm(`Delete priority profile “${profile.name}”?`)) return;
    updateSettings({
      priorityProfiles: profiles.filter((p) => p.id !== profile.id),
      activePriorityProfileId: activeId === profile.id ? BASE_PROFILE_ID : activeId,
    });
  };

  const activeProfile = profiles.find((p) => p.id === activeId);

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-4" data-testid="priority-profiles-setting">
      <div className="flex items-center gap-2">
        <Gauge size={14} className="text-violet-400" />
        <div>
          <p className="text-sm font-semibold text-white">Priority Profiles</p>
          <p className="text-xs text-neutral-400 mt-0.5">Category overclock: 50–150%. Base is always 100%.</p>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Active profile</label>
        <select
          value={activeId}
          onChange={(e) => updateSettings({ activePriorityProfileId: e.target.value })}
          className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
          data-testid="active-priority-profile"
        >
          <option value={BASE_PROFILE_ID}>Base · 100%</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addProfile()}
          placeholder="New profile name"
          className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
          data-testid="priority-profile-name"
        />
        <button type="button" onClick={addProfile} className="px-3 rounded-lg bg-violet-500 text-black" data-testid="priority-profile-add">
          <Plus size={16} />
        </button>
      </div>

      {activeId === BASE_PROFILE_ID ? (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-3 text-xs text-neutral-300">
          Base profile is fixed at 100% for every category. Create or select a custom profile to change priorities.
        </div>
      ) : activeProfile ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">{activeProfile.name}</p>
            <button type="button" onClick={() => deleteProfile(activeProfile)} className="p-1.5 text-neutral-500 hover:text-red-500" aria-label="Delete profile">
              <Trash2 size={13} />
            </button>
          </div>
          {categories.length === 0 ? (
            <p className="text-xs text-neutral-500">Create categories first.</p>
          ) : categories.map((cat) => {
            const value = clampPriorityPercent(activeProfile.priorities?.[cat.name] ?? 100);
            return (
              <div key={cat.name} className="grid grid-cols-[1fr_110px] gap-3 items-center">
                <span className="text-sm text-white truncate">{cat.name}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="50"
                    max="150"
                    step="5"
                    value={value}
                    onChange={(e) => updatePriority(activeProfile.id, cat.name, e.target.value)}
                    className="w-20 bg-neutral-950 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-violet-500/50"
                    data-testid={`priority-${cat.name}`}
                  />
                  <span className="text-xs text-neutral-500">%</span>
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-neutral-500 pt-1">New categories automatically start at 100% in every profile.</p>
        </div>
      ) : null}
    </div>
  );
}
