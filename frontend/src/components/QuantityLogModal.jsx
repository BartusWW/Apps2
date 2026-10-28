import { useState } from "react";
import { Clock, Hash, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { applyPriorityMultiplier, getSubcategoryPriorityPercent } from "../lib/priorityProfiles";
import { todayISO } from "../lib/dateUtils";
import { ActionLogFields, serializeLogFields } from "./ActionLogFields";

const PRESETS = [10, 20, 30, 60];
const r = (n) => Math.round((Number(n) || 0) * 10) / 10;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function periodBounds(date) {
  const x = new Date(`${date}T12:00:00`);
  const day = x.getDay();
  const monday = new Date(x);
  monday.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
  const month = new Date(x.getFullYear(), x.getMonth(), 1, 12);
  return { week: iso(monday), month: iso(month) };
}

export default function QuantityLogModal({ action, onClose, date, habitBonus = 0, frog: frogProp, onLogged, source }) {
  const { entries, settings, dailyPlans, logActivity, deleteEntry } = useApp();
  const [mode, setMode] = useState("add");
  const [value, setValue] = useState("");
  const [details, setDetails] = useState({});

  if (!action) return null;

  const d = date || todayISO();
  const plannedItem = (dailyPlans?.[d]?.items || []).find((item) => item.actionId === action.id && !item.habit);
  const frog = typeof frogProp === "boolean" ? frogProp : !!plannedItem?.frog;
  const isPerUnit = action.scoringType === "per-unit";
  const unit = action.unit || "unit";
  const labelUnit = isPerUnit ? unit : "min";
  const bounds = periodBounds(d);
  const own = (entries || []).filter((e) => e.actionId === action.id);
  const amount = (list) => r(list.reduce((s, e) => s + (isPerUnit ? Number(e.quantity) || 0 : Number(e.minutes) || 0), 0));
  const today = amount(own.filter((e) => e.date === d));
  const week = amount(own.filter((e) => e.date >= bounds.week && e.date <= d));
  const month = amount(own.filter((e) => e.date >= bounds.month && e.date <= d));
  const raw = Math.max(0, Number(value) || 0);
  const qty = mode === "overall" ? Math.max(0, raw - today) : raw;
  const pct = getSubcategoryPriorityPercent(settings, action.category, action.subcategory);
  const bonusMultiplier = (frog ? 1.1 : 1) * (1 + Number(habitBonus || 0) / 100);
  const basePoints = isPerUnit
    ? qty * (Number(action.pointsPerUnit) || 0)
    : (qty / 30) * (Number(action.points) || 0);
  const pts = r(applyPriorityMultiplier(basePoints, action.category, action.subcategory, settings) * bonusMultiplier);

  const submit = (input = value) => {
    const entered = Math.max(0, Number(input) || 0);
    const toLog = mode === "overall" ? Math.max(0, entered - today) : entered;
    if (toLog <= 0) return;
    const base = isPerUnit
      ? toLog * (Number(action.pointsPerUnit) || 0)
      : (toLog / 30) * (Number(action.points) || 0);
    const points = r(applyPriorityMultiplier(base, action.category, action.subcategory, settings) * bonusMultiplier);
    const e = logActivity({
      actionId: action.id,
      actionName: action.name,
      category: action.category,
      subcategory: action.subcategory,
      type: action.type || "positive",
      minutes: isPerUnit ? 0 : toLog,
      points,
      date: d,
      quantity: isPerUnit ? toLog : undefined,
      unit: isPerUnit ? unit : undefined,
      scoringType: action.scoringType,
      pointsPerUnit: isPerUnit ? Number(action.pointsPerUnit) || 0 : undefined,
      priorityPct: pct,
      frog,
      frogBonusPct: frog ? 10 : 0,
      habitBonusPct: Number(habitBonus) || 0,
      customFields: serializeLogFields(action.logFields, details),
      outputMetric: action.outputMetric || null,
      icon: action.icon,
      source,
    });
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(35);
    toast(`${action.name} logged`, {
      description: `${isPerUnit ? `${toLog} ${unit} · ` : `${toLog} min · `}${e.points > 0 ? "+" : ""}${e.points} CBE`,
      action: { label: "Undo", onClick: () => deleteEntry(e.id) },
    });
    onLogged?.(e, toLog);
    onClose();
  };

  const rateLabel = isPerUnit ? `${action.pointsPerUnit} CBE / ${unit}` : `${action.points || 0} CBE / 30m`;

  return (
    <div className="fixed inset-0 z-[80] bg-black/75 flex items-end sm:items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-neutral-900 border theme-primary-border rounded-2xl p-5 space-y-4">
        <div className="flex justify-between">
          <div>
            <p className="text-[9px] uppercase theme-primary-text">{isPerUnit ? "Variable Action" : "Timed Action"}</p>
            <h3 className="font-display font-extrabold text-xl uppercase">{action.name}</h3>
            <p className="text-xs text-neutral-500">{rateLabel} · today {r(today)} {labelUnit}{frog ? " · FROG +10%" : ""}</p>
          </div>
          <button onClick={onClose}><X size={16} /></button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Today" value={today} unit={labelUnit} />
          <Stat label="Week" value={week} unit={labelUnit} />
          <Stat label="Month" value={month} unit={labelUnit} />
        </div>

        {isPerUnit ? (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("add")} className={`border rounded-lg py-2 text-xs ${mode === "add" ? "theme-primary-border theme-primary-soft" : "theme-tertiary-border"}`}>ADD</button>
            <button onClick={() => setMode("overall")} className={`border rounded-lg py-2 text-xs ${mode === "overall" ? "theme-primary-border theme-primary-soft" : "theme-tertiary-border"}`}>OVERALL TODAY</button>
          </div>
        ) : !action.logFields?.length ? (
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((m) => <button key={m} onClick={() => submit(m)} className="border theme-tertiary-border rounded-lg py-2 text-xs"><b>{m}</b><small className="block text-neutral-500">min</small></button>)}
          </div>
        ) : null}

        <label className="text-[10px] uppercase text-neutral-500">
          {isPerUnit ? <><Hash size={11} className="inline" /> {mode === "add" ? "Add" : "Overall today"} ({unit})</> : <><Clock size={11} className="inline" /> Minutes</>}
          <input autoFocus type="number" step={isPerUnit ? "0.1" : "1"} min="0" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full bg-neutral-950 border theme-tertiary-border rounded-xl px-4 py-3 text-2xl font-display font-bold" />
        </label>

        <ActionLogFields fields={action.logFields || []} value={details} onChange={setDetails} />

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-neutral-950 border theme-tertiary-border rounded-lg p-3"><p className="text-[9px] text-neutral-600 uppercase">Will add</p><p className="font-bold">{r(qty)} {labelUnit}</p></div>
          <div className="bg-neutral-950 border theme-tertiary-border rounded-lg p-3"><p className="text-[9px] text-neutral-600 uppercase">CBE</p><p className="font-bold theme-primary-text">+{pts}</p></div>
        </div>
        <button onClick={() => submit()} disabled={qty <= 0} className="w-full theme-primary-bg rounded-xl py-3 uppercase text-xs font-bold disabled:opacity-30">Log session</button>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return <div className="rounded-lg bg-neutral-950 border theme-tertiary-border p-2 text-center"><p className="text-[8px] uppercase tracking-wider text-neutral-600">{label}</p><p className="text-sm font-display font-extrabold">{r(value)} <span className="text-[9px] text-neutral-500">{unit}</span></p></div>;
}
