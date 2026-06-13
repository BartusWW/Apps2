import * as Icons from "lucide-react";
import { Pin, PinOff, Zap } from "lucide-react";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";

export default function CompactActivityCard({ category, showPinToggle = true }) {
  const { openLogModal, settings, togglePinCategory } = useApp();
  const Icon = Icons[category.icon] || Zap;
  const isPositive = category.type === "positive";
  const colorId = category.color || (isPositive ? "emerald" : "red");
  const p = paletteFor(colorId);
  const isPinned = (settings.pinnedCategories || []).includes(category.name);

  return (
    <div
      className={`bg-neutral-900 border ${p.border} ${p.borderHover} rounded-xl p-3 flex flex-col gap-2 transition-colors`}
      data-testid={`compact-card-${category.name}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg}`}>
          <Icon size={16} strokeWidth={2.5} />
        </span>
        {showPinToggle && (
          <button
            type="button"
            onClick={() => togglePinCategory(category.name)}
            data-testid={`pin-${category.name}`}
            className={`p-1 rounded-md transition-colors ${
              isPinned ? p.text : "text-neutral-600 hover:text-neutral-300"
            }`}
            aria-label={isPinned ? "Unpin" : "Pin"}
          >
            {isPinned ? <Pin size={12} fill="currentColor" /> : <PinOff size={12} />}
          </button>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white leading-tight truncate">{category.name}</p>
        <p className="text-[9px] uppercase tracking-widest text-neutral-500 mt-0.5">
          {isPositive ? "+20 / hr" : "−30 / hr"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => openLogModal(category.name)}
        data-testid={`log-btn-${category.name}`}
        className={`w-full mt-auto text-[10px] uppercase tracking-widest font-semibold py-1.5 rounded-md ${p.solidBtn}`}
      >
        Log
      </button>
    </div>
  );
}
