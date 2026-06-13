import { CheckCircle2, Circle, AlertTriangle, Flame } from "lucide-react";

function formatHM(mins) {
  const m = Math.round(Math.max(0, mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

export default function HabitCard({ progress }) {
  const { habit, minutes, goal, pct, status, streaks } = progress;
  const isPositive = habit.type !== "negative";
  const current = streaks?.current || 0;
  const best = streaks?.best || 0;
  const unit = habit.period === "weekly" ? "w" : "d";
  const showBest = best > current && best > 1;

  const statusMap = {
    completed: { label: "Completed", color: "text-emerald-400", bar: "bg-emerald-500", icon: CheckCircle2 },
    "on-track": { label: "On Track", color: "text-emerald-400", bar: "bg-emerald-500", icon: Flame },
    "in-progress": { label: "In Progress", color: "text-sky-400", bar: "bg-sky-500", icon: Circle },
    "not-started": { label: "Not Started", color: "text-neutral-500", bar: "bg-neutral-700", icon: Circle },
    "under-cap": { label: "Under Cap", color: "text-emerald-400", bar: "bg-emerald-500", icon: CheckCircle2 },
    warning: { label: "Approaching Cap", color: "text-amber-400", bar: "bg-amber-500", icon: AlertTriangle },
    exceeded: { label: "Cap Exceeded", color: "text-red-500", bar: "bg-red-500", icon: AlertTriangle },
  };
  const s = statusMap[status] || statusMap["in-progress"];
  const StatusIcon = s.icon;

  return (
    <div
      className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3"
      data-testid={`habit-card-${habit.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{habit.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>
              {habit.period === "weekly" ? "Weekly" : "Daily"} · Goal {formatHM(goal)}
              {habit.categories?.length > 1 ? ` · ${habit.categories.length} cats` : ""}
            </span>
            {isPositive && current > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-amber-400 font-semibold"
                data-testid={`habit-streak-${habit.id}`}
                title={`Current streak: ${current} ${habit.period === "weekly" ? "week(s)" : "day(s)"}`}
              >
                <Flame size={10} strokeWidth={2.5} fill="currentColor" />
                {current}
                {unit}
              </span>
            )}
            {isPositive && showBest && (
              <span
                className="text-neutral-500"
                data-testid={`habit-best-${habit.id}`}
                title={`Best streak: ${best} ${habit.period === "weekly" ? "week(s)" : "day(s)"}`}
              >
                · best {best}{unit}
              </span>
            )}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold ${s.color}`}
        >
          <StatusIcon size={11} />
          {s.label}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <span
            className={`font-display font-extrabold text-2xl tracking-tighter ${
              isPositive ? "text-white" : status === "exceeded" ? "text-red-500" : "text-white"
            }`}
          >
            {formatHM(minutes)}
          </span>
          <span className="text-xs text-neutral-500 ml-1">/ {formatHM(goal)}</span>
        </div>
        <span className={`text-xs font-semibold ${s.color}`}>{pct}%</span>
      </div>

      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${s.bar} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
