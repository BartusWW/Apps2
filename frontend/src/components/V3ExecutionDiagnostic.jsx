import { useMemo } from "react";
import { todayISO } from "../lib/dateUtils";
import { useApp } from "../context/AppContext";
import { useOptionalV3Execution } from "../context/V3ExecutionContext";
import { compareExecutionShadow } from "../core/v3/shadowCompare";

// Temporary migration instrument. Read-only: it compares legacy execution with
// v3 and exposes drift before any production lifecycle ownership is transferred.
export default function V3ExecutionDiagnostic({ date = todayISO() }) {
  const { dailyPlans, actions } = useApp();
  const v3 = useOptionalV3Execution();
  const model = useMemo(() => {
    if (!v3) return null;
    return compareExecutionShadow({ date, dailyPlans, actions, v3State: v3.read() });
  }, [v3, v3?.revision, date, dailyPlans, actions]);

  if (!v3 || !v3.isEnabled("executionRead")) return null;
  const items = model?.v3?.items || [];
  const summary = model?.v3?.summary || {};
  const differences = model?.differences || [];

  return (
    <section className="rounded-2xl border border-red-500/20 bg-neutral-950/80 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black tracking-[0.22em] text-red-400">CBE 3.0 SHADOW</div>
          <div className="text-sm font-bold text-white">Execution Core · {date}</div>
        </div>
        <div className={`rounded-full px-2 py-1 text-[10px] font-black tracking-wide ${model?.match ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {model?.match ? "V2 = V3" : `${differences.length} DRIFT`}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-wide">
        <Stat label="Active" value={summary.active || 0}/>
        <Stat label="Done" value={summary.completed || 0}/>
        <Stat label="2nd" value={summary.secondChance || 0}/>
        <Stat label="Hidden" value={(summary.dismissed || 0) + (summary.resolved || 0)}/>
      </div>
      {differences.length > 0 && <div className="space-y-1 rounded-xl border border-red-500/15 bg-red-500/[0.04] p-2">
        {differences.slice(0, 5).map(diff => <div key={`${diff.type}-${diff.key}`} className="text-[10px] text-red-300"><span className="font-bold uppercase">{diff.type}</span> · {diff.legacy?.actionId || diff.v3?.actionId || diff.key}{diff.fields?.length ? ` · ${diff.fields.join(", ")}` : ""}</div>)}
        {differences.length > 5 && <div className="text-[10px] text-neutral-500">+{differences.length - 5} more</div>}
      </div>}
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
