import * as Icons from "lucide-react";
import { Zap } from "lucide-react";

export default function QuickActionButton({ action, onClick, testId }) {
  const Icon = Icons[action.icon] || Zap;
  const isPositive = action.type === "positive";

  const baseClasses =
    "w-full text-left rounded-xl px-4 py-4 border transition-all duration-150 active:scale-[0.97] flex items-center gap-3";

  const variantClasses = isPositive
    ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/50"
    : "bg-red-500/10 border-red-500/30 hover:bg-red-500/15 hover:border-red-500/50";

  const iconBg = isPositive
    ? "bg-emerald-500 text-black"
    : "bg-red-600 text-white";

  const pointsColor = isPositive ? "text-emerald-400" : "text-red-500";

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`${baseClasses} ${variantClasses}`}
    >
      <span className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={20} strokeWidth={2.5} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-sm text-white leading-tight">
          {action.name}
        </span>
        <span className="block text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
          {action.category}
          {action.minutes ? ` · ${action.minutes}m` : ""}
        </span>
      </span>
      <span className={`font-display font-extrabold text-2xl tracking-tighter ${pointsColor}`}>
        {action.points > 0 ? `+${action.points}` : action.points}
      </span>
    </button>
  );
}
