import * as Icons from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";
import CompactActivityCard from "./CompactActivityCard";

/**
 * Collapsible category section. Header shows colored dot/icon, name, count.
 * Body shows compact 2-col grid of CompactActivityCards.
 */
export default function CategorySection({ categoryName, items }) {
  const { settings, toggleCategoryCollapsed } = useApp();
  const collapsed = (settings.collapsedCategories || []).includes(categoryName);

  const cat = (settings.categories || []).find((c) => c.name === categoryName);
  const colorId = cat?.color || "neutral";
  const p = paletteFor(colorId);
  const Icon = cat?.icon ? Icons[cat.icon] : null;

  return (
    <section
      className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden"
      data-testid={`category-section-${categoryName}`}
    >
      <button
        type="button"
        onClick={() => toggleCategoryCollapsed(categoryName)}
        data-testid={`category-toggle-${categoryName}`}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <span className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text}`}>
          {Icon ? <Icon size={13} strokeWidth={2.5} /> : <span className={`h-2 w-2 rounded-full ${p.dot}`} />}
        </span>
        <span className="flex-1 text-left text-sm font-semibold text-white truncate">
          {categoryName}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">
          {items.length}
        </span>
        {collapsed ? (
          <ChevronDown size={15} className="text-neutral-500" />
        ) : (
          <ChevronUp size={15} className="text-neutral-500" />
        )}
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 pt-1">
          {items.length === 0 ? (
            <p className="text-xs text-neutral-500 py-2 text-center">No activities in this category.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5" data-testid={`category-grid-${categoryName}`}>
              {items.map((c) => (
                <CompactActivityCard key={c.name} category={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
