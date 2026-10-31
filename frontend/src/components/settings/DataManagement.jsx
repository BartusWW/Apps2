import { useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { exportAllData, importAllData } from "../../lib/storage";
import { metricBackupKeys } from "../../lib/metricStorage";
import { missionBackupKey } from "../../lib/missionStorage";
import { V3_STATE_KEY } from "../../core/v3/storage";
import { localISO } from "../../lib/dateUtils";
import { Download, Upload, Trash2, Database, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const EXTENDED_BACKUP_KEYS = [...metricBackupKeys(), missionBackupKey, V3_STATE_KEY];

const RESET_OPTIONS = [
  { id: "history", label: "Log history & CBE entries", description: "Completed actions, score history and output history", defaultOn: true },
  { id: "plans", label: "Tasks & daily plans", description: "Today, future planned tasks and day state", defaultOn: true },
  { id: "goals", label: "Goals", description: "Active, future and completed goals", defaultOn: true },
  { id: "recurring", label: "Habits & recurring tasks", description: "Habit definitions and recurring schedules", defaultOn: true },
  { id: "reviews", label: "Review notes", description: "Weekly and monthly review notes", defaultOn: true },
  { id: "brain", label: "Brain Dump", description: "All saved Brain Dump items", defaultOn: true },
  { id: "actions", label: "Actions", description: "Your Action library — keep this for a clean start", defaultOn: false },
  { id: "categories", label: "Categories & subcategories", description: "Category structure and subcategories", defaultOn: false },
  { id: "preferences", label: "Theme, priorities & app preferences", description: "Priority profiles, theme, pins and other settings", defaultOn: false },
];

function downloadJSON(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cbe-backup-${localISO()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function readSettings() {
  try { return JSON.parse(localStorage.getItem("cbe.settings.v1") || "{}"); } catch { return {}; }
}

function exportCompleteBackup() {
  const payload = exportAllData();
  const data = { ...(payload.data || {}) };
  for (const key of EXTENDED_BACKUP_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
  }
  return { ...payload, data };
}

function importCompleteBackup(payload) {
  importAllData(payload);
  for (const key of EXTENDED_BACKUP_KEYS) localStorage.removeItem(key);
  for (const key of EXTENDED_BACKUP_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(payload?.data || {}, key)) continue;
    const value = payload.data[key];
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  }
}

export default function DataManagement() {
  const { reloadFromStorage, entries } = useApp();
  const fileRef = useRef(null);
  const [resetText, setResetText] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [selected, setSelected] = useState(() => Object.fromEntries(RESET_OPTIONS.map(o => [o.id, o.defaultOn])));

  const handleExport = () => {
    downloadJSON(exportCompleteBackup());
    toast("Backup downloaded", { description: `${entries.length} entries · complete data`, className: "!bg-neutral-900 !border-emerald-500/30 !text-white" });
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!window.confirm(`Import will REPLACE all current data with the contents of "${file.name}". Continue?`)) return;
      importCompleteBackup(payload);
      reloadFromStorage();
      toast("Data imported. Reloading…", { className: "!bg-neutral-900 !border-emerald-500/30 !text-white" });
      setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      toast(`Import failed: ${e.message}`, { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
    } finally { event.target.value = ""; }
  };

  const handleReset = () => {
    if (resetText !== "RESET") return;
    const settings = readSettings();
    if (selected.history) localStorage.setItem("cbe.entries.v1", "[]");
    if (selected.plans) localStorage.setItem("cbe.daily-plans.v1", "{}");
    if (selected.goals) localStorage.setItem("cbe.goals.v1", "[]");
    if (selected.reviews) localStorage.setItem("cbe.notes.v1", JSON.stringify({ weekly: {}, monthly: {} }));
    if (selected.brain) localStorage.setItem("cbe.brain-dump.v1", "[]");
    if (selected.actions) localStorage.removeItem("cbe.actions.v1");
    if (selected.recurring) { settings.habits = []; settings.recurringTasks = []; }
    if (selected.categories) delete settings.categories;
    if (selected.preferences) {
      const keep = selected.categories ? {} : { categories: settings.categories };
      localStorage.removeItem("cbe.settings.v1");
      if (keep.categories) localStorage.setItem("cbe.settings.v1", JSON.stringify(keep));
    } else if (selected.recurring || selected.categories) {
      localStorage.setItem("cbe.settings.v1", JSON.stringify(settings));
    }

    reloadFromStorage();
    toast("Selected data reset. Reloading…", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
    setTimeout(() => window.location.reload(), 250);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <section data-testid="data-management" className="space-y-3">
      <h2 className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold flex items-center gap-1.5"><Database size={11} /> Data Management</h2>

      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2"><Download size={14} className="text-emerald-400" /><p className="text-sm font-semibold text-white">Export Backup</p></div>
        <p className="text-xs text-neutral-400">Download a complete JSON backup including execution data, Goals, Missions, Metrics and metric history.</p>
        <button type="button" onClick={handleExport} className="w-full text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400">Export to JSON</button>
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2"><Upload size={14} className="text-sky-400" /><p className="text-sm font-semibold text-white">Import Backup</p></div>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} className="w-full text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-lg bg-sky-500 text-black hover:bg-sky-400">Choose JSON File</button>
      </div>

      <div className="bg-neutral-900 border border-red-500/30 rounded-xl p-4 space-y-4" data-testid="reset-card">
        <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-red-500" /><p className="text-sm font-semibold text-white">Danger Zone — Reset</p></div>
        <p className="text-xs text-neutral-400">Choose exactly what should be reset. Unchecked data is preserved.</p>

        <div className="space-y-2">
          {RESET_OPTIONS.map(option => (
            <label key={option.id} className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${selected[option.id] ? "border-red-500/35 bg-red-500/5" : "border-white/10 bg-neutral-950/50"}`}>
              <input type="checkbox" checked={!!selected[option.id]} onChange={() => setSelected(s => ({ ...s, [option.id]: !s[option.id] }))} className="mt-0.5 accent-red-500" />
              <span className="min-w-0"><span className="block text-xs font-semibold text-white">{option.label}</span><span className="block text-[10px] text-neutral-500 mt-0.5">{option.description}</span></span>
            </label>
          ))}
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-[10px] text-emerald-300">
          Clean-start default preserves Actions, Categories, Subcategories, Theme and Priority Profiles.
        </div>

        {!confirmReset ? (
          <button type="button" disabled={!selectedCount} onClick={() => setConfirmReset(true)} className="w-full text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"><Trash2 size={12} className="inline mr-1" />Reset Selected ({selectedCount})</button>
        ) : (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">Type <span className="font-mono text-red-400">RESET</span> to confirm</label>
            <input type="text" value={resetText} onChange={e => setResetText(e.target.value)} placeholder="RESET" className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50" />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setConfirmReset(false); setResetText(""); }} className="flex-1 text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300">Cancel</button>
              <button type="button" onClick={handleReset} disabled={resetText !== "RESET"} className="flex-1 text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg bg-red-500 text-black disabled:opacity-40">Confirm Reset</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
