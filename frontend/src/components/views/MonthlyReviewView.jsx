import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import PieChart, { getCategoryColor } from "../PieChart";
import PeriodNotes from "../PeriodNotes";
import {
  startOfMonth,
  endOfMonth,
  startOfLastMonth,
  monthKey,
  formatMonth,
  weeksInMonth,
  isInRange,
} from "../../lib/dateUtils";
import { TrendingUp, TrendingDown, Minus, Award, Flame, Target as TargetIcon } from "lucide-react";

function aggregateMonth(entries, start, end) {
  let positive = 0;
  let negative = 0;
  let minutes = 0;
  const categoryMinutes = {};
  const categoryPoints = {};
  const negativeByCategory = {};
  const activeDays = new Set();

  for (const e of entries) {
    if (!isInRange(e, start, end)) continue;
    if (e.type === "positive") {
      positive += e.points;
      const m = e.minutes || 0;
      minutes += m;
      categoryMinutes[e.category] = (categoryMinutes[e.category] || 0) + m;
      categoryPoints[e.category] = (categoryPoints[e.category] || 0) + e.points;
      if (m > 0) activeDays.add(e.date);
    } else {
      const abs = Math.abs(e.points);
      negative += abs;
      negativeByCategory[e.category] = (negativeByCategory[e.category] || 0) + abs;
    }
  }
  return {
    positive,
    negative,
    net: positive - negative,
    minutes,
    hours: minutes / 60,
    categoryMinutes,
    categoryPoints,
    negativeByCategory,
    activeDays,
  };
}

function fmtHM(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

function alignmentColor(score) {
  if (score >= 80) return { text: "text-emerald-400", bar: "bg-emerald-500", label: "Aligned" };
  if (score >= 55) return { text: "text-amber-400", bar: "bg-amber-500", label: "Drifting" };
  return { text: "text-red-500", bar: "bg-red-500", label: "Off Target" };
}

function devColor(delta) {
  if (delta > 5) return "text-red-500";
  if (delta < -5) return "text-red-500";
  if (Math.abs(delta) > 2) return "text-amber-400";
  return "text-emerald-400";
}

const MONTHLY_NOTE_FIELDS = [
  { key: "biggestWin", label: "Biggest Win This Month", placeholder: "What made the month worth it?" },
  { key: "biggestLesson", label: "Biggest Lesson", placeholder: "The insight you don't want to forget…" },
  { key: "mainFocus", label: "Main Focus Next Month", placeholder: "One sharp focus area…" },
];

export default function MonthlyReviewView() {
  const { entries, settings, notes, updateMonthlyNote } = useApp();
  const allocationTargets = settings.allocationTargets || {};

  const data = useMemo(() => {
    const mStart = startOfMonth();
    const mEnd = endOfMonth();
    const lastStart = startOfLastMonth();
    const lastEnd = mStart;

    const thisMonth = aggregateMonth(entries, mStart, mEnd);
    const lastMonth = aggregateMonth(entries, lastStart, lastEnd);

    // Total days elapsed this month (today is included)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const elapsedMs = Math.min(today, mEnd) - mStart;
    const daysElapsed = Math.max(1, Math.floor(elapsedMs / 86400000) + 1);
    const avgDailyMin = thisMonth.minutes / daysElapsed;

    // Best/worst categories
    const bestCat = Object.entries(thisMonth.categoryPoints).sort((a, b) => b[1] - a[1])[0];
    const worstCat = Object.entries(thisMonth.negativeByCategory).sort((a, b) => b[1] - a[1])[0];

    // Most consistent week — week with most active days, then most minutes
    const weeks = weeksInMonth();
    const weekStats = weeks.map((w, i) => {
      const agg = aggregateMonth(entries, w.start, w.end);
      return {
        index: i + 1,
        start: w.start,
        end: w.end,
        activeDays: agg.activeDays.size,
        minutes: agg.minutes,
      };
    });
    const consistent = [...weekStats].sort((a, b) => {
      if (b.activeDays !== a.activeDays) return b.activeDays - a.activeDays;
      return b.minutes - a.minutes;
    })[0];

    // Allocation (positive-only minutes)
    const totalMin = Object.values(thisMonth.categoryMinutes).reduce((s, v) => s + v, 0);
    const allocation = Object.entries(thisMonth.categoryMinutes)
      .map(([cat, mins]) => ({
        label: cat,
        value: mins,
        hours: mins / 60,
        pct: totalMin > 0 ? (mins / totalMin) * 100 : 0,
        color: getCategoryColor(cat),
      }))
      .sort((a, b) => b.value - a.value);

    // Planned vs Actual
    const targetCats = Object.keys(allocationTargets).filter((c) => allocationTargets[c] > 0);
    const actualMap = Object.fromEntries(allocation.map((a) => [a.label, a.pct]));
    const allCompareCats = Array.from(new Set([...targetCats, ...allocation.map((a) => a.label)]));
    const planRows = allCompareCats.map((cat) => {
      const target = Number(allocationTargets[cat] || 0);
      const actual = Number(actualMap[cat] || 0);
      return { cat, target, actual, diff: actual - target };
    });

    // Alignment score: 100 - (sum |target-actual|) / 2; falls in [0..100]
    let alignment = null;
    if (targetCats.length > 0) {
      const totalDev = planRows.reduce((s, r) => s + Math.abs(r.diff), 0);
      alignment = Math.max(0, Math.min(100, Math.round(100 - totalDev / 2)));
    }

    return {
      mStart,
      thisMonth,
      lastMonth,
      avgDailyMin,
      bestCat,
      worstCat,
      consistent,
      allocation,
      totalMin,
      planRows,
      alignment,
    };
  }, [entries, allocationTargets]);

  const {
    mStart,
    thisMonth,
    lastMonth,
    avgDailyMin,
    bestCat,
    worstCat,
    consistent,
    allocation,
    totalMin,
    planRows,
    alignment,
  } = data;

  const mKey = monthKey();
  const monthlyNote = notes.monthly[mKey] || {};

  const netDelta = thisMonth.net - lastMonth.net;
  const hoursDelta = thisMonth.hours - lastMonth.hours;

  return (
    <div className="space-y-6" data-testid="monthly-review-view">
      <header>
        <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">
          Monthly Review
        </h1>
        <p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">
          {formatMonth(mStart)}
        </p>
      </header>

      {/* Hero stats */}
      <section className="grid grid-cols-2 gap-3" data-testid="monthly-stats">
        <div className="col-span-2 bg-neutral-900 border border-white/10 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Net Score · This Month
          </p>
          <div className="flex items-end justify-between gap-4 mt-2">
            <span
              data-testid="monthly-net-value"
              className={`font-display font-extrabold text-5xl tracking-tighter leading-none ${
                thisMonth.net < 0 ? "text-red-500" : thisMonth.net > 0 ? "text-emerald-400" : "text-white"
              }`}
            >
              {thisMonth.net > 0 ? `+${thisMonth.net}` : thisMonth.net}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                netDelta > 0 ? "text-emerald-400" : netDelta < 0 ? "text-red-500" : "text-neutral-400"
              }`}
            >
              {netDelta > 0 ? <TrendingUp size={12} /> : netDelta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
              {netDelta > 0 ? "+" : ""}
              {netDelta}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-3">vs last month: {lastMonth.net}</p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Dev Hours
          </p>
          <p className="font-display font-extrabold text-3xl tracking-tighter text-emerald-400 mt-1.5">
            {thisMonth.hours.toFixed(1)}
            <span className="text-xs text-neutral-500 ml-1 tracking-widest">hrs</span>
          </p>
          <p className="text-[10px] text-neutral-500 mt-2 uppercase tracking-widest">
            Last: {lastMonth.hours.toFixed(1)} hrs
          </p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Build / Drain
          </p>
          <p className="font-display font-extrabold text-3xl tracking-tighter mt-1.5">
            <span className="text-emerald-400">+{thisMonth.positive}</span>
            <span className="text-neutral-600 mx-1">/</span>
            <span className="text-red-500">-{thisMonth.negative}</span>
          </p>
          <p className="text-[10px] text-neutral-500 mt-2 uppercase tracking-widest">
            Avg: {fmtHM(avgDailyMin)}/day
          </p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold flex items-center gap-1">
            <Award size={11} className="text-emerald-400" /> Best Category
          </p>
          <p className="font-display font-extrabold text-2xl tracking-tighter text-emerald-400 mt-1.5">
            {bestCat ? `+${bestCat[1]}` : "—"}
          </p>
          <p className="text-xs text-neutral-400 truncate">{bestCat?.[0] || "No activity"}</p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold flex items-center gap-1">
            <Minus size={11} className="text-red-500" /> Biggest Drain
          </p>
          <p
            className={`font-display font-extrabold text-2xl tracking-tighter mt-1.5 ${
              worstCat ? "text-red-500" : "text-white"
            }`}
          >
            {worstCat ? `-${worstCat[1]}` : "—"}
          </p>
          <p className="text-xs text-neutral-400 truncate">{worstCat?.[0] || "Clean month"}</p>
        </div>

        <div className="col-span-2 bg-neutral-900 border border-white/10 rounded-xl p-4" data-testid="most-consistent-week-card">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold flex items-center gap-1">
            <Flame size={11} className="text-emerald-400" /> Most Consistent Week
          </p>
          {consistent && consistent.activeDays > 0 ? (
            <div className="flex items-end justify-between mt-1.5">
              <div>
                <p className="font-display font-extrabold text-2xl tracking-tighter text-white">
                  Week {consistent.index}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
                  {consistent.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-extrabold text-xl tracking-tighter text-emerald-400">
                  {consistent.activeDays}/7
                </p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
                  active · {fmtHM(consistent.minutes)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 mt-1.5">No consistent week yet.</p>
          )}
        </div>
      </section>

      {/* Investment Allocation */}
      <section className="bg-neutral-900 border border-white/10 rounded-xl p-5" data-testid="allocation-section">
        <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
          Investment Allocation
        </h2>
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
          Where the hours actually went
        </p>

        {allocation.length === 0 ? (
          <p className="text-sm text-neutral-500 mt-4">No development time logged this month.</p>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-5">
            <PieChart
              items={allocation.map((a) => ({ label: a.label, value: a.value, color: a.color }))}
              size={180}
              thickness={22}
              centerTop={fmtHM(totalMin)}
              centerBottom="total"
            />
            <ul className="w-full space-y-2" data-testid="allocation-list">
              {allocation.map((a) => (
                <li key={a.label} className="flex items-center gap-3" data-testid={`allocation-row-${a.label}`}>
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ background: a.color }}
                  />
                  <span className="text-sm text-white flex-1 truncate">{a.label}</span>
                  <span className="text-sm text-neutral-300 font-semibold">{fmtHM(a.value)}</span>
                  <span className="text-xs text-neutral-500 font-semibold w-12 text-right">
                    {a.pct.toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Planned vs Actual */}
      <section className="bg-neutral-900 border border-white/10 rounded-xl p-5" data-testid="planned-vs-actual">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
              Planned vs Actual
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
              Set targets in Settings → Allocation
            </p>
          </div>
          {alignment !== null && (
            <div
              className="text-right"
              data-testid="alignment-score"
            >
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Alignment</p>
              <p className={`font-display font-extrabold text-2xl tracking-tighter ${alignmentColor(alignment).text}`}>
                {alignment}%
              </p>
              <p className={`text-[10px] uppercase tracking-widest font-semibold ${alignmentColor(alignment).text}`}>
                {alignmentColor(alignment).label}
              </p>
            </div>
          )}
        </div>

        {planRows.length === 0 || planRows.every((r) => r.target === 0 && r.actual === 0) ? (
          <p className="text-sm text-neutral-500">
            No allocation targets set. Open Settings → Allocation Targets to define your ideal mix.
          </p>
        ) : (
          <div className="space-y-3">
            {alignment !== null && (
              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${alignmentColor(alignment).bar} rounded-full transition-all duration-500`}
                  style={{ width: `${alignment}%` }}
                />
              </div>
            )}
            {planRows.map((row) => {
              const diffColor = devColor(row.diff);
              const max = Math.max(1, row.target, row.actual);
              return (
                <div key={row.cat} className="space-y-1" data-testid={`plan-row-${row.cat}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white truncate">{row.cat}</span>
                    <span className={`text-xs font-semibold ${diffColor}`}>
                      {row.diff > 0 ? "+" : ""}
                      {row.diff.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
                    {/* Actual bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-sky-500/70 rounded-full"
                      style={{ width: `${(row.actual / max) * 100}%` }}
                    />
                    {/* Target marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-emerald-400"
                      style={{ left: `${(row.target / max) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
                    <span>
                      Actual <span className="text-sky-400 font-semibold">{row.actual.toFixed(0)}%</span>
                    </span>
                    <span>
                      Target <span className="text-emerald-400 font-semibold">{row.target}%</span>
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-[10px] uppercase tracking-widest text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 bg-sky-500/70 rounded-sm" /> Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-0.5 bg-emerald-400" /> Target
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Monthly Reflection */}
      <PeriodNotes
        title="Monthly Reflection"
        subtitle={`${formatMonth(mStart)}`}
        fields={MONTHLY_NOTE_FIELDS}
        value={monthlyNote}
        onChange={(patch) => updateMonthlyNote(mKey, patch)}
        testIdPrefix="monthly"
      />
    </div>
  );
}
