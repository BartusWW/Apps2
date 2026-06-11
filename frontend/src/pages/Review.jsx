import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import ProgressBar from "../components/ProgressBar";
import { startOfWeek, endOfWeek, startOfLastWeek, formatWeekRange, isInRange } from "../lib/dateUtils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

function aggregate(entries, start, end) {
  let positive = 0;
  let negative = 0;
  let minutes = 0;
  const categories = {};
  for (const e of entries) {
    if (!isInRange(e, start, end)) continue;
    if (e.type === "positive") {
      positive += e.points;
      minutes += e.minutes || 0;
    } else {
      negative += Math.abs(e.points);
    }
    if (!categories[e.category]) categories[e.category] = { positive: 0, negative: 0 };
    if (e.type === "positive") categories[e.category].positive += e.points;
    else categories[e.category].negative += Math.abs(e.points);
  }
  return {
    positive,
    negative,
    net: positive - negative,
    hours: minutes / 60,
    categories,
  };
}

function DeltaPill({ delta }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
        <Minus size={12} /> Flat
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        positive ? "text-emerald-400" : "text-red-500"
      }`}
    >
      {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {positive ? "+" : ""}
      {delta}
    </span>
  );
}

export default function Review() {
  const { entries } = useApp();

  const data = useMemo(() => {
    const thisStart = startOfWeek();
    const thisEnd = endOfWeek();
    const lastStart = startOfLastWeek();
    const lastEnd = thisStart;

    const thisWeek = aggregate(entries, thisStart, thisEnd);
    const lastWeek = aggregate(entries, lastStart, lastEnd);

    const allCategories = new Set([
      ...Object.keys(thisWeek.categories),
      ...Object.keys(lastWeek.categories),
    ]);

    const maxCategoryValue = Math.max(
      1,
      ...Array.from(allCategories).map((c) => {
        const t = thisWeek.categories[c] || { positive: 0, negative: 0 };
        return Math.max(t.positive, t.negative);
      }),
    );

    const maxPosNeg = Math.max(1, thisWeek.positive, thisWeek.negative);

    return {
      thisWeek,
      lastWeek,
      allCategories: Array.from(allCategories),
      thisStart,
      maxCategoryValue,
      maxPosNeg,
    };
  }, [entries]);

  const { thisWeek, lastWeek, allCategories, thisStart, maxCategoryValue, maxPosNeg } = data;

  return (
    <div className="space-y-7" data-testid="review-page">
      <header>
        <h1 className="font-display font-extrabold text-3xl uppercase tracking-tight">
          Weekly Review
        </h1>
        <p className="text-xs uppercase tracking-widest text-neutral-500 mt-1">
          {formatWeekRange(thisStart)}
        </p>
      </header>

      {/* Top cards */}
      <section className="grid grid-cols-2 gap-3" data-testid="review-top-cards">
        <div className="col-span-2 bg-neutral-900 border border-white/10 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Net Points · This Week
          </p>
          <div className="flex items-end justify-between gap-4 mt-2">
            <span
              data-testid="review-net-value"
              className={`font-display font-extrabold text-5xl tracking-tighter leading-none ${
                thisWeek.net < 0
                  ? "text-red-500"
                  : thisWeek.net > 0
                    ? "text-emerald-400"
                    : "text-white"
              }`}
            >
              {thisWeek.net > 0 ? `+${thisWeek.net}` : thisWeek.net}
            </span>
            <DeltaPill delta={thisWeek.net - lastWeek.net} />
          </div>
          <p className="text-xs text-neutral-400 mt-3">vs last week: {lastWeek.net}</p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Dev Hours
          </p>
          <p className="font-display font-extrabold text-3xl tracking-tighter text-emerald-400 mt-1.5">
            {thisWeek.hours.toFixed(1)}
            <span className="text-xs text-neutral-500 ml-1 tracking-widest">hrs</span>
          </p>
          <p className="text-[10px] text-neutral-500 mt-2 uppercase tracking-widest">
            Last week: {lastWeek.hours.toFixed(1)} hrs
          </p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
            Build / Drain
          </p>
          <p className="font-display font-extrabold text-3xl tracking-tighter mt-1.5">
            <span className="text-emerald-400">+{thisWeek.positive}</span>
            <span className="text-neutral-600 mx-1">/</span>
            <span className="text-red-500">-{thisWeek.negative}</span>
          </p>
          <p className="text-[10px] text-neutral-500 mt-2 uppercase tracking-widest">
            Last: +{lastWeek.positive} / -{lastWeek.negative}
          </p>
        </div>
      </section>

      {/* Positive vs Negative bars */}
      <section className="bg-neutral-900 border border-white/10 rounded-xl p-5 space-y-4" data-testid="review-posneg">
        <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
          Positive vs Negative
        </h2>
        <ProgressBar
          tone="positive"
          value={thisWeek.positive}
          max={maxPosNeg}
          label="Positive"
          valueLabel={`+${thisWeek.positive}`}
        />
        <ProgressBar
          tone="negative"
          value={thisWeek.negative}
          max={maxPosNeg}
          label="Negative"
          valueLabel={`-${thisWeek.negative}`}
        />
      </section>

      {/* Category breakdown */}
      <section className="bg-neutral-900 border border-white/10 rounded-xl p-5 space-y-4" data-testid="review-categories">
        <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
          Category Breakdown
        </h2>
        {allCategories.length === 0 ? (
          <p className="text-sm text-neutral-500">No entries this week or last.</p>
        ) : (
          <div className="space-y-3.5">
            {allCategories.map((cat) => {
              const t = thisWeek.categories[cat] || { positive: 0, negative: 0 };
              const isNeg = t.negative > t.positive;
              const val = isNeg ? t.negative : t.positive;
              return (
                <ProgressBar
                  key={cat}
                  tone={isNeg ? "negative" : "positive"}
                  value={val}
                  max={maxCategoryValue}
                  label={cat}
                  valueLabel={isNeg ? `-${val}` : `+${val}`}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Compare card */}
      <section className="bg-neutral-900 border border-white/10 rounded-xl p-5" data-testid="review-compare">
        <h2 className="font-display font-extrabold uppercase tracking-tight text-base mb-3">
          This Week vs Last Week
        </h2>
        <div className="grid grid-cols-3 text-center divide-x divide-white/10">
          <div className="px-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Net</p>
            <p className="font-display font-extrabold text-2xl tracking-tighter mt-1">
              {thisWeek.net}
            </p>
            <DeltaPill delta={thisWeek.net - lastWeek.net} />
          </div>
          <div className="px-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Hours</p>
            <p className="font-display font-extrabold text-2xl tracking-tighter mt-1">
              {thisWeek.hours.toFixed(1)}
            </p>
            <DeltaPill
              delta={Math.round((thisWeek.hours - lastWeek.hours) * 10) / 10}
            />
          </div>
          <div className="px-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Build</p>
            <p className="font-display font-extrabold text-2xl tracking-tighter mt-1 text-emerald-400">
              +{thisWeek.positive}
            </p>
            <DeltaPill delta={thisWeek.positive - lastWeek.positive} />
          </div>
        </div>
      </section>
    </div>
  );
}
