import * as Icons from "lucide-react";
import { Pin, PinOff, Zap } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";

/**
 * Renders a single loggable ACTION. Actions are containers' children:
 *   Category → Action → Log Entry
 *
 * Behavior:
 *   - Instant action (minutes === 0): click "Log" → entry created immediately.
 *   - Timed action  (minutes  >  0): click "Log" → opens LogModal so the user
 *     enters the actual duration (action.minutes is only the default).
 *
 * Pin toggle still operates on the parent category for backwards compatibility
 * with the existing Pinned section.
 */
export default function CompactActivityCard({ action, showPinToggle = true }) {
  const { openLogModal, settings, togglePinCategory, logActivity, deleteEntry } = useApp();
  if (!action) return null;
  const cat = (settings.categories || []).find((c) => c.name === action.category);
  const Icon = Icons[action.icon || cat?.icon || "Zap"] || Zap;
  const isPositive = (cat?.type || action.type) === "positive";
  const colorId = cat?.color || (isPositive ? "emerald" : "red");
  const p = paletteFor(colorId);
  const isPinned = (settings.pinnedCategories || []).includes(action.category);
  const isInstant = !Number(action.minutes) || action.minutes <= 0;

  const handleLog = () => {
    if (isInstant) {
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
        className: `!bg-neutral-900 !${p.border.replace("/30", "/40")} !text-white`,
      });
    } else {
      openLogModal({ actionId: action.id });
    }
  };

  return (
    <div
      className={`bg-neutral-900 border ${p.border} ${p.borderHover} rounded-xl p-3 flex flex-col gap-2 transition-colors`}
      data-testid={`compact-card-${action.id}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${p.iconBg}`}>
          <Icon size={16} strokeWidth={2.5} />
        </span>
        {showPinToggle && (
          <button
            type="button"
            onClick={() => togglePinCategory(action.category)}
            data-testid={`pin-${action.id}`}
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
        <p className="text-xs font-semibold text-white leading-tight truncate">{action.name}</p>
        <p className="text-[9px] uppercase tracking-widest text-neutral-500 mt-0.5">
          {isInstant
            ? `${(action.points || 0) > 0 ? "+" : ""}${action.points || 0} pts`
            : isPositive
              ? "+20 / hr"
              : "−30 / hr"}
        </p>
      </div>
      <button
        type="button"
        onClick={handleLog}
        data-testid={`log-btn-${action.id}`}
        className={`w-full mt-auto text-[10px] uppercase tracking-widest font-semibold py-1.5 rounded-md ${p.solidBtn}`}
      >
        Log
      </button>
    </div>
  );
}
