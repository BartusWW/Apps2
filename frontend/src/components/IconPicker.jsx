import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Search, X } from "lucide-react";
import { ICON_LIBRARY, POPULAR_ICONS } from "../lib/iconLibrary";

export default function IconPicker({ open, value, onChange, onClose }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return null;
    return ICON_LIBRARY.filter((name) => name.toLowerCase().includes(query));
  }, [q]);

  if (!open) return null;

  const renderGrid = (names, label, testId) => (
    <div>
      {label && (
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1.5">{label}</p>
      )}
      <div className="grid grid-cols-6 gap-1.5" data-testid={testId}>
        {names.map((name) => {
          const Icon = Icons[name] || Icons.Zap;
          const active = value === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                onChange(name);
                onClose();
              }}
              data-testid={`icon-pick-${name}`}
              title={name}
              className={`aspect-square rounded-lg border flex items-center justify-center transition-colors ${
                active
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "border-white/10 text-neutral-300 hover:bg-white/5 hover:border-white/20"
              }`}
            >
              <Icon size={16} strokeWidth={2.5} />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      data-testid="icon-picker-modal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
            Choose Icon
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-testid="icon-picker-close"
            className="p-2 text-neutral-400 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search icons…"
            data-testid="icon-picker-search"
            autoFocus
            className="w-full bg-neutral-950 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {filtered ? (
          filtered.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4 text-center">No icons match.</p>
          ) : (
            renderGrid(filtered, "Matches", "icon-picker-results")
          )
        ) : (
          <>
            {renderGrid(POPULAR_ICONS, "Popular", "icon-picker-popular")}
            {renderGrid(ICON_LIBRARY, "All Icons", "icon-picker-all")}
          </>
        )}
      </div>
    </div>
  );
}
