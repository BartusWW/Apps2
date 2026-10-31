import { useMemo, useState } from "react";
import { Check, CheckCircle2, Circle, Minus, Plus, RotateCcw, Repeat2, X } from "lucide-react";
import { useV3Execution } from "../context/V3ExecutionContext";
import { todayISO } from "../lib/dateUtils";

const round = value => Math.round((Number(value) || 0) * 10) / 10;

// First production vertical slice for Core 3.0. Reads always come from v3 when
// executionRead owns the surface; controls are exposed only when executionWrite
// is explicitly enabled, so rollout can still stop at read-only ownership.
export default function V3ExecutionReadView({ date = todayISO(), fields = [] }) {
  const v3 = useV3Execution();
  const [amounts, setAmounts] = useState({});
  const items = useMemo(() => v3.day(date), [v3, v3.revision, date]);
  const summary = useMemo(() => v3.summary(date), [v3, v3.revision, date]);
  const showProgress = !fields.length || fields.includes("progress") || fields.includes("status");
  const ownsWrite = v3.isEnabled("executionWrite");

  const setAmount = (id, value) => setAmounts(prev => ({ ...prev, [id]: Math.max(0, round(value)) }));
  const log = item => {
    const requested = Math.max(0, Number(amounts[item.id]) || 0);
    if (!(requested > 0) || !item.active) return;
    v3.log(item.id, requested);
    setAmounts(prev => ({ ...prev, [item.id]: 0 }));
  };

  return (
    <section className="space-y-2 px-4 py-3" data-testid="v3-execution-read-view">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-widest theme-primary-text font-bold">Daily Execution · Core 3.0</p>
        <p className="text-[10px] text-neutral-500">{summary.completed || 0}/{summary.total || 0}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-neutral-950/40 px-3 py-4 text-xs text-neutral-500">No execution items for today.</div>
      ) : items.map(item => {
        const quantity = item.mode === "quantity";
        const amount = Number(amounts[item.id]) || 0;
        return <div key={item.id} className="rounded-xl border border-white/5 bg-neutral-950/45 px-3 py-2.5">
          <div className="flex items-center gap-3">
            <span className={`shrink-0 ${item.complete ? "text-emerald-400" : "text-neutral-500"}`}>{item.complete ? <CheckCircle2 size={16}/> : <Circle size={16}/>}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-semibold text-neutral-100">{item.name || item.actionId}</p>
                {item.secondChance && <RotateCcw size={11} className="shrink-0 text-amber-400"/>}
                {item.recurring && <Repeat2 size={11} className="shrink-0 text-neutral-600"/>}
              </div>
              <p className="text-[9px] uppercase tracking-wide text-neutral-600">{item.kind}{item.secondChance ? " · Second Chance" : ""}</p>
            </div>
            {showProgress && <div className="shrink-0 text-right"><p className="font-mono text-[11px] text-neutral-300">{item.progress}/{item.target}</p>{item.unit && <p className="text-[8px] uppercase text-neutral-600">{item.unit}</p>}</div>}
          </div>
          {ownsWrite && item.active && <div className="mt-2 flex items-center gap-1.5 border-t border-white/5 pt-2">
            {quantity ? <>
              <button onClick={() => setAmount(item.id, Math.max(0, amount - 1))} className="rounded-lg border border-white/10 p-2 text-neutral-400" aria-label={`Decrease ${item.name}`}><Minus size={12}/></button>
              <input type="number" min="0" step="0.1" value={amount || ""} onChange={e => setAmount(item.id, e.target.value)} placeholder={String(item.remaining || 0)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-center font-mono text-xs"/>
              <button onClick={() => setAmount(item.id, amount + 1)} className="rounded-lg border border-white/10 p-2 text-neutral-400" aria-label={`Increase ${item.name}`}><Plus size={12}/></button>
              <button onClick={() => log(item)} disabled={amount <= 0} className="rounded-lg theme-primary-bg px-3 py-2 text-[9px] font-bold uppercase disabled:opacity-30">Log</button>
            </> : <button onClick={() => v3.complete(item.id)} className="flex-1 rounded-lg theme-primary-bg py-2 text-[9px] font-bold uppercase"><Check size={12} className="mr-1 inline"/>Done</button>}
            <button onClick={() => v3.dismiss(item.id, "wont-do")} className="rounded-lg border border-white/10 px-3 py-2 text-[9px] font-bold uppercase text-neutral-500"><X size={12} className="mr-1 inline"/>Won't do</button>
          </div>}
        </div>;
      })}
      <p className="text-[9px] text-neutral-700">{ownsWrite ? "Core 3.0 owns execution reads + writes" : "Core 3.0 read ownership · writes remain on legacy"}</p>
    </section>
  );
}
