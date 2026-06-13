import { useState } from "react";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { Plus, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { computePoints } from "../lib/scoring";

const PRESETS = [10, 20, 30, 60];

/**
 * Single category quick-add card.
 * Props: category = { name, type: 'positive'|'negative', icon }
 */
export default function QuickAddCard({ category }) {
  const { logActivity, deleteEntry } = useApp();
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const Icon = Icons[category.icon] || Icons.Zap;
  const isPositive = category.type === "positive";

  const accent = isPositive ? "emerald" : "red";
  const iconWrap = isPositive
    ? "bg-emerald-500 text-black"
    : "bg-red-600 text-white";
  const cardBorder = isPositive
    ? "border-emerald-500/20 hover:border-emerald-500/40"
    : "border-red-500/20 hover:border-red-500/40";
  const btnClass = isPositive
    ? "border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/50 text-emerald-300"
    : "border-red-500/30 hover:bg-red-500/15 hover:border-red-500/50 text-red-300";

  const log = (minutes) => {
    const mins = Number(minutes);
    if (!mins || mins <= 0) {
      toast("Enter a positive number of minutes", {
        className: "!bg-neutral-900 !border-red-500/30 !text-white",
      });
      return;
    }
    const entry = logActivity({
      category: category.name,
      type: category.type,
      minutes: mins,
      icon: category.icon,
    });
    const pts = entry.points;
    toast(`${mins}m ${category.name} logged`, {
      description: `${pts > 0 ? "+" : ""}${pts} pts`,
      action: {
        label: "Undo",
        onClick: () => deleteEntry(entry.id),
      },
      className: isPositive
        ? "!bg-neutral-900 !border-emerald-500/30 !text-white"
        : "!bg-neutral-900 !border-red-500/40 !text-white",
    });
    setCustomValue("");
    setCustomOpen(false);
  };

  return (
    <div
      className={`bg-neutral-900 border ${cardBorder} rounded-xl p-4 transition-colors`}
      data-testid={`quick-add-card-${category.name}`}
    >
      <div className="flex items-center gap-3">
        <span className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconWrap}`}>
          <Icon size={18} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{category.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
            {isPositive ? `+20 pts / hr` : `−30 pts / hr`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {PRESETS.map((m) => {
          const pts = computePoints(m, category.type);
          return (
            <button
              key={m}
              type="button"
              onClick={() => log(m)}
              data-testid={`quick-add-${category.name}-${m}`}
              className={`relative flex flex-col items-center justify-center py-2 rounded-lg border bg-transparent transition-colors ${btnClass}`}
            >
              <span className="font-display font-extrabold text-lg leading-none tracking-tighter">
                {m}
              </span>
              <span className="text-[9px] uppercase tracking-widest opacity-60 mt-0.5">
                {pts > 0 ? `+${pts}` : pts}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5">
        {customOpen ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") log(customValue);
                if (e.key === "Escape") setCustomOpen(false);
              }}
              placeholder="min"
              data-testid={`quick-add-${category.name}-custom-input`}
              className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              onClick={() => log(customValue)}
              data-testid={`quick-add-${category.name}-custom-submit`}
              className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-lg ${
                isPositive ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-red-500 text-black hover:bg-red-400"
              }`}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setCustomOpen(false)}
              className="p-1.5 text-neutral-500 hover:text-white"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            data-testid={`quick-add-${category.name}-custom-toggle`}
            className={`w-full flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold py-1.5 rounded-lg border border-dashed border-white/15 text-neutral-400 hover:text-white hover:border-${accent}-500/40`}
          >
            <Plus size={12} /> Custom
          </button>
        )}
      </div>
    </div>
  );
}
