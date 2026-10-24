export const THEME_PRESETS = {
  performance: { name: "Performance", primary: "#dc2626", secondary: "#7f1d1d", tertiary: "#f97316", background: "#070707", surface: "#121212", intensity: 72, pattern: "none" },
  industrial: { name: "Industrial", primary: "#f59e0b", secondary: "#525252", tertiary: "#d4d4d4", background: "#080808", surface: "#171717", intensity: 58, pattern: "grid" },
  military: { name: "Military", primary: "#7c8b55", secondary: "#4d5a3a", tertiary: "#b59b65", background: "#090b08", surface: "#141811", intensity: 55, pattern: "camo" },
  blue: { name: "Blue", primary: "#2563eb", secondary: "#1e40af", tertiary: "#38bdf8", background: "#06090f", surface: "#101722", intensity: 68, pattern: "none" },
  forest: { name: "Forest", primary: "#3f8f4f", secondary: "#795548", tertiary: "#c7a94b", background: "#070a07", surface: "#111711", intensity: 58, pattern: "none" },
  space: { name: "Space", primary: "#8b5cf6", secondary: "#2563eb", tertiary: "#ef4444", background: "#05050a", surface: "#10101a", intensity: 62, pattern: "nebula" },
  titanium: { name: "Titanium", primary: "#e5e7eb", secondary: "#9ca3af", tertiary: "#52525b", background: "#111214", surface: "#1d1f22", intensity: 48, pattern: "none" },
};

export const DEFAULT_THEME = { preset: "performance", ...THEME_PRESETS.performance };

export function normalizeTheme(theme) {
  return { ...DEFAULT_THEME, ...(theme || {}) };
}

export function themeVars(theme) {
  const t = normalizeTheme(theme);
  const alpha = Math.max(0.2, Math.min(1, Number(t.intensity || 70) / 100));
  return {
    "--theme-primary": t.primary,
    "--theme-secondary": t.secondary,
    "--theme-tertiary": t.tertiary,
    "--theme-bg": t.background,
    "--theme-surface": t.surface,
    "--theme-alpha": alpha,
  };
}
