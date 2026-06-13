import { useMemo, useState } from "react";
import { Brain, Search, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

const FILTER_CATS = [
  "All",
  "General",
  "BW Systems",
  "PT Study",
  "Content",
  "Training",
  "Reading",
  "AI Systems",
  "Recovery",
  "Other",
];

export default function BrainDumpManager() {
  const { brainDumps, updateBrainDump, deleteBrainDump } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return brainDumps.filter((b) => {
      if (filter !== "All" && b.category !== filter) return false;
      if (query && !`${b.text} ${b.category}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [brainDumps, q, filter]);

  const startEdit = (b) => {
    setEditId(b.id);
    setEditText(b.text);
  };
  const saveEdit = () => {
    if (!editText.trim()) {
      toast("Note cannot be empty", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    updateBrainDump(editId, { text: editText.trim() });
    setEditId(null);
    toast("Brain dump updated", { className: "!bg-neutral-900 !border-white/10 !text-white" });
  };

  return (
    <section data-testid="brain-dump-manager" className="space-y-3">
      <h2 className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold flex items-center gap-1.5">
        <Brain size={11} /> Brain Dump · {brainDumps.length}
      </h2>

      <div className="bg-neutral-900 border border-white/10 rounded-xl p-3 space-y-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brain dump…"
            data-testid="brain-dump-search"
            className="w-full bg-neutral-950 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTER_CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              data-testid={`brain-dump-filter-${c}`}
              className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                filter === c
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "border-white/15 text-neutral-400 hover:bg-white/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-neutral-500 py-3 text-center">
            {brainDumps.length === 0
              ? "No brain dumps yet. Tap the floating brain icon on any screen."
              : "No matches."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((b) => (
              <li
                key={b.id}
                className="bg-neutral-950 border border-white/10 rounded-lg px-3 py-2.5"
                data-testid={`brain-dump-row-${b.id}`}
              >
                {editId === b.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      data-testid={`brain-dump-edit-${b.id}`}
                      className="w-full bg-neutral-900 border border-white/10 rounded-md px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-md border border-white/15 text-neutral-300"
                      >
                        <X size={11} className="inline mr-0.5" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        data-testid={`brain-dump-save-edit-${b.id}`}
                        className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-md bg-emerald-500 text-black"
                      >
                        <Check size={11} className="inline mr-0.5" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-white whitespace-pre-wrap break-words">{b.text}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                        {b.category} · {b.date}{" "}
                        {b.ts ? `· ${new Date(b.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => startEdit(b)}
                          data-testid={`brain-dump-edit-btn-${b.id}`}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
                          aria-label="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteBrainDump(b.id);
                            toast("Brain dump removed", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
                          }}
                          data-testid={`brain-dump-delete-${b.id}`}
                          className="p-1.5 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                          aria-label="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
