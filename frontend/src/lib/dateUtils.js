// Date helpers — week starts Monday (ISO)
export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function nowTimeHHMM() {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}

// Returns Monday 00:00 of the week containing the given date
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon ...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

export function endOfWeek(date = new Date()) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return e;
}

export function startOfLastWeek(date = new Date()) {
  const s = startOfWeek(date);
  s.setDate(s.getDate() - 7);
  return s;
}

export function isSameDay(dateStr, ref = new Date()) {
  return dateStr === ref.toISOString().slice(0, 10);
}

export function entryDateTime(entry) {
  // Combine date + time into a Date object
  return new Date(`${entry.date}T${entry.time || "00:00"}:00`);
}

export function isInRange(entry, start, end) {
  const t = entryDateTime(entry).getTime();
  return t >= start.getTime() && t < end.getTime();
}

export function formatDateShort(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatWeekRange(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

// Current study streak in days (consecutive days with at least one PT Study entry, ending today or yesterday)
export function calcStudyStreak(entries) {
  const studyDays = new Set(
    entries
      .filter((e) => e.category === "PT Study" && e.type === "positive")
      .map((e) => e.date),
  );
  if (studyDays.size === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Allow streak to start today OR yesterday (so if user hasn't studied today yet, streak still counts)
  const cursor = new Date(today);
  if (!studyDays.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!studyDays.has(cursor.toISOString().slice(0, 10))) return 0;
  }
  while (studyDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
