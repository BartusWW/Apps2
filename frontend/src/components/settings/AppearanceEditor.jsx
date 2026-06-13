import { useApp } from "../../context/AppContext";
import { ChevronUp, ChevronDown, Eye, EyeOff, LayoutGrid } from "lucide-react";

const SECTION_LABELS = {
  carousel: "Main Score (Score / Time)",
  dailyPlan: "Today's Focus",
  search: "Search Bar",
  pinned: "Pinned Activities",
  recent: "Recently Used",
  habits: "Habits",
  build: "Build (Positive Quick Add)",
  eliminate: "Eliminate (Negative Quick Add)",
};

export default function AppearanceEditor() {
  const { settings, setLayoutVisible, moveLayoutItem } = useApp();
  const layout = settings.homeLayout || [];

  return (
    <section data-testid="appearance-editor" className="space-y-3">
      <h2 className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold flex items-center gap-1.5">
        <LayoutGrid size={11} /> Appearance · Home Layout
      </h2>
      <div
        className="bg-neutral-900 border border-white/10 rounded-xl p-3 space-y-1.5"
        data-testid="home-layout-list"
      >
        <p className="text-xs text-neutral-400 px-1 pb-1">
          Toggle visibility and reorder sections on your Home screen.
        </p>
        {layout.map((item, idx) => {
          const label = SECTION_LABELS[item.id] || item.id;
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-neutral-950 border border-white/5"
              data-testid={`layout-row-${item.id}`}
            >
              <button
                type="button"
                onClick={() => setLayoutVisible(item.id, !item.visible)}
                data-testid={`layout-toggle-${item.id}`}
                className={`p-1.5 rounded-md ${
                  item.visible ? "text-emerald-400" : "text-neutral-500"
                } hover:bg-white/5`}
                aria-label={item.visible ? "Hide" : "Show"}
              >
                {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <span className={`text-sm flex-1 ${item.visible ? "text-white" : "text-neutral-500 line-through"}`}>
                {label}
              </span>
              <button
                type="button"
                onClick={() => moveLayoutItem(item.id, -1)}
                disabled={idx === 0}
                data-testid={`layout-up-${item.id}`}
                className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveLayoutItem(item.id, 1)}
                disabled={idx === layout.length - 1}
                data-testid={`layout-down-${item.id}`}
                className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
