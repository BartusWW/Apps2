import { useMemo } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { Download, Trash2, Inbox } from "lucide-react";
import { formatDateShort } from "../lib/dateUtils";

function downloadCSV(entries) {
  const headers = ["id", "date", "time", "category", "actionName", "minutes", "points", "type"];
  const rows = [headers.join(",")];
  for (const e of entries) {
    const row = headers.map((h) => {
      const v = e[h] ?? "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    });
    rows.push(row.join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cbe-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Log() {
  const { entries, deleteEntry, restoreEntry } = useApp();

  const grouped = useMemo(() => {
    const byDate = {};
    for (const e of entries) {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    }
    return Object.entries(byDate).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [entries]);

  const handleDelete = (entry) => {
    deleteEntry(entry.id);
    toast(`Entry removed`, {
      description: `${entry.actionName} (${entry.points > 0 ? "+" : ""}${entry.points})`,
      action: {
        label: "Undo",
        onClick: () => restoreEntry(entry),
      },
      className: "!bg-neutral-900 !border-white/10 !text-white",
    });
  };

  return (
    <div className="space-y-5" data-testid="log-page">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">Log</h1>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadCSV(entries)}
          disabled={entries.length === 0}
          data-testid="export-csv-btn"
          className="flex items-center gap-2 text-xs uppercase font-semibold tracking-widest border border-white/15 rounded-lg px-3 py-2 hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Download size={14} />
          CSV
        </button>
      </header>

      {entries.length === 0 ? (
        <div
          className="border border-dashed border-white/10 rounded-xl p-10 flex flex-col items-center text-center"
          data-testid="log-empty"
        >
          <Inbox size={28} className="text-neutral-600" />
          <p className="mt-3 font-display font-bold uppercase tracking-tight">No entries yet</p>
          <p className="text-xs text-neutral-500 mt-1.5">
            Log your first action from the dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-5" data-testid="log-list">
          {grouped.map(([date, items]) => (
            <section key={date}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
                  {formatDateShort(date)}
                </h2>
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                  {items.length} {items.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <ul className="space-y-1.5">
                {items.map((e) => (
                  <li
                    key={e.id}
                    className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-3"
                    data-testid={`log-entry-${e.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{e.actionName}</p>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
                        {e.time} · {e.category}
                        {e.minutes ? ` · ${e.minutes}m` : ""}
                      </p>
                    </div>
                    <span
                      className={`font-display font-extrabold text-xl tracking-tighter ${
                        e.points >= 0 ? "text-emerald-400" : "text-red-500"
                      }`}
                    >
                      {e.points > 0 ? `+${e.points}` : e.points}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(e)}
                      data-testid={`delete-entry-${e.id}`}
                      className="p-2 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
