import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { Check, ChevronDown, ChevronUp, CirclePlus, Clock3, Flag, RotateCcw, Trash2, X, Zap } from "lucide-react";
import { todayISO } from "../lib/dateUtils";

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function DailyPlanCard({ date }) {
  const { dailyPlans, updateDailyPlan, actions, logActivity } = useApp();
  const d = date || todayISO();
  const plan = dailyPlans[d] || {};
  const items = Array.isArray(plan.items) ? plan.items : [];
  const [actionId, setActionId] = useState("");

  const actionMap = useMemo(() => Object.fromEntries(actions.map((a) => [a.id, a])), [actions]);
  const total = items.reduce((sum, item) => sum + (Number(item.points) || 0), 0);
  const earned = items.filter((item) => item.status === "done").reduce((sum, item) => sum + (Number(item.points) || 0), 0);
  const doneCount = items.filter((item) => item.status === "done").length;

  const saveItems = (next) => updateDailyPlan(d, { items: next });
  const addAction = () => {
    const action = actionMap[actionId];
    if (!action) return;
    saveItems([...items, { id: makeId(), actionId: action.id, name: action.name, category: action.category, subcategory: action.subcategory || null, points: Number(action.points) || 0, minutes: Number(action.minutes) || 0, type: action.type || "positive", status: "planned", frog: items.length === 0, createdAt: new Date().toISOString() }]);
    setActionId("");
  };
  const patchItem = (id, patch) => saveItems(items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const removeItem = (id) => saveItems(items.filter((item) => item.id !== id));
  const setFrog = (id) => saveItems(items.map((item) => ({ ...item, frog: item.id === id })));
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    saveItems(next);
  };
  const markDone = (item) => {
    if (item.status === "done") return;
    logActivity({ actionId: item.actionId, category: item.category, subcategory: item.subcategory, type: item.type || "positive", minutes: item.minutes || 0, points: Number(item.points) || 0, actionName: item.name, date: d });
    patchItem(item.id, { status: "done", completedAt: new Date().toISOString() });
  };
  const delay = (item) => patchItem(item.id, { status: "delayed" });
  const wontDo = (item) => patchItem(item.id, { status: "wont-do" });
  const reset = (item) => patchItem(item.id, { status: "planned", completedAt: null });

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
      <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Add Action</label>
      <div className="flex gap-2">
        <select value={actionId} onChange={(e) => setActionId(e.target.value)} className="min-w-0 flex-1 bg-neutral-950 border theme-tertiary-border rounded-lg px-3 py-2.5 text-sm text-white">
          <option value="">Choose an action…</option>
          {actions.filter((a) => a.type === "positive").map((a) => <option key={a.id} value={a.id}>{a.name} · +{a.points}</option>)}
        </select>
        <button type="button" onClick={addAction} disabled={!actionId} className="shrink-0 rounded-lg px-3 theme-primary-bg text-white disabled:opacity-30" aria-label="Add action"><CirclePlus size={18}/></button>
      </div>
    </div>

    {items.length === 0 ? <div className="bg-neutral-900 border theme-tertiary-border rounded-xl p-6 text-center"><ListEmpty/><p className="text-sm text-neutral-400 mt-2">No actions planned yet.</p><p className="text-xs text-neutral-600 mt-1">Add the work that makes today count.</p></div> : <div className="space-y-2">
      {items.map((item, index) => <PlanItem key={item.id} item={item} index={index} count={items.length} onDone={markDone} onDelay={delay} onWontDo={wontDo} onReset={reset} onDrop={removeItem} onFrog={setFrog} onMove={move}/>) }
    </div>}
  </section>;
}

function Stat({ label, value, accent }) { return <div className="bg-neutral-950 border theme-tertiary-border rounded-lg py-2.5 px-1"><p className="text-[9px] uppercase tracking-widest text-neutral-600">{label}</p><p className={`font-display font-extrabold text-xl mt-0.5 ${accent ? "theme-primary-text" : "text-white"}`}>{value}</p></div>; }

function PlanItem({ item, index, count, onDone, onDelay, onWontDo, onReset, onDrop, onFrog, onMove }) {
  const finished = item.status === "done";
  return <article className={`bg-neutral-900 border rounded-xl overflow-hidden ${item.frog ? "theme-primary-border" : "theme-tertiary-border"}`}>
    <div className="p-3.5 flex gap-3 items-start">
      <button type="button" onClick={() => onFrog(item.id)} className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${item.frog ? "theme-primary-bg theme-primary-border text-white" : "theme-tertiary-border text-neutral-600"}`} title="Set as FROG"><Zap size={15}/></button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2">{item.frog && <span className="text-[9px] uppercase tracking-widest theme-primary-text font-bold">FROG</span>}<Status status={item.status}/></div><h3 className={`text-sm font-semibold mt-1 ${finished ? "text-neutral-500 line-through" : "text-white"}`}>{item.name}</h3><p className="text-[10px] text-neutral-600 mt-1 truncate">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ""}</p></div><span className={`font-display font-extrabold text-lg ${finished ? "text-neutral-600" : "theme-primary-text"}`}>+{item.points}</span></div>
      </div>
    </div>
    <div className="border-t theme-tertiary-border px-3 py-2 flex items-center gap-1.5">
      {finished || item.status !== "planned" ? <button type="button" onClick={() => onReset(item)} className="flex-1 flex items-center justify-center gap-1 rounded-lg border theme-tertiary-border py-2 text-[9px] uppercase tracking-wider text-neutral-400"><RotateCcw size={12}/> Reset</button> : <>
        <button type="button" onClick={() => onDone(item)} className="flex-1 flex items-center justify-center gap-1 rounded-lg theme-primary-bg py-2 text-[9px] uppercase tracking-wider font-bold text-white"><Check size={12}/> Done</button>
        <button type="button" onClick={() => onDelay(item)} className="flex-1 flex items-center justify-center gap-1 rounded-lg border theme-tertiary-border py-2 text-[9px] uppercase tracking-wider text-neutral-300"><Clock3 size={12}/> Delay</button>
        <button type="button" onClick={() => onWontDo(item)} className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-red-500/30 py-2 text-[9px] uppercase tracking-wider text-red-400"><X size={12}/> Won't</button>
      </>}
      <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="p-2 rounded-lg border theme-tertiary-border text-neutral-500 disabled:opacity-20" aria-label="Move up"><ChevronUp size={12}/></button>
      <button type="button" onClick={() => onMove(index, 1)} disabled={index === count - 1} className="p-2 rounded-lg border theme-tertiary-border text-neutral-500 disabled:opacity-20" aria-label="Move down"><ChevronDown size={12}/></button>
      <button type="button" onClick={() => onDrop(item.id)} className="p-2 rounded-lg border theme-tertiary-border text-neutral-600 hover:text-red-400" aria-label="Drop task"><Trash2 size={12}/></button>
    </div>
  </article>;
}

function Status({ status }) { const map = { done: ["DONE", "theme-primary-text"], delayed: ["DELAYED", "text-amber-400"], "wont-do": ["WON'T DO", "text-red-400"], planned: ["PLANNED", "text-neutral-600"] }; const [label, cls] = map[status] || map.planned; return <span className={`text-[9px] uppercase tracking-widest font-bold ${cls}`}>{label}</span>; }
function ListEmpty() { return <Flag size={22} className="mx-auto text-neutral-700"/>; }
