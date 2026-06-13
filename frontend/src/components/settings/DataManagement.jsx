import { useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  exportAllData,
  importAllData,
  resetAllData,
} from "../../lib/storage";
import { localISO } from "../../lib/dateUtils";
import { Download, Upload, Trash2, Database, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function downloadJSON(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cbe-backup-${localISO()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DataManagement() {
  const { reloadFromStorage, entries } = useApp();
  const fileRef = useRef(null);
  const [resetText, setResetText] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const payload = exportAllData();
    downloadJSON(payload);
    toast("Backup downloaded", {
      description: `${entries.length} entries`,
      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
    });
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const confirmed = window.confirm(
        `Import will REPLACE all current data with the contents of "${file.name}". This cannot be undone (consider exporting current data first). Continue?`,
      );
      if (!confirmed) {
        event.target.value = "";
        return;
      }
      importAllData(payload);
      reloadFromStorage();
      toast("Data imported. Reloading…", {
        className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
      });
      setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      toast(`Import failed: ${e.message}`, {
        className: "!bg-neutral-900 !border-red-500/30 !text-white",
      });
    } finally {
      event.target.value = "";
    }
  };

  const handleReset = () => {
    if (resetText !== "RESET") {
      toast("Type RESET (in capitals) to confirm.", {
        className: "!bg-neutral-900 !border-red-500/30 !text-white",
      });
      return;
    }
    resetAllData();
    toast("All data wiped. Reloading…", {
      className: "!bg-neutral-900 !border-red-500/30 !text-white",
    });
    setTimeout(() => window.location.reload(), 700);
  };

  return (
    <section data-testid="data-management" className="space-y-3">
      <h2 className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold flex items-center gap-1.5">
        <Database size={11} /> Data Management
      </h2>

      {/* Export */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3" data-testid="export-card">
        <div className="flex items-center gap-2">
          <Download size={14} className="text-emerald-400" />
          <p className="text-sm font-semibold text-white">Export Backup</p>
        </div>
        <p className="text-xs text-neutral-400">
          Download a complete JSON backup of entries, habits, notes, allocation targets, daily plans, and settings.
        </p>
        <button
          type="button"
          onClick={handleExport}
          data-testid="export-json-btn"
          className="w-full text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
        >
          Export to JSON
        </button>
      </div>

      {/* Import */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3" data-testid="import-card">
        <div className="flex items-center gap-2">
          <Upload size={14} className="text-sky-400" />
          <p className="text-sm font-semibold text-white">Import Backup</p>
        </div>
        <p className="text-xs text-neutral-400">
          Restore from a previously exported <span className="font-mono text-neutral-300">cbe-backup-*.json</span> file.
          You’ll be asked to confirm before existing data is replaced.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          data-testid="import-json-input"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          data-testid="import-json-btn"
          className="w-full text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-lg bg-sky-500 text-black hover:bg-sky-400"
        >
          Choose JSON File
        </button>
      </div>

      {/* Reset */}
      <div className="bg-neutral-900 border border-red-500/30 rounded-xl p-4 space-y-3" data-testid="reset-card">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500" />
          <p className="text-sm font-semibold text-white">Danger Zone — Reset All Data</p>
        </div>
        <p className="text-xs text-neutral-400">
          Permanently delete every entry, habit, note, and setting. There is no undo.
          Export a backup first.
        </p>
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            data-testid="reset-show-btn"
            className="w-full text-xs uppercase tracking-widest font-semibold px-3 py-2.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={12} className="inline mr-1" />
            Reset Everything
          </button>
        ) : (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-500">
              Type <span className="font-mono text-red-400">RESET</span> to confirm
            </label>
            <input
              type="text"
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
              placeholder="RESET"
              data-testid="reset-confirm-input"
              className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  setResetText("");
                }}
                className="flex-1 text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={resetText !== "RESET"}
                data-testid="reset-confirm-btn"
                className="flex-1 text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg bg-red-500 text-black hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
