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

## Backlog
### P1
- PWA install + offline support (manifest + service worker)
- Daily push reminders ("Log your study session")
- Optional cloud sync (Mongo backend) for multi-device users
- Calendar/heatmap of last 90 days (GitHub-style)

### P2
- Custom icon picker in Settings (currently Lucide name string)
- Reorder + favorite actions on Dashboard
- Weekly goals (target points / target hours) with progress ring
- Light theme toggle (currently dark only)
- Share weekly card as PNG (Instagram-friendly)

## Known Limitations
- Pure client-side: data lives in browser; clearing site data wipes everything
- No multi-user / no auth
- Icons must reference valid Lucide component names (defaults to Zap if invalid)
