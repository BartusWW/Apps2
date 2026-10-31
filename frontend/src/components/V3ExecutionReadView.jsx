import { useMemo } from "react";
import { CheckCircle2, Circle, RotateCcw, Repeat2 } from "lucide-react";
import { useV3Execution } from "../context/V3ExecutionContext";
import { todayISO } from "../lib/dateUtils";

// Read-ownership surface only. It deliberately exposes no execution controls:
// scoring and production writes remain on legacy until the write bridge lands.
export default function V3ExecutionReadView({ date = todayISO(), fields = [] }) {
  const v3 = useV3Execution();
  const items = useMemo(() => v3.day(date), [v3, v3.revision, date]);
  const summary = useMemo(() => v3.summary(date), [v3, v3.revision, date]);
  const showProgress = !fields.length || fields.includes("progress") || fields.includes("status");

  return (
    <section className="space-y-2 px-4 py-3" data-testid="v3-execution-read-view">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-widest theme-primary-text font-bold">Daily Execution · Core 3.0</p>
        <p className="text-[10px] text-neutral-500">{summary.completed || 0}/{summary.total || 0}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-neutral-950/40 px-3 py-4 text-xs text-neutral-500">No execution items for today.</div>
      ) : items.map(item => (
        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-neutral-950/45 px-3 py-2.5">
          <span className="shrink-0 text-neutral-500">{item.complete ? <CheckCircle2 size={16}/> : <Circle size={16}/>}</span>
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
      ))}
      <p className="text-[9px] text-neutral-700">Read ownership only · execution controls remain on legacy during migration.</p>
    </section>
  );
}
