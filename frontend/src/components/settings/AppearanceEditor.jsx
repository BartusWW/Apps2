import { useApp } from "../../context/AppContext";
import { ChevronUp, ChevronDown, Eye, EyeOff, LayoutGrid, Palette, RotateCcw } from "lucide-react";
import { THEME_PRESETS, DEFAULT_THEME, normalizeTheme } from "../../lib/themes";

const SECTION_LABELS = { carousel: "Main Score (Score / Time)", dailyPlan: "Today's Focus", nextDeadline: "Next Deadline Widget", pinnedGoals: "Pinned Goals", search: "Search Bar", pinned: "Pinned Activities", recent: "Recently Used", habits: "Habits", build: "Build (Positive Quick Add)", eliminate: "Eliminate (Negative Quick Add)" };

function ThemeEditor({ settings, updateSettings }) {
  const theme = normalizeTheme(settings.theme);
  const patch = (next) => updateSettings({ theme: { ...theme, ...next, preset: "custom" } });
  const applyPreset = (id) => updateSettings({ theme: { preset: id, ...THEME_PRESETS[id] } });
  const fields = [["primary", "Primary"], ["secondary", "Secondary"], ["tertiary", "Tertiary"], ["background", "Background"], ["surface", "Cards / Surface"]];
  return <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-4">
    <div><p className="text-sm font-semibold text-white flex items-center gap-2"><Palette size={14} className="theme-primary-text"/>Theme</p><p className="text-xs text-neutral-400 mt-1">Presets are starting points. Change any control and it becomes your Custom theme.</p></div>
    <div className="grid grid-cols-2 gap-2">{Object.entries(THEME_PRESETS).map(([id, p]) => <button key={id} type="button" onClick={() => applyPreset(id)} className={`text-left rounded-lg border p-2.5 transition-colors ${theme.preset === id ? "theme-primary-border theme-primary-soft" : "border-white/10 bg-neutral-950"}`}><div className="flex gap-1.5 mb-2"><span className="w-3 h-3 rounded-full" style={{background:p.primary}}/><span className="w-3 h-3 rounded-full" style={{background:p.secondary}}/><span className="w-3 h-3 rounded-full" style={{background:p.tertiary}}/></div><span className="text-xs font-semibold text-white">{p.name}</span></button>)}</div>
    <div className="grid grid-cols-1 gap-2">{fields.map(([key,label]) => <label key={key} className="flex items-center gap-3 rounded-lg bg-neutral-950 border border-white/5 px-3 py-2"><input type="color" value={theme[key]} onChange={(e)=>patch({[key]:e.target.value})} className="w-8 h-8 bg-transparent border-0 p-0"/><span className="text-xs text-neutral-300 flex-1">{label}</span><code className="text-[10px] text-neutral-500">{theme[key]}</code></label>)}</div>
    <div><div className="flex justify-between text-xs mb-2"><span className="text-neutral-300">Color intensity</span><span className="theme-primary-text font-semibold">{theme.intensity}%</span></div><input type="range" min="20" max="100" step="1" value={theme.intensity} onChange={(e)=>patch({intensity:Number(e.target.value)})} className="w-full theme-range"/></div>
    <div><label className="text-[10px] uppercase tracking-widest text-neutral-500">Background texture</label><select value={theme.pattern || "none"} onChange={(e)=>patch({pattern:e.target.value})} className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"><option value="none">None</option><option value="grid">Industrial grid</option><option value="camo">Dark night camo</option><option value="nebula">Subtle nebula</option></select></div>
    <button type="button" onClick={()=>updateSettings({theme:{...DEFAULT_THEME}})} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white"><RotateCcw size={12}/>Reset to Performance</button>
  </div>;
}

export default function AppearanceEditor() {
  const { settings, updateSettings, setLayoutVisible, moveLayoutItem } = useApp();
  const layout = settings.homeLayout || [];
  return <section data-testid="appearance-editor" className="space-y-3">
    <h2 className="text-[10px] uppercase tracking-[0.18em] theme-primary-text font-semibold flex items-center gap-1.5"><LayoutGrid size={11}/>Appearance</h2>
    <ThemeEditor settings={settings} updateSettings={updateSettings}/>
    <div className="bg-neutral-900 border border-white/10 rounded-xl p-3 space-y-1.5" data-testid="home-layout-list">
      <p className="text-xs text-neutral-400 px-1 pb-1">Toggle visibility and reorder sections on your Home screen.</p>
      {layout.map((item, idx) => { const label = SECTION_LABELS[item.id] || item.id; return <div key={item.id} className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-neutral-950 border border-white/5">
        <button type="button" onClick={()=>setLayoutVisible(item.id,!item.visible)} className={`p-1.5 rounded-md ${item.visible ? "theme-primary-text" : "text-neutral-500"}`}>{item.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button>
        <span className={`text-sm flex-1 ${item.visible?"text-white":"text-neutral-500 line-through"}`}>{label}</span>
        <button type="button" onClick={()=>moveLayoutItem(item.id,-1)} disabled={idx===0} className="p-1.5 text-neutral-400 disabled:opacity-30"><ChevronUp size={14}/></button><button type="button" onClick={()=>moveLayoutItem(item.id,1)} disabled={idx===layout.length-1} className="p-1.5 text-neutral-400 disabled:opacity-30"><ChevronDown size={14}/></button>
      </div>;})}
    </div>
  </section>;
}
