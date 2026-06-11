import { useMemo, useState } from "react";

// Compute per-day positive points + minutes for the last `days` days, ending today
function buildDayMap(entries) {
  const map = {};
  for (const e of entries) {
    if (e.type !== "positive") continue;
    if (!map[e.date]) map[e.date] = { points: 0, minutes: 0 };
    map[e.date].points += e.points || 0;
    map[e.date].minutes += e.minutes || 0;
  }
  return map;
}

function intensityClass(value, mode) {
  if (value <= 0) return "bg-neutral-900 border-white/5";
  if (mode === "points") {
    if (value < 10) return "bg-sky-500/20 border-sky-500/30";
    if (value < 25) return "bg-sky-500/40 border-sky-500/50";
    if (value < 50) return "bg-sky-500/65 border-sky-500/70";
    return "bg-sky-400 border-sky-300";
  }
  // minutes
  if (value < 30) return "bg-sky-500/20 border-sky-500/30";
  if (value < 60) return "bg-sky-500/40 border-sky-500/50";
  if (value < 120) return "bg-sky-500/65 border-sky-500/70";
  return "bg-sky-400 border-sky-300";
}

function fmtDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" });
}

export default function Heatmap({ entries, days = 91 }) {
  const [mode, setMode] = useState("points"); // 'points' | 'minutes'

  const { weeks, totals } = useMemo(() => {
    const map = buildDayMap(entries);
    // Anchor: end on this week's Sunday (so today is included). Build weeks Mon..Sun.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Find Sunday of this week (ISO: week ends Sunday)
    const dow = today.getDay(); // 0=Sun .. 6=Sat
    const daysUntilSun = dow === 0 ? 0 : 7 - dow;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysUntilSun);

    // Build a 13-week grid (91 days) ending at endDate
    const cells = [];
    const start = new Date(endDate);
    start.setDate(start.getDate() - (days - 1));

    let totalPoints = 0;
    let totalMinutes = 0;
    let activeDays = 0;

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const data = map[iso] || { points: 0, minutes: 0 };
      const value = mode === "points" ? data.points : data.minutes;
      const isFuture = d > today;
      if (data.points > 0 || data.minutes > 0) {
        totalPoints += data.points;
        totalMinutes += data.minutes;
        if (!isFuture) activeDays += 1;
      }
      cells.push({
        date: iso,
        value,
        points: data.points,
        minutes: data.minutes,
        isFuture,
        isToday: iso === today.toISOString().slice(0, 10),
      });
    }

    // Chunk into columns of 7 (Mon..Sun). Our start is whatever weekday — find its dow.
    const startDow = start.getDay(); // 0=Sun .. 6=Sat
    const startOffset = startDow === 0 ? 6 : startDow - 1; // Mon=0..Sun=6
    const grid = [];
    let col = new Array(7).fill(null);
    let writeIdx = startOffset;
    for (const cell of cells) {
      col[writeIdx] = cell;
      writeIdx += 1;
      if (writeIdx === 7) {
        grid.push(col);
        col = new Array(7).fill(null);
        writeIdx = 0;
      }
    }
    if (col.some((x) => x !== null)) grid.push(col);

    return {
      weeks: grid,
      totals: { points: totalPoints, minutes: totalMinutes, activeDays },
    };
  }, [entries, days, mode]);

  const fmtMinutes = (m) => {
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h === 0) return `${r}m`;
    if (r === 0) return `${h}h`;
    return `${h}h ${r}m`;
  };

  return (
    <section className="bg-neutral-900 border border-white/10 rounded-xl p-5" data-testid="heatmap-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
            90-Day Heatmap
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
            {totals.activeDays} active days · {totals.points} pts ·{" "}
            {fmtMinutes(totals.minutes)}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-950 border border-white/10 rounded-full p-0.5">
          {["points", "minutes"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              data-testid={`heatmap-mode-${m}`}
              className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                mode === m
                  ? "bg-sky-500 text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2 pb-1">
        <div className="flex gap-[3px]" data-testid="heatmap-grid">
          {weeks.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell, ri) => {
                if (!cell) {
                  return <div key={ri} className="h-[14px] w-[14px]" />;
                }
                const cls = cell.isFuture
                  ? "bg-neutral-900/40 border-white/5"
                  : intensityClass(cell.value, mode);
                const ring = cell.isToday ? "ring-1 ring-emerald-400" : "";
                const title = `${fmtDate(cell.date)} · ${cell.points} pts · ${fmtMinutes(cell.minutes)}`;
                return (
                  <div
                    key={ri}
                    title={title}
                    aria-label={title}
                    data-testid={`heatmap-cell-${cell.date}`}
                    className={`h-[14px] w-[14px] rounded-[3px] border ${cls} ${ring}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] uppercase tracking-widest text-neutral-500">
        <span>Less</span>
        <span className="h-2.5 w-2.5 rounded-sm bg-neutral-900 border border-white/5" />
        <span className="h-2.5 w-2.5 rounded-sm bg-sky-500/20 border border-sky-500/30" />
        <span className="h-2.5 w-2.5 rounded-sm bg-sky-500/40 border border-sky-500/50" />
        <span className="h-2.5 w-2.5 rounded-sm bg-sky-500/65 border border-sky-500/70" />
        <span className="h-2.5 w-2.5 rounded-sm bg-sky-400 border border-sky-300" />
        <span>More</span>
      </div>
    </section>
  );
}
