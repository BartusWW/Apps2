import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import * as Icons from "lucide-react";
import { Search, X, Pin, Brain } from "lucide-react";
import { toast } from "sonner";
import { paletteFor } from "../lib/categoryColors";

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-emerald-500/30 text-emerald-200 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function HomeSearch() {
  const {
    settings,
    actions,
    habits,
    brainDumps,
    logActivity,
    deleteEntry,
    openLogModal,
  } = useApp();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return null;
    const out = { actions: [], habits: [], brainDumps: [] };
    for (const a of actions || []) {
      const hay = `${a.name} ${a.category || ""}`.toLowerCase();
      if (hay.includes(query)) out.actions.push(a);
    }
    for (const h of habits || []) {
      const hay = `${h.name} ${(h.categories || []).join(" ")}`.toLowerCase();
      if (hay.includes(query)) out.habits.push(h);
    }
    for (const b of brainDumps || []) {
      const hay = `${b.text} ${b.category}`.toLowerCase();
      if (hay.includes(query)) out.brainDumps.push(b);
    }
    return out;
  }, [q, actions, habits, brainDumps]);

  // Quick-log an action. Instant action → log immediately. Timed action →
  // open the LogModal so the user can pick the actual duration.
  const quickLog = (action) => {
    const cat = (settings.categories || []).find((c) => c.name === action.category);
    const isInstant = !Number(action.minutes) || action.minutes <= 0;
    if (!isInstant) {
      openLogModal({ actionId: action.id });
      return;
    }
    const entry = logActivity({
      actionId: action.id,
      actionName: action.name,
      category: action.category,
      type: cat?.type || action.type,
      minutes: 0,
      icon: action.icon,
      points: typeof action.points === "number" ? action.points : 0,
    });
    toast(`${action.name} logged`, {
      description: `${entry.points > 0 ? "+" : ""}${entry.points} pts`,
      action: { label: "Undo", onClick: () => deleteEntry(entry.id) },
      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
    });
  };

  return (
    <section data-testid="home-search" className="space-y-2">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search actions, habits, notes…"
          data-testid="home-search-input"
          className="w-full bg-neutral-900 border border-white/10 rounded-full pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/40"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white"
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {results && (
        <div
          className="bg-neutral-900 border border-white/10 rounded-xl p-3 space-y-3"
          data-testid="search-results"
        >
          {results.actions.length === 0 &&
            results.habits.length === 0 &&
            results.brainDumps.length === 0 && (
              <p className="text-xs text-neutral-500 px-1 py-2">No matches.</p>
            )}

          {results.actions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">
                Actions
              </p>
              <ul className="space-y-1">
                {results.actions.map((a) => {
                  const cat = (settings.categories || []).find(
                    (c) => c.name === a.category,
                  );
                  const Icon = Icons[a.icon || cat?.icon || "Zap"] || Icons.Zap;
                  const colorId =
                    cat?.color || (a.type === "negative" ? "red" : "emerald");
                  const p = paletteFor(colorId);
                  const isInstant = !Number(a.minutes) || a.minutes <= 0;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5"
                      data-testid={`search-result-action-${a.id}`}
                    >
                      <span
                        className={`h-7 w-7 rounded-md flex items-center justify-center ${p.softBg} ${p.text}`}
                      >
                        <Icon size={13} strokeWidth={2.5} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {highlight(a.name, q)}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">
                          {a.category || "Uncategorized"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quickLog(a)}
                        data-testid={`search-log-action-${a.id}`}
                        className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-md ${p.solidBtn}`}
                      >
                        {isInstant ? "Log" : "Log…"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {results.habits.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">
                Habits
              </p>
              <ul className="space-y-1">
                {results.habits.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5"
                    data-testid={`search-result-habit-${h.id}`}
                  >
                    <Pin size={11} className="text-neutral-500" />
                    <span className="text-sm text-white flex-1 truncate">
                      {highlight(h.name, q)}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-neutral-500">
                      {h.period}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.brainDumps.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">
                Brain Dump
              </p>
              <ul className="space-y-1">
                {results.brainDumps.slice(0, 5).map((b) => (
                  <li
                    key={b.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-white/5"
                    data-testid={`search-result-dump-${b.id}`}
                  >
                    <Brain size={11} className="text-emerald-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{highlight(b.text, q)}</p>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
                        {b.category} · {b.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
