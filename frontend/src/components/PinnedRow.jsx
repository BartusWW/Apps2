import { useMemo } from "react";
import { Pin } from "lucide-react";
import { useApp } from "../context/AppContext";
import QuickAddCard from "./QuickAddCard";

/**
 * Pinned categories appear at the top of Home, in the order the user pinned them.
 */
export default function PinnedRow() {
  const { settings } = useApp();
  const pinnedNames = settings.pinnedCategories || [];
  const cats = settings.categories || [];

  const pinnedCats = useMemo(() => {
    const byName = Object.fromEntries(cats.map((c) => [c.name, c]));
    return pinnedNames.map((n) => byName[n]).filter(Boolean);
  }, [pinnedNames, cats]);

  if (pinnedCats.length === 0) return null;

  return (
    <section data-testid="pinned-row" className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Pin size={11} className="text-emerald-400" fill="currentColor" />
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
          Pinned
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {pinnedCats.map((c) => (
          <QuickAddCard key={c.name} category={c} />
        ))}
      </div>
    </section>
  );
}
