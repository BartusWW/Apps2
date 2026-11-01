export const THEME_PRESETS = {
  performance: { name: "Performance", primary: "#dc2626", secondary: "#7f1d1d", tertiary: "#f97316", background: "#070707", surface: "#121212", intensity: 72, blockIntensity: 48, backgroundBrightness: 34, pattern: "performance" },
  industrial: { name: "Industrial", primary: "#f59e0b", secondary: "#525252", tertiary: "#d4d4d4", background: "#080808", surface: "#171717", intensity: 58, blockIntensity: 38, backgroundBrightness: 38, pattern: "grid" },
  military: { name: "Military", primary: "#7c8b55", secondary: "#4d5a3a", tertiary: "#b59b65", background: "#090b08", surface: "#141811", intensity: 55, blockIntensity: 42, backgroundBrightness: 34, pattern: "camo" },
  blue: { name: "Blue", primary: "#2563eb", secondary: "#1e40af", tertiary: "#38bdf8", background: "#06090f", surface: "#101722", intensity: 68, blockIntensity: 44, backgroundBrightness: 36, pattern: "none" },
  forest: { name: "Forest", primary: "#3f8f4f", secondary: "#795548", tertiary: "#c7a94b", background: "#070a07", surface: "#111711", intensity: 58, blockIntensity: 40, backgroundBrightness: 35, pattern: "none" },
  space: { name: "Space", primary: "#8b5cf6", secondary: "#2563eb", tertiary: "#ef4444", background: "#05050a", surface: "#10101a", intensity: 62, blockIntensity: 42, backgroundBrightness: 62, pattern: "nebula" },
  titanium: { name: "Titanium", primary: "#e5e7eb", secondary: "#9ca3af", tertiary: "#52525b", background: "#111214", surface: "#1d1f22", intensity: 48, blockIntensity: 28, backgroundBrightness: 55, pattern: "none" },
};

export const DEFAULT_THEME = { preset: "performance", ...THEME_PRESETS.performance };
export const PATTERNS = [
  { id: "none", name: "None" },
  { id: "performance", name: "High Performance" },
  { id: "grid", name: "Industrial Grid" },
  { id: "camo", name: "Dark Night Camo" },
  { id: "nebula", name: "Nebula" },
  { id: "scanlines", name: "Scanlines" },
  { id: "carbon", name: "Carbon" },
];

export function factoryTheme(id) { return THEME_PRESETS[id] ? { preset: id, ...THEME_PRESETS[id] } : null; }
export function normalizeTheme(theme) { return { ...DEFAULT_THEME, ...(theme || {}) }; }
export function isFactoryTheme(theme) {
  const t = normalizeTheme(theme); const base = THEME_PRESETS[t.preset]; if (!base) return false;
  return ["primary","secondary","tertiary","background","surface","intensity","blockIntensity","backgroundBrightness","pattern"].every((k) => t[k] === base[k]);
}
export function themeVars(theme) {
  const t = normalizeTheme(theme);
  const alpha = Math.max(.2, Math.min(1, Number(t.intensity ?? 70) / 100));
  const blockAlpha = Math.max(.1, Math.min(1, Number(t.blockIntensity ?? 45) / 100));
  const bgLevel = Math.max(.12, Math.min(1, Number(t.backgroundBrightness ?? 40) / 100));
  return { "--theme-primary":t.primary, "--theme-secondary":t.secondary, "--theme-tertiary":t.tertiary, "--theme-bg":t.background, "--theme-surface":t.surface, "--theme-alpha":alpha, "--theme-block-alpha":blockAlpha, "--theme-bg-level":bgLevel };
}
