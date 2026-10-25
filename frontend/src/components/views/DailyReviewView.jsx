import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { CheckCircle2, Clock3, Target, TrendingDown, TrendingUp } from "lucide-react";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(value) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function DailyReviewView() {
  const { entries, dailyPlans } = useApp();
  const key = todayKey();
  const plan = dailyPlans?.[key] || {};

  const stats = useMemo(() => {
    let positive = 0;
    let negative = 0;
    let minutes = 0;
    let count = 0;
    for (const entry of entries) {
      if (!isToday(entry.date)) continue;
      count += 1;
      if (entry.type === "positive") {
        positive += Number(entry.points) || 0;
        minutes += Number(entry.minutes) || 0;
      } else {
        negative += Math.abs(Number(entry.points) || 0);
      }
    }
    return { positive, negative, net: positive - negative, minutes, count };
  }, [entries]);

  const hours = Math.floor(stats.minutes / 60);
  const mins = stats.minutes % 60;
  const timeLabel = hours ? `${hours}h ${mins ? `${mins}m` : ""}`.trim() : `${mins}m`;

  return <div className="space-y-5" data-testid="daily-review-view">
    <header>
      <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">Daily Review</h1>
      <p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">{key} · close the loop</p>
    </header>

    <section className="grid grid-cols-2 gap-3">
      <div className="col-span-2 bg-neutral-900 border border-white/10 rounded-xl p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">Net Points · Today</p>
        <p className={`font-display font-extrabold text-5xl tracking-tighter mt-2 ${stats.net < 0 ? "text-red-500" : stats.net > 0 ? "text-emerald-400" : "text-white"}`}>{stats.net > 0 ? `+${stats.net}` : stats.net}</p>
        <p className="text-xs text-neutral-500 mt-3">{stats.count} {stats.count === 1 ? "entry" : "entries"} logged</p>
      </div>
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
        <Clock3 size={14} className="text-neutral-500" />
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">Dev Time</p>
        <p className="font-display font-extrabold text-3xl tracking-tighter mt-1">{timeLabel}</p>
      </div>
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
        <Target size={14} className="text-neutral-500" />
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">FROG / Focus</p>
        <p className={`font-display font-extrabold text-xl uppercase tracking-tight mt-1 ${plan.completed === true ? "text-emerald-400" : plan.completed === false ? "text-red-500" : "text-neutral-300"}`}>{plan.completed === true ? "Done" : plan.completed === false ? "Missed" : "Open"}</p>
      </div>
    </section>

    <section className="bg-neutral-900 border border-white/10 rounded-xl p-5 space-y-4">
      <h2 className="font-display font-extrabold uppercase tracking-tight text-base">Build vs Drain</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 p-4"><TrendingUp size={14} className="text-emerald-400"/><p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">Build</p><p className="font-display font-extrabold text-3xl text-emerald-400 mt-1">+{stats.positive}</p></div>
        <div className="rounded-xl border border-white/10 p-4"><TrendingDown size={14} className="text-red-500"/><p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">Drain</p><p className="font-display font-extrabold text-3xl text-red-500 mt-1">-{stats.negative}</p></div>
      </div>
    </section>

    <section className="bg-neutral-900 border border-white/10 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={17} className={plan.completed === true ? "text-emerald-400 mt-0.5" : "text-neutral-500 mt-0.5"}/>
        <div><p className="text-[10px] uppercase tracking-widest text-neutral-500">Today’s Focus</p><p className="text-sm text-white mt-1">{plan.focus || "No focus set for today."}</p></div>
      </div>
    </section>
  </div>;
}
