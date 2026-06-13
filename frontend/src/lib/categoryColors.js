// Category color palette + Tailwind class maps. Inheritance: every QuickAddCard /
// HabitCard reads category.color from settings and uses these classes.

export const COLOR_OPTIONS = [
  { id: "emerald", label: "Green", hex: "#10b981" },
  { id: "sky", label: "Blue", hex: "#38bdf8" },
  { id: "violet", label: "Purple", hex: "#a78bfa" },
  { id: "amber", label: "Orange", hex: "#f59e0b" },
  { id: "red", label: "Red", hex: "#ef4444" },
  { id: "yellow", label: "Yellow", hex: "#facc15" },
  { id: "indigo", label: "Indigo", hex: "#6366f1" },
  { id: "neutral", label: "Grey", hex: "#a3a3a3" },
];

// Full Tailwind class set per color. Static lookups so Tailwind purger keeps these.
const PALETTE = {
  emerald: {
    iconBg: "bg-emerald-500 text-black",
    softBg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    borderHover: "hover:border-emerald-500/50",
    presetText: "text-emerald-300",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    solidBtn: "bg-emerald-500 text-black hover:bg-emerald-400",
    dot: "bg-emerald-500",
  },
  sky: {
    iconBg: "bg-sky-500 text-black",
    softBg: "bg-sky-500/15",
    text: "text-sky-400",
    border: "border-sky-500/30",
    borderHover: "hover:border-sky-500/50",
    presetText: "text-sky-300",
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    solidBtn: "bg-sky-500 text-black hover:bg-sky-400",
    dot: "bg-sky-500",
  },
  violet: {
    iconBg: "bg-violet-500 text-white",
    softBg: "bg-violet-500/15",
    text: "text-violet-400",
    border: "border-violet-500/30",
    borderHover: "hover:border-violet-500/50",
    presetText: "text-violet-300",
    chip: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    solidBtn: "bg-violet-500 text-white hover:bg-violet-400",
    dot: "bg-violet-500",
  },
  amber: {
    iconBg: "bg-amber-500 text-black",
    softBg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    borderHover: "hover:border-amber-500/50",
    presetText: "text-amber-300",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    solidBtn: "bg-amber-500 text-black hover:bg-amber-400",
    dot: "bg-amber-500",
  },
  red: {
    iconBg: "bg-red-600 text-white",
    softBg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
    borderHover: "hover:border-red-500/50",
    presetText: "text-red-300",
    chip: "bg-red-500/15 text-red-300 border-red-500/30",
    solidBtn: "bg-red-500 text-black hover:bg-red-400",
    dot: "bg-red-500",
  },
  yellow: {
    iconBg: "bg-yellow-500 text-black",
    softBg: "bg-yellow-500/15",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    borderHover: "hover:border-yellow-500/50",
    presetText: "text-yellow-300",
    chip: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    solidBtn: "bg-yellow-500 text-black hover:bg-yellow-400",
    dot: "bg-yellow-500",
  },
  indigo: {
    iconBg: "bg-indigo-500 text-white",
    softBg: "bg-indigo-500/15",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    borderHover: "hover:border-indigo-500/50",
    presetText: "text-indigo-300",
    chip: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    solidBtn: "bg-indigo-500 text-white hover:bg-indigo-400",
    dot: "bg-indigo-500",
  },
  neutral: {
    iconBg: "bg-neutral-500 text-white",
    softBg: "bg-neutral-500/15",
    text: "text-neutral-300",
    border: "border-neutral-500/30",
    borderHover: "hover:border-neutral-500/50",
    presetText: "text-neutral-300",
    chip: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
    solidBtn: "bg-neutral-500 text-white hover:bg-neutral-400",
    dot: "bg-neutral-500",
  },
};

export function paletteFor(colorId, fallback = "emerald") {
  return PALETTE[colorId] || PALETTE[fallback];
}

// Default color mapping for default categories (used by v2→v3 migration)
export const DEFAULT_CATEGORY_COLORS = {
  "PT Study": "sky",
  "BW Strength Systems": "emerald",
  Content: "violet",
  Reading: "amber",
  "AI / Systems": "indigo",
  Scrolling: "red",
  Gaming: "red",
  "Wasted Time": "red",
};
