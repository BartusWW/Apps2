import * as Icons from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../context/AppContext";
import { paletteFor } from "../lib/categoryColors";
import CompactActivityCard from "./CompactActivityCard";

/**
 * Collapsible category section.
 *
 * Props
 *  - categoryName   string  Unique key used for collapse state + testid.
 *  - items          array   Categories to render inside as CompactActivityCard.
 *  - label          string  Optional display title (defaults to categoryName).
 *  - icon           string  Optional Lucide icon name override.
 *  - color          string  Optional palette color override.
 *  - subtitle       string  Optional small caption next to count.
 *  - defaultCollapsed boolean  If true and no user state stored, render collapsed.
 */
export default function CategorySection({
  categoryName,
  items,
  label,
  icon,
  color,
  subtitle,
  defaultCollapsed = false,
}) {
  const { settings, toggleCategoryCollapsed } = useApp();
  const collapsedList = settings.collapsedCategories || [];
  const userToggled = collapsedList.includes(categoryName);
  // defaultCollapsed=false: collapsed only if user has toggled it.
  // defaultCollapsed=true:  collapsed unless user has toggled it.
  const effectiveCollapsed = defaultCollapsed ? !userToggled : userToggled;

  const cat = (settings.categories || []).find((c) => c.name === categoryName);
  const colorId = color || cat?.color || "neutral";
  const p = paletteFor(colorId);
  const iconName = icon || cat?.icon;
  const Icon = iconName ? Icons[iconName] : null;
  const title = label || categoryName;

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
        <span
          className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text}`}
        >
          {Icon ? (
            <Icon size={13} strokeWidth={2.5} />
          ) : (
            <span className={`h-2 w-2 rounded-full ${p.dot}`} />
          )}
        </span>
        <span className="flex-1 text-left text-sm font-semibold text-white truncate">
          {title}
          {subtitle && (
            <span className="ml-2 text-[10px] uppercase tracking-widest text-neutral-500 font-medium">
              {subtitle}
            </span>
          )}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">
          {items.length}
        </span>
        {effectiveCollapsed ? (
          <ChevronDown size={15} className="text-neutral-500" />
        ) : (
          <ChevronUp size={15} className="text-neutral-500" />
        )}
      </button>
      {!effectiveCollapsed && (
        <div className="px-4 pb-4 pt-1">
          {items.length === 0 ? (
            <p className="text-xs text-neutral-500 py-2 text-center">
              No actions in this category.
            </p>
          ) : (
            <div
              className="grid grid-cols-2 gap-2.5"
              data-testid={`category-grid-${categoryName}`}
            >
              {items.map((a) => (
                <CompactActivityCard key={a.id} action={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
