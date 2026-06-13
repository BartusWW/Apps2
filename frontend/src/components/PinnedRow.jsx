import { useMemo } from "react";
import { Pin } from "lucide-react";
import { useApp } from "../context/AppContext";
import CompactActivityCard from "./CompactActivityCard";

/**
 * Pinned actions appear at the top of Home — driven by
 * settings.pinnedActionIds (action ids). Rendered as a 2-column compact grid
 * for minimal scrolling. Order follows the pinnedActionIds array.
 */
export default function PinnedRow() {
  const { settings, actions } = useApp();
  const pinnedIds = settings.pinnedActionIds || [];

  const pinnedActions = useMemo(() => {
    const byId = Object.fromEntries((actions || []).map((a) => [a.id, a]));
    return pinnedIds.map((id) => byId[id]).filter(Boolean);
  }, [pinnedIds, actions]);

  if (pinnedActions.length === 0) return null;

  return (
    <section data-testid="pinned-row" className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Pin size={11} className="text-emerald-400" fill="currentColor" />
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
          Pinned
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5" data-testid="pinned-grid">
        {pinnedActions.map((a) => (
          <CompactActivityCard key={a.id} action={a} />
        ))}
      </div>
    </section>
  );
}
