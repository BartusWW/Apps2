import { useMemo } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";

/**
 * Chip-style row of recently used Actions — last 5 unique actions logged.
 * Tap an instant action → logs immediately. Tap a timed action → opens
 * LogModal so the user can pick the actual duration.
 */
export default function RecentlyUsedRow() {
  const { entries, actions, settings, logActivity, deleteEntry, openLogModal } =
    useApp();

  const recent = useMemo(() => {
    const byId = Object.fromEntries((actions || []).map((a) => [a.id, a]));
    const seen = new Set();
    const out = [];
    for (const e of entries) {
      if (!e.actionId) continue;
      if (seen.has(e.actionId)) continue;
      const a = byId[e.actionId];
      if (!a) continue;
      seen.add(e.actionId);
      out.push(a);
      if (out.length >= 5) break;
    }
    return out;
  }, [entries, actions]);

  if (recent.length === 0) return null;

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
    <section data-testid="recently-used" className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
          Recently Used
        </p>
        <span className="text-[10px] uppercase tracking-widest text-neutral-600">
          Tap = log
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {recent.map((a) => {
          const cat = (settings.categories || []).find((c) => c.name === a.category);
          const Icon = Icons[a.icon || cat?.icon || "Zap"] || Icons.Zap;
          const colorId = cat?.color || (a.type === "negative" ? "red" : "emerald");
          const p = paletteFor(colorId);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => quickLog(a)}
              data-testid={`recent-chip-${a.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${p.border} ${p.borderHover} text-xs font-semibold transition-colors`}
            >
              <Icon size={11} strokeWidth={2.5} className={p.text} />
              <span className="text-white truncate max-w-[14ch]">{a.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
