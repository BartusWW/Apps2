import { useMemo } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";

/**
 * Chip-style row of recently used categories — last 5 unique.
 * Tapping a chip logs 30 minutes of that category.
 */
export default function RecentlyUsedRow() {
  const { entries, settings, logActivity, deleteEntry } = useApp();

  const recent = useMemo(() => {
    const cats = settings.categories || [];
    const byName = Object.fromEntries(cats.map((c) => [c.name, c]));
    const seen = new Set();
    const out = [];
    for (const e of entries) {
      if (seen.has(e.category)) continue;
      if (!byName[e.category]) continue;
      seen.add(e.category);
      out.push(byName[e.category]);
      if (out.length >= 5) break;
    }
    return out;
  }, [entries, settings.categories]);

  if (recent.length === 0) return null;

  const quickLog = (cat) => {
    const entry = logActivity({
      category: cat.name,
      type: cat.type,
      minutes: 30,
      icon: cat.icon,
    });
    toast(`30m ${cat.name} logged`, {
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
          Tap = +30m
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {recent.map((c) => {
          const Icon = Icons[c.icon] || Icons.Zap;
          const p = paletteFor(c.color || (c.type === "negative" ? "red" : "emerald"));
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => quickLog(c)}
              data-testid={`recent-chip-${c.name}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${p.border} ${p.borderHover} text-xs font-semibold transition-colors`}
            >
              <Icon size={11} strokeWidth={2.5} className={p.text} />
              <span className="text-white">{c.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
