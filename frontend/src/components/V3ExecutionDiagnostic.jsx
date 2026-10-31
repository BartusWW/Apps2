import { useMemo } from "react";
import { todayISO } from "../lib/dateUtils";
import { useOptionalV3Execution } from "../context/V3ExecutionContext";

// Temporary migration instrument. This panel is deliberately read-only and can
// be mounted beside legacy Home to verify v3 state before enabling v3 writes.
export default function V3ExecutionDiagnostic({ date = todayISO() }) {
  const v3 = useOptionalV3Execution();
  const model = useMemo(() => {
    if (!v3) return null;
    return { items: v3.day(date), summary: v3.summary(date) };
  }, [v3, v3?.revision, date]);

  if (!v3 || !v3.isEnabled("executionRead")) return null;
  const items = model?.items || [];
  const summary = model?.summary || {};

  return (
    <section className="rounded-2xl border border-red-500/20 bg-neutral-950/80 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black tracking-[0.22em] text-red-400">CBE 3.0 DIAGNOSTIC</div>
          <div className="text-sm font-bold text-white">Execution Core · {date}</div>
        </div>
        <div className="text-xs text-neutral-400">{summary.completed || 0}/{summary.total || 0}</div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-wide">
        <Stat label="Active" value={summary.active || 0}/>
        <Stat label="Done" value={summary.completed || 0}/>
        <Stat label="2nd" value={summary.secondChance || 0}/>
        <Stat label="Hidden" value={(summary.dismissed || 0) + (summary.resolved || 0)}/>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? <div className="text-xs text-neutral-500">No v3 execution items.</div> : items.map(item => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-neutral-100">{item.name || item.actionId}</div>
              <div className="text-[10px] text-neutral-500">{item.kind}{item.secondChance ? " · SECOND CHANCE" : ""}{item.recurring ? " · RECURRING" : ""}</div>
            </div>
            <div className="shrink-0 text-[11px] font-mono text-neutral-300">{item.progress}/{item.target}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return <div className="rounded-lg bg-white/[0.035] px-2 py-2"><div className="font-bold text-neutral-200">{value}</div><div className="text-neutral-600">{label}</div></div>;
}
