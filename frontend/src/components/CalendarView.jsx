import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import * as Icons from "lucide-react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Sunrise, Moon } from "lucide-react";
import { toast } from "sonner";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  formatMonth,
  formatDateShort,
  isInRange,
  todayISO,
} from "../lib/dateUtils";
import { habitCompletionForDate } from "../lib/habits";
import { computePoints } from "../lib/scoring";

function daysInMonthGrid(anchor) {
  const mStart = startOfMonth(anchor);
  const mEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(mStart);
  const cells = [];
  const cursor = new Date(gridStart);
  // Always render 6 weeks for a stable layout
  for (let i = 0; i < 42; i++) {
    const date = new Date(cursor);
    const iso = date.toISOString().slice(0, 10);
    cells.push({
      date,
      iso,
      inMonth: date >= mStart && date < mEnd,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return { cells, mStart, mEnd };
}

function formatHM(mins) {
  const m = Math.round(Math.max(0, mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

export default function CalendarView() {
  const {
    entries,
    habits,
    settings,
    dailyPlans,
    updateDailyPlan,
    addEntryAt,
    updateEntry,
    deleteEntry,
  } = useApp();

  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const { cells } = useMemo(() => daysInMonthGrid(anchor), [anchor]);

  // Per-day stats (only for visible cells)
  const perDay = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!map[e.date]) map[e.date] = { minutes: 0, points: 0 };
      if (e.type === "positive") map[e.date].minutes += e.minutes || 0;
      map[e.date].points += e.points || 0;
    }
    return map;
  }, [entries]);

  const today = todayISO();

  const dayEntries = useMemo(() => {
    return entries
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [entries, selectedDate]);

  const dayStats = useMemo(() => {
    let positive = 0;
    let negative = 0;
    let minutes = 0;
    const cats = {};
    for (const e of dayEntries) {
      if (e.type === "positive") {
        positive += e.points || 0;
        minutes += e.minutes || 0;
      } else {
        negative += Math.abs(e.points || 0);
      }
      if (!cats[e.category]) cats[e.category] = { minutes: 0, points: 0 };
      cats[e.category].minutes += e.minutes || 0;
      cats[e.category].points += e.points || 0;
    }
    return { positive, negative, net: positive - negative, minutes, cats };
  }, [dayEntries]);

  const dayHabits = useMemo(
    () => habitCompletionForDate(habits, entries, selectedDate),
    [habits, entries, selectedDate],
  );

  const prevMonth = () => {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() - 1);
    setAnchor(d);
  };
  const nextMonth = () => {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() + 1);
    setAnchor(d);
  };

  const plan = dailyPlans[selectedDate] || {};

  return (
    <div className="space-y-5" data-testid="calendar-view">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          data-testid="calendar-prev-month"
          className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-display font-extrabold uppercase tracking-tight text-lg" data-testid="calendar-month-label">
          {formatMonth(anchor)}
        </p>
        <button
          type="button"
          onClick={nextMonth}
          data-testid="calendar-next-month"
          className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1" data-testid="calendar-grid">
        {cells.map((c) => {
          const stats = perDay[c.iso];
          const minutes = stats?.minutes || 0;
          const net = stats?.points || 0;
          const isToday = c.iso === today;
          const isSelected = c.iso === selectedDate;
          const habit = habitCompletionForDate(habits, entries, c.iso);
          const intensity =
            minutes <= 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4;
          const bgIntensity = [
            "bg-neutral-900",
            "bg-emerald-500/15",
            "bg-emerald-500/30",
            "bg-emerald-500/50",
            "bg-emerald-500/75",
          ][intensity];

          return (
            <button
              key={c.iso}
              type="button"
              onClick={() => setSelectedDate(c.iso)}
              data-testid={`calendar-day-${c.iso}`}
              className={`relative aspect-square rounded-lg p-1 border text-left transition-colors ${
                c.inMonth ? "text-white" : "text-neutral-700"
              } ${
                isSelected
                  ? "border-emerald-400 ring-1 ring-emerald-400/50"
                  : "border-white/5 hover:border-white/15"
              } ${bgIntensity}`}
            >
              <span
                className={`text-[10px] font-semibold ${
                  isToday ? "text-emerald-400" : ""
                }`}
              >
                {c.date.getDate()}
              </span>
              {minutes > 0 && (
                <span className="absolute top-1 right-1 text-[8px] uppercase tracking-widest text-emerald-300 font-semibold">
                  {Math.round(minutes / 60 * 10) / 10}h
                </span>
              )}
              {net !== 0 && (
                <span
                  className={`absolute bottom-1 right-1 text-[8px] font-extrabold tracking-tighter ${
                    net > 0 ? "text-emerald-400" : "text-red-500"
                  }`}
                >
                  {net > 0 ? "+" : ""}
                  {Math.round(net)}
                </span>
              )}
              {habit.total > 0 && (
                <div className="absolute bottom-1 left-1 flex gap-[2px]" aria-hidden>
                  {Array.from({ length: habit.total }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-[3px] w-[3px] rounded-full ${
                        i < habit.completed ? "bg-emerald-400" : "bg-neutral-600"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
        <span>Tap a day to view & edit</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-neutral-900 border border-white/5" />
          <span className="h-2 w-2 rounded-sm bg-emerald-500/15" />
          <span className="h-2 w-2 rounded-sm bg-emerald-500/30" />
          <span className="h-2 w-2 rounded-sm bg-emerald-500/50" />
          <span className="h-2 w-2 rounded-sm bg-emerald-500/75" />
        </span>
      </div>

      {/* Selected day detail */}
      <DayDetail
        date={selectedDate}
        entries={dayEntries}
        stats={dayStats}
        dayHabits={dayHabits}
        plan={plan}
        categories={settings.categories || []}
        onAddEntry={(payload) => addEntryAt({ ...payload, date: selectedDate })}
        onDeleteEntry={(id) => deleteEntry(id)}
        onUpdateEntry={(id, patch) => updateEntry(id, patch)}
        onUpdatePlan={(patch) => updateDailyPlan(selectedDate, patch)}
      />
    </div>
  );
}

function DayDetail({
  date,
  entries,
  stats,
  dayHabits,
  plan,
  categories,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
  onUpdatePlan,
}) {
  const [adding, setAdding] = useState(false);
  const [addCategory, setAddCategory] = useState(categories[0]?.name || "Reading");
  const [addType, setAddType] = useState(categories[0]?.type || "positive");
  const [addMinutes, setAddMinutes] = useState(30);

  const handleAdd = () => {
    const mins = Number(addMinutes) || 0;
    if (mins <= 0) {
      toast("Enter a positive number of minutes", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    const cat = categories.find((c) => c.name === addCategory);
    onAddEntry({
      category: addCategory,
      type: cat?.type || addType,
      minutes: mins,
      icon: cat?.icon,
      actionName: `${mins}m ${addCategory}`,
    });
    toast(`${mins}m ${addCategory} added to ${date}`, {
      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
    });
    setAdding(false);
    setAddMinutes(30);
  };

  return (
    <section className="space-y-4 pt-2" data-testid="day-detail">
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-extrabold uppercase tracking-tight text-base">
              {formatDateShort(date)}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
              {date} · {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding((s) => !s)}
            data-testid="day-add-entry-btn"
            className="flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-1.5 hover:bg-emerald-500/10"
          >
            <Plus size={12} />
            {adding ? "Close" : "Add Entry"}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Dev</p>
            <p className="font-display font-extrabold text-lg tracking-tighter text-emerald-400">
              {formatHM(stats.minutes)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Net</p>
            <p className={`font-display font-extrabold text-lg tracking-tighter ${
              stats.net < 0 ? "text-red-500" : "text-emerald-400"
            }`}>
              {stats.net > 0 ? "+" : ""}{Math.round(stats.net)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Build</p>
            <p className="font-display font-extrabold text-lg tracking-tighter text-emerald-400">
              +{Math.round(stats.positive)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Drain</p>
            <p className="font-display font-extrabold text-lg tracking-tighter text-red-500">
              -{Math.round(stats.negative)}
            </p>
          </div>
        </div>

        {dayHabits.total > 0 && (
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-3 text-center">
            Habits: <span className="text-emerald-400 font-semibold">{dayHabits.completed}/{dayHabits.total}</span> completed
          </p>
        )}
      </div>

      {/* Add entry form */}
      {adding && (
        <div className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-4 space-y-3" data-testid="day-add-entry-form">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
            Add to {date}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={addCategory}
              onChange={(e) => {
                const cat = categories.find((c) => c.name === e.target.value);
                setAddCategory(e.target.value);
                if (cat) setAddType(cat.type);
              }}
              data-testid="day-add-category"
              className="bg-neutral-950 border border-white/10 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={addMinutes}
              onChange={(e) => setAddMinutes(e.target.value)}
              data-testid="day-add-minutes"
              placeholder="minutes"
              className="bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500">
            <span>
              ≈ {(() => {
                const cat = categories.find((c) => c.name === addCategory);
                const t = cat?.type || addType;
                const p = computePoints(addMinutes, t);
                return `${p > 0 ? "+" : ""}${p} pts`;
              })()}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              data-testid="day-add-submit"
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-[10px] uppercase tracking-widest hover:bg-emerald-400"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-1.5" data-testid="day-entries-list">
          {entries.map((e) => (
            <DayEntryRow
              key={e.id}
              entry={e}
              onDelete={() => onDeleteEntry(e.id)}
              onUpdate={(patch) => onUpdateEntry(e.id, patch)}
            />
          ))}
        </div>
      )}

      {/* Daily Plan inline */}
      <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3" data-testid="day-plan">
        <div className="flex items-center gap-1.5">
          <Sunrise size={12} className="text-amber-400" />
          <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
            Morning Focus
          </label>
        </div>
        <input
          type="text"
          value={plan.focus || ""}
          onChange={(e) => onUpdatePlan({ focus: e.target.value })}
          placeholder="Most important task for this day…"
          data-testid="day-plan-focus"
          className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50"
        />
        <div className="flex items-center gap-2 pt-1">
          <Moon size={12} className="text-sky-400" />
          <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
            Completed?
          </label>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => onUpdatePlan({ completed: plan.completed === true ? null : true })}
              data-testid="day-plan-yes"
              className={`px-3 py-1 rounded-lg border text-[10px] uppercase tracking-widest font-semibold ${
                plan.completed === true ? "bg-emerald-500 text-black border-emerald-500" : "border-white/15 text-neutral-300"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onUpdatePlan({ completed: plan.completed === false ? null : false })}
              data-testid="day-plan-no"
              className={`px-3 py-1 rounded-lg border text-[10px] uppercase tracking-widest font-semibold ${
                plan.completed === false ? "bg-red-500 text-black border-red-500" : "border-white/15 text-neutral-300"
              }`}
            >
              No
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DayEntryRow({ entry, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [mins, setMins] = useState(entry.minutes);
  const Icon = Icons[entry.icon] || Icons.Zap;

  const save = () => {
    onUpdate({ minutes: Number(mins) || 0 });
    setEditing(false);
  };

  return (
    <div
      className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-3"
      data-testid={`day-entry-${entry.id}`}
    >
      <span
        className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
          entry.type === "positive" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
        }`}
      >
        <Icon size={14} strokeWidth={2.5} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{entry.category}</p>
        {editing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="number"
              min="0"
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              data-testid={`edit-mins-${entry.id}`}
              className="w-16 bg-neutral-950 border border-white/10 rounded px-2 py-0.5 text-xs text-white"
            />
            <button
              type="button"
              onClick={save}
              data-testid={`save-edit-${entry.id}`}
              className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-emerald-500 text-black"
            >
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-neutral-500">
              <X size={12} />
            </button>
          </div>
        ) : (
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
            {entry.time} · {entry.minutes}m
          </p>
        )}
      </div>
      <span
        className={`font-display font-extrabold text-base tracking-tighter ${
          entry.points >= 0 ? "text-emerald-400" : "text-red-500"
        }`}
      >
        {entry.points > 0 ? `+${Math.round(entry.points)}` : Math.round(entry.points)}
      </span>
      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          data-testid={`edit-entry-${entry.id}`}
          className="p-1.5 rounded-md text-neutral-500 hover:text-emerald-400 hover:bg-white/5"
          aria-label="Edit"
        >
          <Icons.Pencil size={13} />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        data-testid={`delete-day-entry-${entry.id}`}
        className="p-1.5 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
        aria-label="Delete"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
