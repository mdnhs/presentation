# Project: Project Progress Dashboard (single admin, client-presentation ready)

## Context

I'm building a lightweight, visually striking project-progress dashboard for our project
coordinator. She is the ONLY user (single admin). She presents project progress to clients
in meetings, often by taking screenshots of dashboard sections and pasting them into slides.
So the #1 priority is: beautiful, clean, screenshot-ready visuals. #2 is: fast and lightweight.

## Tech stack (fixed, don't substitute)

- Backend: PocketBase (latest stable) — SQLite, auth, REST API, realtime, admin UI
- Frontend: Svelte 5 (runes) + Vite, plain SPA (no SvelteKit needed)
- Styling: Tailwind CSS (latest)
- Charts: ApexCharts
- Drag & drop: svelte-dnd-action (or a better-maintained Svelte 5 compatible alternative)
- PNG export: html-to-image
- PocketBase JS SDK for API calls
- Deployment: my own VPS ([Ubuntu 24.04]), PocketBase as a systemd service, Caddy in front
  for automatic HTTPS, domain: [dashboard.example.com]

Before writing code, check the current PocketBase docs for: migrations (pb_migrations JS
format), API rule syntax, superusers vs auth collections, and JS hooks (pb_hooks). Its API
has changed across versions — don't rely on memory.

## Data model (create via pb_migrations so the schema is versioned & reproducible)

1. `statuses` — configurable workflow columns
   - name (text, required), color (text, hex), order (number), is_done (bool —
     marks which status counts as "completed")
   - Seed defaults: To-Do (#94A3B8), In-Progress (#3B82F6), Review (#F59E0B),
     Complete (#10B981, is_done=true)
   - Admin can add / rename / recolor / reorder / delete statuses (block deleting a status
     that still has projects — ask to move them first)
2. `projects`
   - name, client (text), description (editor/text), status (relation → statuses),
     progress (number 0–100), priority (select: low/medium/high), start_date, due_date,
     order (number, for ordering within a column), color/tag (optional)
3. `activity_log` — written automatically by a pb_hook whenever a project's status or
   progress changes: project (relation), from_status, to_status, progress, created
   (used for trend charts)
4. `settings` (single record): dashboard_title, company_name, logo (file),
   share_enabled (bool), share_token (text)

## Auth & access rules

- Use a regular `users` auth collection with exactly one admin user (create via a
  one-time setup step or CLI command; document it). Disable public sign-up.
- All write rules: logged-in user only.
- Read rules: logged-in user, OR (settings.share_enabled = true AND the request's
  `token` query param matches settings.share_token) — for a read-only client view.
  Verify PocketBase rule syntax supports this; if not, propose the cleanest alternative.

## Features

### 1. Overview dashboard (the "presentation" page)

- KPI cards: total projects, in progress, completed this month, overdue, average progress
- Donut chart: projects by status (uses each status's color)
- Radial bar: overall completion %
- Stacked bar: projects per client, split by status
- Timeline (rangeBar/Gantt-style): projects by start → due date, colored by status,
  "today" marker
- Area/line trend chart: completed projects over the last 8–12 weeks (from activity_log)
- Each chart/card section lives in its own card with a small "Download PNG" button
  (html-to-image, 2x pixel ratio, card background included, button itself excluded
  from the image)

### 2. Kanban board

- One column per status (ordered by `order`), column header shows name, color, count
- Drag & drop cards between and within columns → persists status + order
- Card shows: name, client, progress bar, priority badge, due date (red if overdue)
- Click a card → side panel/modal to edit all fields; quick "+ Add project" per column

### 3. Project list view

- Sortable/filterable table (by status, client, priority, overdue), search box

### 4. Settings page

- Manage statuses (CRUD, color picker, drag to reorder, mark "done" status)
- Dashboard title/company name/logo
- Share link: toggle on/off, regenerate token, copy link button

### 5. Presentation mode

- One toggle button: hides all edit controls, nav and buttons; shows only title, logo,
  date and charts. Fixed 16:9-friendly layout (e.g. 1920×1080 grid) so screenshots
  paste perfectly into slides. Press Esc to exit.
- Light/dark theme toggle (light default — looks better on projectors); persist choice
  in localStorage

### 6. Client share view (read-only)

- Route like `/#/share?token=...` — same overview charts, no editing, no login

### 7. Realtime

- Use PocketBase realtime subscriptions so changes reflect instantly across open tabs

## Design direction

- Modern, premium SaaS look: generous whitespace, soft shadows, rounded-2xl cards,
  subtle gradients on KPI cards, smooth chart animations, Inter (or similar) font
- Status colors drive the whole UI consistently (badges, columns, charts)
- Polished empty states and loading skeletons
- Responsive, but optimized for laptop/projector screens first
- Keep bundle small: no UI component libraries beyond what's listed

## Project structure (suggested)

```
/backend
  pb_migrations/   (schema + seed)
  pb_hooks/        (activity_log hook)
/frontend
  src/lib/         (pb client, stores, chart components)
  src/routes or src/pages/
/deploy
  pocketbase.service  (systemd)
  Caddyfile
  deploy.sh           (build frontend → copy to pb_public → restart service)
  backup.sh           (daily pb_data backup with 7-day rotation, cron line included)
README.md
```

Production: build Svelte into PocketBase's `pb_public` so one process serves everything.
Dev: Vite dev server proxying to local PocketBase.

## Seed / demo data

Provide an optional seed migration or script with ~12 realistic sample projects across
4 clients and mixed statuses/dates, plus backdated activity_log entries, so the charts
look good immediately. Make it easy to wipe before going live.

## How to work

1. First, show me a short plan (phases + file list) and any questions. Wait for my OK.
2. Build in phases, and after each one tell me how to run/test it:
   Phase 1: PocketBase schema, rules, hook, seed
   Phase 2: Frontend shell, auth, Kanban + project CRUD
   Phase 3: Overview charts + PNG export
   Phase 4: Settings, presentation mode, theme, share view
   Phase 5: Deployment files + README (setup, first admin user, deploy, backup, restore)
3. Keep code clean and commented where non-obvious. No over-engineering.

## Done means

- I can run it locally with two commands (documented)
- I can deploy to my VPS by following the README step by step
- Statuses are fully configurable and charts/Kanban adapt automatically
- Every chart card exports a clean PNG; presentation mode screenshots look slide-ready
- Only the admin can edit; the share link is read-only and can be revoked
