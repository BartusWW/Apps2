import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import QuickActionButton from "../components/QuickActionButton";
import DashboardCarousel from "../components/DashboardCarousel";
import { Undo2 } from "lucide-react";

export default function Dashboard() {
  const { actions, logAction, deleteEntry } = useApp();

  const positiveActions = actions.filter((a) => a.type === "positive");
  const negativeActions = actions.filter((a) => a.type === "negative");

  const handleClick = (action) => {
    const entry = logAction(action);
    const sign = action.points > 0 ? "+" : "";
    toast(`${action.name} logged`, {
      description: `${sign}${action.points} pts${action.minutes ? ` · ${action.minutes}m` : ""}`,
      action: {
        label: "Undo",
        onClick: () => deleteEntry(entry.id),
      },
      className:
        action.type === "positive"
          ? "!bg-neutral-900 !border-emerald-500/30 !text-white"
          : "!bg-neutral-900 !border-red-500/40 !text-white",
    });
  };

  return (
    <div className="space-y-7" data-testid="dashboard-page">
      {/* Swipeable carousel: Score / Time */}
      <DashboardCarousel />

      {/* Positive actions */}
      <section data-testid="positive-actions-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-extrabold uppercase tracking-tight text-xl">
            Build
          </h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-400 font-semibold">
            + Add points
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {positiveActions.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              onClick={() => handleClick(action)}
              testId={`positive-action-${action.id}`}
            />
          ))}
          {positiveActions.length === 0 && (
            <p className="text-sm text-neutral-500">No positive actions defined. Add some in Settings.</p>
          )}
        </div>
      </section>

      {/* Negative actions */}
      <section data-testid="negative-actions-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-extrabold uppercase tracking-tight text-xl">
            Eliminate
          </h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-red-500 font-semibold">
            – Costs points
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {negativeActions.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              onClick={() => handleClick(action)}
              testId={`negative-action-${action.id}`}
            />
          ))}
          {negativeActions.length === 0 && (
            <p className="text-sm text-neutral-500">No negative actions defined.</p>
          )}
        </div>
      </section>

      {/* Footer caption */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 pt-2">
        <Undo2 size={12} />
        <span>Tap “Undo” in the toast after any action to revert.</span>
      </div>
    </div>
  );
}
