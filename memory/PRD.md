# CBE Life Scoreboard — PRD

## Original Problem Statement
Build a simple web app called "CBE Life Scoreboard" — a personal performance tracker based on Pat Riley's CBE (Core / Build / Eliminate) system from Atomic Habits. One-click logging of positive (development) and negative (distraction) actions, daily and weekly score tracking, premium dark mobile-first dashboard. Pure localStorage MVP, no backend.

## User Choices (Feb 2026)
- Persistence: pure localStorage (no backend)
- Charts: Tailwind progress bars only (no Recharts)
- Week starts Monday (ISO)
- Design vibe: Whoop / Strava (athletic, performance-focused, tactical command center)

## Architecture
- React 19 + React Router 7 + Tailwind 3
- Context + useReducer pattern via `AppContext` (single source of truth)
- Persistence: `localStorage` keys `cbe.entries.v1`, `cbe.actions.v1`
- Sonner for toasts with Undo
- Lucide icons; Barlow Condensed (display) + Inter (body)
- Mobile-first `max-w-md` container + bottom navigation

## User Persona
A driven individual (coach/athlete) who already trains and works automatically, but wants to track and reinforce deliberate development habits (study, content, reading, AI/systems) and surface negative distractions (scrolling, gaming, late-night phone use) without feeling punished.

## Core Requirements (static)
1. One-click positive + negative action buttons
2. Today / Weekly score and weekly development hours
3. Study streak (consecutive days with PT Study entries)
4. Best positive category / Top negative drain (weekly)
5. Log with date grouping, delete, CSV export
6. Weekly Review with positive vs negative + category progress bars + week-over-week compare
7. Settings to add / edit / delete / classify actions
8. Toast confirmation + Undo on every mutation
9. Automatic daily reset (date-based) and Monday-based weekly reset

## Implemented (2026-02-11)
- Dashboard with hero today-score card, 4 stat tiles, full positive + negative button stacks (10 default actions)
- Log page grouped by date, per-entry delete with working Undo, CSV export
- Weekly Review with Net / Hours / Build-vs-Drain top cards, positive-vs-negative bars, category breakdown bars, 3-column compare card with delta arrows
- Settings: add / edit / delete actions with auto sign-correction (positive/negative)
- Sonner toast with color-coded borders (emerald/red) and per-action Undo
- LocalStorage persistence across refresh; default action seed on first load
- Whoop-style dark theme: `#0A0A0A` bg, neutral-900 cards, emerald + red accents, Barlow Condensed display numerals
- Mobile-first with bottom-nav (4 tabs) and `max-w-md` container

## Implemented (2026-02-11 — Update 3: Heatmap, Editable Goal, Reminders)
- **90-Day Heatmap** on Review page: GitHub-style grid (7×13) with Points/Minutes mode toggle, sky-tinted intensity buckets, today ring, hover tooltip, legend, and totals summary (active days · points · hours)
- **Weekly Goal editable in Settings** → Preferences section: hours-per-week input + Save; Time view's Weekly Goal card now reads from `settings.weeklyGoalMinutes` (localStorage, default 20h)
- **Daily Reminder**: browser Notifications API integration with On/Off toggle in Preferences and `<input type="time">` picker (default 08:00). `useDailyReminder` hook checks every 60s while app is open; fires once per day if no positive dev entry logged yet (or a "nice, room for one more?" variant if user already logged something). Honors `lastReminderDate` to prevent duplicates. Note: only fires while the app tab is open (no service worker / push backend).
- New context API: `settings` + `updateSettings(patch)`; new storage key `cbe.settings.v1`

## Implemented (2026-02-11 — Update 2: Score/Time Carousel)
- Swipeable Embla carousel at top of Dashboard with two views: SCORE & TIME
- Pill toggle (emerald=Score, sky=Time) + dot indicator both color-shift on active view
- SCORE VIEW: existing today/weekly score, Build vs Drain card (includes streak + dev hours), Best Category, Top Drain
- TIME VIEW: Today's Dev Time, This Week Dev Time, Weekly Goal progress bar (20h default), Top Investment category, Weekly Trend (h+m delta vs last week), Time by Category sky-blue progress bars, "Future Self Investment" comparison card (This Week / Last Week / Delta)
- Time aggregation only counts positive entries with minutes > 0; "Published Post/Reel" (0 min) earns points but not time, validating the requirement that points & time are tracked independently

## Implemented (2026-02-13 — Goal Progress Types V1)
- **Five completion-tracking models** added per goal: `manual` (0-100%), `value` (current/target with unit), `checklist` (drag-edit items, auto-pct from done/total), `hours` (target hours; fills from goal-linked logs), `ongoing` (lifetime/month/week + optional milestones).
- `lib/goalProgress.js` computes a unified `progress` snapshot: `{ type, pct, primary, secondary, isCompletable, ongoing }`.
- **GoalCard** renders a typed progress bar with chip (e.g. "33 / 320 pages · 10%"); Ongoing goals get a 3-tile lifetime/month/week panel + next-milestone preview.
- **Target Reached banner** with one-tap **Complete** appears as soon as a typed goal hits 100% (suppressed for Ongoing).
- **Deadline health** now uses the typed `progress.pct` instead of allocation-based progress — exactly per spec ("Time Consumed % vs Goal Progress %"). Ongoing + deadline-less goals return null health.
- **Migration v6→v7** (non-destructive, idempotent): defaults existing goals to `progressType="hours"` when they have linked activities, else `"manual"`. Seeds all sub-fields with safe defaults. Existing data preserved.
- **GoalForm** now has a Progress Tracking section with type-aware fields: % input, value/target/unit, inline checklist editor with toggles, hours-target input, ongoing weekly/monthly targets + inline milestone editor.
- **Verified live**: schema=7, all 5 progress types created and rendered correctly, allocation/breakdown still works, ongoing goal correctly excluded from completion-prompt flow.

## Implemented (2026-02-13 — Goal Deadlines & Urgency V1)
- **Optional deadline + type** (None / Soft / Hard) on every goal. Form picks a date and type; persisted to `cbe.goals.v1`.
- **Time remaining stats** computed in `lib/goals.js → computeDeadlineStats`: `totalDays`, `daysRemaining`, `timeRemainingPct`, `timeConsumedPct`, `colorBand`. Color bands track % remaining (green 66-100, yellow 33-66, orange 15-33, red 0-15), not absolute days, per spec.
- **Health status** (`computeHealthStatus`) blends goal progress vs time consumed: On Track / At Risk / Critical / Completed. Falls back to alignment status when no deadline is set.
- **`NextDeadlineWidget`** on Home (below Today's Focus) surfaces the nearest deadline with a color-banded urgency bar + health pill + "View All ([n])" link to Review → Goals. Hidden when no goal has a deadline.
- **`UpcomingDeadlines`** section inside Review → Goals lists every deadlined goal sorted by urgency, with priority, days left, % time remaining, and health.
- **Per-goal card customization** — every goal now has:
  - `displayPreset` (Deadline Focus / Time Investment / Balanced / Minimal / Custom) — one-tap pill in form
  - `displayMetrics` — 13 individual on/off toggles for each metric (visible in form under "Customize metrics")
  - `viewMode` (Detailed / Compact) — compact renders as one-line chip; tap to expand
  - GoalCard respects every flag, so two goals can look completely different
- **Completed history** now shows the deadline + days early/late on `CompletedGoalCard` when a deadline existed.
- **Migration v5→v6** (non-destructive): adds the new fields to every existing goal with safe defaults, inserts `nextDeadline` section into existing users' homeLayout.
- **Bug caught + fixed**: pre-existing `daysBetween` (positive-only) collided with new signed version; consolidated into one helper that supports overdue (negative) values.

## Implemented (2026-02-13 — Goals System V1)
- **Goals as a strategic layer** above categories/habits — answers "Did my time go where I intended?"
- New schema key `cbe.goals.v1` + v4→v5 migration (idempotent, non-destructive).
- Goal shape: `{ id, name, icon, color, description, targetAllocation (0-100%), priorityWeight (1-10), status: active|completed|archived, linkedActivities (category names), linkedHabits (habit ids), notes, createdAt, completedAt, finalNotes, hoursAtCompletion, pointsAtCompletion, allocationAtCompletion }`.
- **Review → Goals** (third pill, violet accent) shows:
  - Section 1 — Investment Overview (Active / Completed / Goal Hours / Goal Points / Avg Completion)
  - Section 2 — Goal Allocation horizontal bars (% within goal-linked dev time, summing to 100%)
  - Section 3 + 4 — Alignment + expandable Breakdown per goal card. Twin progress bar overlays target (ghost) vs actual (colored). Status: **Ahead** (>+5%), **On Track** (±5%), **Behind** (<-5%)
  - Section 5 — Timeline (Created · Last Activity · Priority) inside each expanded card
  - Section 6 — Completed Goals history with preserved snapshot (hours/points/duration)
  - Archived section (collapsible) with one-tap Restore + Delete
- **Settings → Goals** has a tab-filtered CRUD list (Active / Completed / Archived) for quick management.
- **Complete Goal modal** captures completion date + final notes and snapshots hours/points/allocation so history is stable even if entries are later edited.
- `lib/goals.js` contains pure computations: `computeGoalStats`, `computeGoalBreakdown`, `alignmentStatus`, `computeGoalsSnapshot`, `buildCompletionSnapshot`, plus `formatHours` and `formatDuration` helpers.
- **Bug fixed during build**: GoalForm useState persisted across modal close/reopen, leaking `linkedActivities` from one creation into the next. Fixed via `key` prop tied to open state → form remounts fresh every open.

## Implemented (2026-02-13 — Drag-and-Drop Category Reorder)
- Replaced the arrows-only sort with `@dnd-kit/sortable` powered drag-and-drop in `CategoriesEditor`. Each row now has a `GripVertical` handle that activates after 6px pointer movement or a 180ms touch hold (prevents accidental drags when tapping the row body).
- Sensors: `PointerSensor` (mouse/pen), `TouchSensor` (mobile-first), `KeyboardSensor` for accessibility. Up/Down arrow buttons are kept as an a11y fallback.
- New context helper `setCategoryOrder(orderedNames)` writes the full ordering atomically; defensively appends any categories missing from the new order.
- Bundle impact: `@dnd-kit/core` + `sortable` + `utilities` (~25kb gzip total).

## Implemented (2026-02-13 — Habit Streaks)
- **Flame badges on Habit cards** for positive habits only (negative streaks intentionally skipped to keep UI minimal).
- `computeHabitStreaks(habit, entries)` in `lib/habits.js`:
  - Buckets entries by day (daily habits) or Monday-anchored week (weekly habits).
  - Counts consecutive periods where minutes ≥ goal, ending at the current period.
  - If the current period hasn't hit goal yet, anchors on the previous period so the streak isn't broken mid-day/mid-week.
  - Also returns the all-time best streak.
- HabitCard renders `🔥 4d` / `🔥 3w` inline next to the period label (amber Flame icon, no actual emoji per design guidelines). Best streak appears as small grey text "· best 7d" **only when best > current and best > 1** — keeps cards quiet when there's nothing new to celebrate.
- Pure derived computation: no schema change, no migration, existing data preserved.

## Implemented (2026-02-13 — V2.2 Dashboard & Settings Upgrade)
- **Global LogModal**: Mounted once in `Layout.jsx`; opens from any CompactActivityCard via `openLogModal(categoryName)` context. Replaces all inline +5/15/30/60 buttons with a single sheet showing 4 presets, custom-minute input, and live-computed points preview.
- **CategorySection grouping**: Dashboard now renders Build and Eliminate as collapsible groups, with a 2-column grid of `CompactActivityCard`s inside. Collapse state persists in `settings.collapsedCategories`.
- **CompactActivityCard**: Single-tap log + inline pin/unpin. Each card honors per-category color/icon.
- **Pinned 2-col grid**: `PinnedRow` now uses `CompactActivityCard` for parity with category sections.
- **Auto "Others" bucket** (P1): Categories with 0 entries in the last 14 days drop into a collapsed-by-default "Others" `CategorySection` at the bottom of the dashboard. Falls back gracefully for brand-new users (no Others until at least one active category exists).
- **Visual IconPicker** wired into `CategoriesEditor`: replaces the free-text Lucide name input with a searchable modal (curated `ICON_LIBRARY` + `POPULAR_ICONS`). Live preview of selected icon + color in the form.
- **Manual category sort**: Up/down arrows per row in `CategoriesEditor` using `moveCategoryOrder`. First/last buttons auto-disable.
- **Data Migration v3→v4** (non-destructive): adds `sortOrder` to every category and an empty `collapsedCategories` array. Fixed a pre-existing broken `migrations.js` (duplicate functions + orphan code) that was preventing compilation.
- Modal z-index bumped to `z-[60]` so LogModal and IconPicker sit cleanly above the bottom-nav.

## Implemented (2026-02-12 — V2.1 Personal Dev OS)
- Per-category color palette + Tailwind class map (`categoryColors.js`)
- Brain Dump floating action button + global note bucket
- Appearance Editor: customize home layout sections (show/hide + reorder)
- Calendar + Heatmap merged into a unified view

## Implemented (2026-02-12 — V2.0 Smart Habits + Data Safety)
- Smart Habits auto-computed from logs (daily/weekly periods, category-based)
- Data export/import JSON in Settings
- Calendar history view with per-day entry list

## Implemented (2026-02-11 — Update 3: Heatmap, Editable Goal, Reminders)
- **90-Day Heatmap** on Review page: GitHub-style grid (7×13) with Points/Minutes mode toggle, sky-tinted intensity buckets, today ring, hover tooltip, legend, and totals summary (active days · points · hours)
- **Weekly Goal editable in Settings** → Preferences section: hours-per-week input + Save; Time view's Weekly Goal card now reads from `settings.weeklyGoalMinutes` (localStorage, default 20h)
- **Daily Reminder**: browser Notifications API integration with On/Off toggle in Preferences and `<input type="time">` picker (default 08:00). `useDailyReminder` hook checks every 60s while app is open; fires once per day if no positive dev entry logged yet (or a "nice, room for one more?" variant if user already logged something). Honors `lastReminderDate` to prevent duplicates. Note: only fires while the app tab is open (no service worker / push backend).
- New context API: `settings` + `updateSettings(patch)`; new storage key `cbe.settings.v1`

## Implemented (2026-02-11 — Update 2: Score/Time Carousel)
- Swipeable Embla carousel at top of Dashboard with two views: SCORE & TIME
- Pill toggle (emerald=Score, sky=Time) + dot indicator both color-shift on active view
- SCORE VIEW: existing today/weekly score, Build vs Drain card (includes streak + dev hours), Best Category, Top Drain
- TIME VIEW: Today's Dev Time, This Week Dev Time, Weekly Goal progress bar (20h default), Top Investment category, Weekly Trend (h+m delta vs last week), Time by Category sky-blue progress bars, "Future Self Investment" comparison card (This Week / Last Week / Delta)
- Time aggregation only counts positive entries with minutes > 0; "Published Post/Reel" (0 min) earns points but not time, validating the requirement that points & time are tracked independently

## Backlog
### P1
- Web Push for reminders (requires backend; deferred)
- Optional cloud sync (Mongo backend) for multi-device users

### P2
- Light theme toggle (currently dark only)
- Share weekly card as PNG (Instagram-friendly)
- Anchor / additional icons in curated library

## Known Limitations
- Pure client-side: data lives in browser; clearing site data wipes everything
- No multi-user / no auth
- Icons restricted to curated `ICON_LIBRARY` (visual picker); type any valid Lucide name still works programmatically if needed
