# Strava Dashboard

Personal Next.js dashboard for your Strava data, backed by Composio.

## Features

9 view sections:
- **Overview** — KPIs (distance, time, elevation, count, streak, weekly avg) + 12-week mini chart + recent activity cards
- **Timeline** — 365-day GitHub-style heatmap + sortable recent-activities table
- **Trends** — weekly distance / elevation / HR / pace charts with 4-week rolling average
- **Sports** — time-share + distance-share donuts + per-sport stats table
- **Distributions** — pace histograms (Run, Ride), HR distribution, time-in-zone
- **Compare** — side-by-side period KPIs + overlaid weekly distance line, with presets ("YTD vs last", etc.)
- **Activity deep-dive** — Leaflet map (decoded polyline) + elevation / HR / pace charts on shared X axis + splits table
- **Records** — best 1k/5k/10k/half/marathon (sliding window over streams), longest run/ride, biggest climb, longest streak
- **Goals** — yearly per-sport distance targets with progress bars and end-of-year projection; max-HR override

## Architecture

- Next.js 15 (App Router, TS, Tailwind) + Recharts + react-calendar-heatmap + Leaflet
- SQLite (`better-sqlite3`) at `data/strava.db`
- Strava data pulled via the Composio CLI (`composio execute STRAVA_*`) — this avoids the API-key auth mismatch between the user-scoped `uak_` key and the Composio Node SDK's tools endpoint.

## Setup

```bash
# 1. Install
pnpm install

# 2. Make sure Composio is installed and Strava is connected
#    (the install script already ran composio login earlier)
~/.composio/composio link strava   # only if not already connected

# 3. Pull all activities into the local SQLite cache (one-time)
pnpm sync:initial

# 4. Run the dashboard
pnpm dev
# open http://localhost:3000 (or whichever port Next picks)
```

`.env.local` only needs:
```
COMPOSIO_API_KEY=uak_...
COMPOSIO_USER_ID=default
```

## Incremental sync

Click the **Sync** button in the header. The route `POST /api/sync` pulls only activities newer than the last `start_date` we saw, with rate-limit-aware paging.

## Data model

| Table | Purpose |
| --- | --- |
| `activities` | One row per Strava activity (summary fields + raw JSON) |
| `activity_streams` | Lazy-loaded streams (HR, distance, time, altitude, etc.) per activity |
| `splits` | Per-lap splits (lazy-loaded with streams) |
| `personal_records` | Best efforts per (sport, distance) — recomputed when streams load |
| `sync_state` | `last_synced_activity_date`, `last_sync_at`, `max_hr_override` |
| `goals` | Per-year, per-sport distance/time targets |

## Tests

```bash
pnpm test
```

Pure-function tests (`lib/format.ts`).

## Notes

- All pages are server components; SQLite reads happen on the request, no client fetching.
- Charts are client components using `format` kind strings (function props can't cross the server/client boundary).
- The activity deep-dive lazy-loads streams from Composio on first visit; subsequent loads are SQLite-only.
- HR zones use 50–60–70–80–90–100% of max HR; max HR defaults to your highest recorded value, overridable in `/goals`.
- 2 years of activity history syncs in well under a minute.

## Design & plan

- Spec: `../docs/superpowers/specs/2026-04-30-strava-dashboard-design.md`
- Plan: `../docs/superpowers/plans/2026-04-30-strava-dashboard.md`
