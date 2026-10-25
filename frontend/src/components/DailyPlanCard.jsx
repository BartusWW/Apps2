import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { Check, ChevronDown, ChevronUp, CirclePlus, Clock3, Flag, Lightbulb, RotateCcw, Search, Trash2, X, Zap } from "lucide-react";
import { todayISO } from "../lib/dateUtils";

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

export default function DailyPlanCard({ date }) {
  const { dailyPlans, updateDailyPlan, actions, entries, settings, logActivity } = useApp();
  const d = date || todayISO();
  const plan = dailyPlans[d] || {};
  const items = Array.isArray(plan.items) ? plan.items : [];
  const [actionId, setActionId] = useState("");
  const [search, setSearch] = useState("");
  const [showRecommended, setShowRecommended] = useState(true);

  const actionMap = useMemo(() => Object.fromEntries(actions.map((a) => [a.id, a])), [actions]);
  const positiveActions = useMemo(() => actions.filter((a) => a.type === "positive"), [actions]);
  const activeProfile = useMemo(() => (settings.priorityProfiles || []).find((p) => p.id === settings.activePriorityProfileId) || null, [settings.priorityProfiles, settings.activePriorityProfileId]);
  const profileName = activeProfile?.name || "Balanced";

  const getPriorityPct = (action) => {
    if (!activeProfile) return 100;
    const subKey = `${action.category}::${action.subcategory || ""}`;
    return Number(activeProfile.subcategoryPriorities?.[subKey] ?? activeProfile.categoryPriorities?.[action.category] ?? 100) || 100;
  };
  const profilePoints = (action) => round1((Number(action.points) || 0) * getPriorityPct(action) / 100);
  const itemPoints = (item) => round1((Number(item.points) || 0) * (item.frog ? 1.1 : 1));
  const total = round1(items.reduce((sum, item) => sum + itemPoints(item), 0));
  const earned = round1(items.filter((item) => item.status === "done").reduce((sum, item) => sum + (Number(item.awardedPoints) || itemPoints(item)), 0));
  const doneCount = items.filter((item) => item.status === "done").length;

  const filteredActions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return positiveActions;
    return positiveActions.filter((a) => `${a.name} ${a.category} ${a.subcategory || ""}`.toLowerCase().includes(q));
  }, [positiveActions, search]);

  const recommendations = useMemo(() => {
    const plannedIds = new Set(items.map((i) => i.actionId));
    const now = new Date(`${d}T23:59:59`).getTime();
    return positiveActions.filter((a) => !plannedIds.has(a.id)).map((action) => {
      const related = entries.filter((e) => e.actionId === action.id || (!e.actionId && e.actionName === action.name));
      const last = related.reduce((latest, e) => {
        const ts = new Date(`${e.date || "1970-01-01"}T${e.time || "12:00"}`).getTime();
        return Math.max(latest, Number.isFinite(ts) ? ts : 0);
      }, 0);
      const daysAgo = last ? Math.max(0, Math.floor((now - last) / 86400000)) : null;
      const pts = profilePoints(action);
      const neglect = daysAgo === null ? 1.35 : 1 + Math.min(daysAgo, 14) * 0.025;
      return { action, pts, daysAgo, score: pts * neglect };
    }).sort((a, b) => b.score - a.score).slice(0, 6);
  }, [positiveActions, items, entries, d, activeProfile]);

  const saveItems = (next) => updateDailyPlan(d, { items: next });
  const addActionById = (id) => {
    const action = actionMap[id];
    if (!action) return;
    saveItems([...items, { id: makeId(), actionId: action.id, name: action.name, category: action.category, subcategory: action.subcategory || null, points: profilePoints(action), basePoints: Number(action.points) || 0, priorityPct: getPriorityPct(action), minutes: Number(action.minutes) || 0, type: action.type || "positive", status: "planned", frog: false, createdAt: new Date().toISOString() }]);
    setActionId("");
    setSearch("");
  };
  const addAction = () => addActionById(actionId);
  const patchItem = (id, patch) => saveItems(items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const removeItem = (id) => saveItems(items.filter((item) => item.id !== id));
  const toggleFrog = (id) => saveItems(items.map((item) => item.id === id ? { ...item, frog: !item.frog } : item));
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    saveItems(next);
  };
  const markDone = (item) => {
    if (item.status === "done") return;
    const awardedPoints = itemPoints(item);
    logActivity({ actionId: item.actionId, category: item.category, subcategory: item.subcategory, type: item.type || "positive", minutes: item.minutes || 0, points: awardedPoints, actionName: item.name, date: d });
    patchItem(item.id, { status: "done", awardedPoints, completedAt: new Date().toISOString() });
  };
  const delay = (item) => patchItem(item.id, { status: "delayed" });
  const wontDo = (item) => patchItem(item.id, { status: "wont-do" });
  const reset = (item) => patchItem(item.id, { status: "planned", awardedPoints: null, completedAt: null });

  return <section className="space-y-4" data-testid="daily-plan-card">
    <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">Today's Plan</p><h2 className="font-display font-extrabold uppercase tracking-tight text-xl mt-1">Execute the day</h2></div>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">{d}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <Stat label="Done" value={`${doneCount}/${items.length}`} />
        <Stat label="Earned" value={`+${earned}`} accent />
        <Stat label="Potential" value={`+${total}`} />
      </div>
    </div>

    <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2"><label className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Add Action</label><span className="text-[9px] uppercase tracking-widest theme-primary-text font-semibold">Profile · {profileName}</span></div>
      <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actions, categories…" className="w-full bg-neutral-950 border theme-tertiary-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-neutral-600"/></div>
      {search.trim() && <div className="max-h-48 overflow-y-auto rounded-lg border theme-tertiary-border bg-neutral-950 divide-y divide-white/5">{filteredActions.length ? filteredActions.slice(0, 12).map((a) => <button key={a.id} type="button" onClick={() => addActionById(a.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04]"><div className="min-w-0 flex-1"><p className="text-xs text-white font-medium truncate">{a.name}</p><p className="text-[9px] text-neutral-600 truncate">{a.category}{a.subcategory ? ` · ${a.subcategory}` : ""}</p></div><span className="text-xs theme-primary-text font-bold">+{profilePoints(a)}</span><CirclePlus size={14} className="text-neutral-500"/></button>) : <p className="text-xs text-neutral-600 px-3 py-3">No matching actions.</p>}</div>}
      <div className="flex gap-2">
        <select value={actionId} onChange={(e) => setActionId(e.target.value)} className="min-w-0 flex-1 bg-neutral-950 border theme-tertiary-border rounded-lg px-3 py-2.5 text-sm text-white"><option value="">Or choose an action…</option>{positiveActions.map((a) => <option key={a.id} value={a.id}>{a.name} · +{profilePoints(a)}</option>)}</select>
        <button type="button" onClick={addAction} disabled={!actionId} className="shrink-0 rounded-lg px-3 theme-primary-bg text-white disabled:opacity-30" aria-label="Add action"><CirclePlus size={18}/></button>
      </div>

      <div className="rounded-xl border theme-tertiary-border bg-neutral-950/60 overflow-hidden">
        <button type="button" onClick={() => setShowRecommended((v) => !v)} className="w-full flex items-center gap-2 px-3 py-3 text-left"><Lightbulb size={14} className="theme-primary-text"/><span className="flex-1 text-[10px] uppercase tracking-widest font-bold text-neutral-300">Recommended · {profileName}</span><span className="text-[9px] uppercase tracking-widest text-neutral-600">{recommendations.length} actions</span>{showRecommended ? <ChevronUp size={14} className="text-neutral-500"/> : <ChevronDown size={14} className="text-neutral-500"/>}</button>
        {showRecommended && <div className="border-t theme-tertiary-border p-2 space-y-1.5">{recommendations.length ? recommendations.map(({ action, pts, daysAgo }) => <div key={action.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-neutral-900 px-2.5 py-2"><div className="min-w-0 flex-1"><p className="text-xs text-white font-medium truncate">{action.name}</p><p className="text-[9px] text-neutral-600 truncate">{getPriorityPct(action)}% priority · {daysAgo === null ? "not logged yet" : daysAgo === 0 ? "done today" : `${daysAgo}d since last`}</p></div><span className="text-xs theme-primary-text font-bold">+{pts}</span><button type="button" onClick={() => addActionById(action.id)} className="p-1.5 rounded-md border theme-tertiary-border text-neutral-400 hover:text-white" aria-label={`Add ${action.name}`}><CirclePlus size={13}/></button></div>) : <p className="text-xs text-neutral-600 p-2">Everything recommended is already in today's plan.</p>}</div>}
      </div>
    </div>

    {items.length === 0 ? <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-6 text-center"><ListEmpty/><p className="text-sm text-neutral-400 mt-2">No actions planned yet.</p><p className="text-xs text-neutral-600 mt-1">Add the work that makes today count.</p></div> : <div className="space-y-2">{items.map((item, index) => <PlanItem key={item.id} item={item} displayPoints={itemPoints(item)} index={index} count={items.length} onDone={markDone} onDelay={delay} onWontDo={wontDo} onReset={reset} onDrop={removeItem} onFrog={toggleFrog} onMove={move}/>)}</div>}
  </section>;
}

function Stat({ label, value, accent }) { return <div className="bg-neutral-950 border theme-tertiary-border rounded-lg py-2.5 px-1"><p className="text-[9px] uppercase tracking-widest text-neutral-600">{label}</p><p className={`font-display font-extrabold text-xl mt-0.5 ${accent ? "theme-primary-text" : "text-white"}`}>{value}</p></div>; }

function PlanItem({ item, displayPoints, index, count, onDone, onDelay, onWontDo, onReset, onDrop, onFrog, onMove }) {
  const finished = item.status === "done";
  return <article className={`bg-neutral-900 border rounded-xl overflow-hidden ${item.frog ? "theme-primary-border" : "theme-tertiary-border"}`}>
    <div className="p-3.5 flex gap-3 items-start">
      <button type="button" onClick={() => onFrog(item.id)} className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${item.frog ? "theme-primary-bg theme-primary-border text-white" : "theme-tertiary-border text-neutral-600"}`} title={item.frog ? "Remove FROG" : "Mark as FROG (+10%)"}><Zap size={15}/></button>
      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2">{item.frog && <span className="text-[9px] uppercase tracking-widest theme-primary-text font-bold">FROG +10%</span>}<Status status={item.status}/></div><h3 className={`text-sm font-semibold mt-1 ${finished ? "text-neutral-500 line-through" : "text-white"}`}>{item.name}</h3><p className="text-[10px] text-neutral-600 mt-1 truncate">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ""}{item.priorityPct && item.priorityPct !== 100 ? ` · ${item.priorityPct}% profile` : ""}</p></div><span className={`font-display font-extrabold text-lg ${finished ? "text-neutral-600" : "theme-primary-text"}`}>+{finished && item.awardedPoints != null ? item.awardedPoints : displayPoints}</span></div></div>
    </div>
    <div className="border-t theme-tertiary-border px-3 py-2 flex items-center gap-1.5">
      {finished || item.status !== "planned" ? <button type="button" onClick={() => onReset(item)} className="flex-1 flex items-center justify-center gap-1 rounded-lg border theme-tertiary-border py-2 text-[9px] uppercase tracking-wider text-neutral-400"><RotateCcw size={12}/> Reset</button> : <><button type="button" onClick={() => onDone(item)} className="flex-1 flex items-center justify-center gap-1 rounded-lg theme-primary-bg py-2 text-[9px] uppercase tracking-wider font-bold text-white"><Check size={12}/> Done</button><button type="button" onClick={() => onDelay(item)} className="flex-1 flex items-center justify-center gap-1 rounded-lg border theme-tertiary-border py-2 text-[9px] uppercase tracking-wider text-neutral-300"><Clock3 size={12}/> Delay</button><button type="button" onClick={() => onWontDo(item)} className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-red-500/30 py-2 text-[9px] uppercase tracking-wider text-red-400"><X size={12}/> Won't</button></>}
      <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="p-2 rounded-lg border theme-tertiary-border text-neutral-500 disabled:opacity-20" aria-label="Move up"><ChevronUp size={12}/></button><button type="button" onClick={() => onMove(index, 1)} disabled={index === count - 1} className="p-2 rounded-lg border theme-tertiary-border text-neutral-500 disabled:opacity-20" aria-label="Move down"><ChevronDown size={12}/></button><button type="button" onClick={() => onDrop(item.id)} className="p-2 rounded-lg border theme-tertiary-border text-neutral-600 hover:text-red-400" aria-label="Drop task"><Trash2 size={12}/></button>
    </div>
  </article>;
}

function Status({ status }) { const map = { done: ["DONE", "theme-primary-text"], delayed: ["DELAYED", "text-amber-400"], "wont-do": ["WON'T DO", "text-red-400"], planned: ["PLANNED", "text-neutral-600"] }; const [label, cls] = map[status] || map.planned; return <span className={`text-[9px] uppercase tracking-widest font-bold ${cls}`}>{label}</span>; }
function ListEmpty() { return <Flag size={22} className="mx-auto text-neutral-700"/>; }
