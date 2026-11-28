# Pomodoro

A focus timer and personal productivity workspace. Run Pomodoro sessions against real tasks, organise work into projects, track habits and goals, and see where your focus time actually goes. Data is stored on your device and synced to your account.

## Features

- **Focus timer**: focus, short break and long break modes, a dial with a live countdown, configurable lengths and long-break cycle, optional auto-start, and keyboard control (Space to start, pause or resume). The remaining time also shows in the browser tab title and in the header on other pages.
- **Tasks**: Open, Today, Upcoming (grouped by date), Overdue and Completed views, with search, priority and project filters, sorting, quick-add, and a one-click "start focus on this task".
- **Projects**: list and board (To do, In progress, Done) views with drag-and-drop, progress and focus time per project, and team invitations by email.
- **Calendar**: month and week views of tasks by due date.
- **Habits and goals**: log scheduled days, streaks, and daily or weekly targets for focus time, sessions and completed tasks.
- **Analytics**: focus time per day, by project, by weekday and by hour, plus a 12-week activity map. It shows only data you have actually logged.
- **Sounds**: ambient sounds (rain, forest, ocean, white noise, fireplace, café) that keep playing as you move between pages.
- **Inbox**: session and break notifications, with optional browser notifications when the tab is in the background.
- **Themes**: dark, light or system mode, six colour themes, and a custom accent colour. Themes restyle the whole interface.
- **Backup**: full JSON backup and restore (merge or replace), and CSV export of tasks.
- **Accounts and sync**: email sign-up and sign-in through Supabase, with offline-tolerant cloud sync.

## Tech stack

- React 18 and Vite
- Tailwind CSS with CSS-variable design tokens
- Zustand for state, with local persistence
- React Router
- Supabase (auth, Postgres, Edge Functions)
- Recharts for charts, Sonner for toasts, Lucide for icons
- Hanken Grotesk and Bricolage Grotesque, self-hosted with Fontsource

## Getting started

### Requirements

- Node.js 18 or newer
- A Supabase project

### Install and run

```bash
npm ci
cp .env.example .env     # then fill in your values
npm run dev
```

The dev server prints a local URL, usually `http://localhost:5173`.

### Environment variables

Set these in `.env` (both are found in your Supabase project under Project Settings, then API):

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your project's public anon key |

Never commit real keys. `.env` is already listed in `.gitignore`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## Supabase setup

1. Create a Supabase project and add its URL and anon key to `.env`.
2. Apply the migrations in `supabase/migrations/`. Together they create the `app_state` table (one row of synced data per user) and the project collaboration tables, with their access policies.
3. To enable team invitations, deploy the Edge Function and set its secrets:

   ```bash
   supabase functions deploy invite-project-member
   supabase secrets set RESEND_API_KEY=... RESEND_FROM_EMAIL=... APP_URL=...
   ```

   See `.env.resend.example` for the names. These are Edge Function secrets, not Vite variables.

Without the function, everything else still works. Only sending invitations fails.

## Project structure

```
src/
  components/
    layout/      App shell: sidebar, header, search, mobile navigation
    ui/          Shared primitives: Button, Field, Modal, Switch, Tabs, ...
    tasks/       Task row, task form, quick-add
    timer/       Dial, controls, task selector, ambient sound
    settings/    Settings sections and backup import/export
  pages/         One file per route
  stores/        Zustand stores (tasks, projects, habits, goals, timer, settings, UI, sync)
  hooks/         Timer loop, cloud sync, progress figures, media queries
  lib/           Date helpers, audio, colour contrast, notifications, Supabase client
  constants/     Navigation, priorities, sounds
supabase/
  migrations/    Database schema
  functions/     Edge Function for project invitations
```

## Design system

All colours come from CSS variables defined in `src/index.css` (surface, border, text, accent and status colours). Tailwind maps them to utility classes such as `bg-surface`, `text-muted` and `bg-accent`. Each theme preset sets its own values for dark and light modes, so every component follows the active theme automatically. When adding UI, use these tokens rather than hard-coded colours.

## How data is stored

- Everything is saved in the browser first (`localStorage`), so the app works offline.
- When signed in, changes are uploaded to Supabase a moment after you make them.
- Edits that haven't uploaded yet are remembered across refreshes and take priority over the cloud copy until they do.
- If the cloud copy can't be loaded, local edits are kept on the device and are not uploaded until it loads. The header shows a Retry button.
- Due dates are stored as calendar days, so a task due on the 27th stays on the 27th in every timezone.

## Backups

Settings, then Data and backup:

- **Download JSON** saves tasks, sessions, projects, habits, goals, settings and theme.
- **Restore** offers *Merge* (keeps what you have, asks how to handle tasks with the same ID) or *Replace* (asks for confirmation, then overwrites everything).
- **Export CSV** saves all tasks for spreadsheets.

Backups are created and read in your browser and are never uploaded.

## Deployment

Run `npm run build` and host the `dist/` folder on any static host (Vercel, Netlify, Cloudflare Pages and similar). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment settings, and configure the host to serve `index.html` for all routes, since the app uses client-side routing.

## Status

Paid plans are planned but not available. Nothing in the app is locked, and the Plans page is informational only. See `CHANGES.md` for what changed in the latest redesign and the known limitations.