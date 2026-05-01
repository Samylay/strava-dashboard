# Strava Dashboard

A personal Next.js dashboard for your Strava data. Pulls activities through [Composio](https://composio.dev), caches them in a local SQLite file, and renders 9 view sections — overview, timeline, trends, sport breakdown, distributions, period comparison, activity deep-dive (with map + HR/elevation profile), records, and yearly goals.

Single-user. Runs entirely on your machine. No data leaves it except the request to your own Strava account through Composio.

![dark mode dashboard, Strava-orange accent](docs/preview.png)

---

## Quick start

```bash
# 1. Clone & install
git clone https://github.com/Samylay/strava-dashboard.git
cd strava-dashboard
pnpm install              # or npm install / yarn

# 2. Get a Composio API key
#    https://app.composio.dev/developers  (free; sign in with Google/GitHub)
#    Copy your user API key (starts with "uak_").

# 3. Install the Composio CLI
curl -fsSL https://composio.dev/install -o /tmp/composio-install.sh
bash /tmp/composio-install.sh
#   Adds the binary at ~/.composio/composio. The dashboard auto-detects this path.

# 4. Log in to Composio with your key
~/.composio/composio login --user-api-key "uak_xxx_your_key_here"

# 5. Connect your Strava account
~/.composio/composio link strava
#   Follow the printed URL, authorize Strava, return when "ACTIVE" appears.

# 6. Configure the app
cp .env.example .env.local
#   Then edit .env.local:
#     COMPOSIO_API_KEY=uak_xxx_your_key_here
#     COMPOSIO_USER_ID=default

# 7. Initial sync (one-time, ~30s for a couple of years of activities)
pnpm sync:initial

# 8. Start the dashboard
pnpm dev
#    Opens at http://localhost:3000 (or 3001/3002/... if those are busy)
```

That's it. Open the page in a browser, click around. Hit **Sync** in the header any time you want to pull new activities.

---

## Plugging in your own data — the details

### Why Composio (and not direct Strava OAuth)?

Strava's API requires registering an OAuth app, hosting a redirect URL, and managing token refresh yourself. Composio handles all of that — you sign in once with `composio link strava`, and any "STRAVA_*" tool just works for that user. The dashboard reads through these tools, so you never touch raw OAuth.

### Why does this app shell out to the `composio` CLI instead of using the Node SDK?

The user-scoped API key (`uak_*`) currently authenticates against Composio's `backend.composio.dev` endpoints (which the CLI uses) but not against the Node SDK's `api.composio.dev` tools endpoint. Until that's unified, `lib/composio.ts` invokes `composio execute STRAVA_…` as a subprocess and parses the JSON envelope. This means **the CLI must be on disk** at `~/.composio/composio` (default install location) or on `PATH`.

If you'd rather use the Node SDK with a project/org API key, swap `lib/composio.ts` to call `composio.tools.execute(slug, { userId, arguments })` — the surface is otherwise identical.

### Multiple Composio users / multiple Strava accounts

Set `COMPOSIO_USER_ID` to anything you like (e.g. `me-personal`, `me-secondary`) and re-run `composio link strava --user-id <that-value>`. The CLI scopes the connection to that user. The dashboard reads `COMPOSIO_USER_ID` from `.env.local` so you can switch by editing one line and re-running `pnpm sync:initial` (the SQLite cache is a single shared file at `data/strava.db` — copy it aside before switching if you want both).

### Where the data lives

| Path | Purpose |
| --- | --- |
| `data/strava.db` | All cached activities, streams, splits, PRs, goals, sync state. Gitignored. |
| `.env.local` | Your Composio key + user id. Gitignored. |

To start over: `rm -rf data/strava.db* && pnpm sync:initial`.

### Incremental sync

The header **Sync** button (or `POST /api/sync`) pulls only activities newer than the last `start_date` we've seen. Strava's rate limits (100/15min, 1000/day) are well under the volume of a personal sync, but the loop sleeps 1.5s between pages just in case.

### Lazy stream loading

Per-activity streams (heart-rate, distance, time, altitude, velocity, cadence, lat/lng) and per-lap splits are **not** pulled during the bulk sync — that would burn far more API calls than necessary. They load the first time you open `/activity/[id]`, and personal records get recomputed on each new stream load.

### Adding a new view

Each page in `app/` is a server component that:
1. Reads the `period` and `sport` searchParams.
2. Calls `getActivities(...)` from `lib/queries.ts`.
3. Passes the rows through pure functions in `lib/stats.ts`.
4. Renders Tailwind cards + chart wrappers from `components/charts.tsx`.

To add a metric: extend `lib/stats.ts` (write a unit test in `tests/`), add a query if needed, drop a new file under `app/your-view/page.tsx`, and add an entry to `components/sidebar.tsx`.

### HR zones

Z1–Z5 are computed at request time from each activity's `heartrate` + `time` streams (50–60–70–80–90–100% of max HR). Max HR defaults to your highest recorded value across all activities; override it on the `/goals` page if you know your true max.

### Personal records

Run-distance bests (1k / 5k / 10k / half / marathon) use a sliding-window over each run's `distance` and `time` streams. Records appear on `/records` only after you've opened the activities that contain them — open a few of your fastest runs to bootstrap.

---

## Architecture

```
app/                 Next.js App Router pages + API routes (all server components)
  api/sync           POST: incremental Strava pull
  api/activity/[id]  GET: lazy stream loader
  api/goals          POST: yearly target editor
components/          Client-side UI (charts, map, filters, sync button)
lib/
  composio.ts        Wrapper around the `composio execute` CLI
  db.ts              better-sqlite3 + idempotent migrations
  sync.ts            Page-by-page upsert + lazy detail loader
  queries.ts         All read queries used by pages
  stats.ts           Pure analytics: KPIs, streaks, buckets, zones, PRs, histograms
  format.ts          Pace/distance/duration formatters
  periods.ts         Period spec resolution + presets
data/strava.db       SQLite cache (gitignored)
```

**Stack:** Next.js 14, React 18, TypeScript, Tailwind 3, Recharts, react-calendar-heatmap, Leaflet, better-sqlite3, vitest, pnpm.

All page reads hit SQLite directly through the server component — no client-side data fetching except chart interactivity. Function props can't cross the server/client boundary, so chart formatters use a `format` kind (`"km" | "pace" | "duration" | …`) instead of inline functions.

---

## Tests

```bash
pnpm test             # vitest, runs once
pnpm test:watch
```

Covers the pure functions in `lib/format.ts`. Add to `tests/` if you extend `lib/stats.ts`.

---

## Troubleshooting

**`Error: Could not locate the bindings file` for `better-sqlite3`**
The native module didn't compile. Run:
```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
npm run install --build-from-source
```

**`Unable to retrieve tool with slug STRAVA_LIST_ATHLETE_ACTIVITIES`**
The Composio CLI isn't on disk where the dashboard expects, or your Strava connection isn't `ACTIVE`. Run `~/.composio/composio link strava` and re-try.

**`STRAVA_LIST_ATHLETE_ACTIVITIES failed: …`** during sync
Check `~/.composio/composio execute STRAVA_LIST_ATHLETE_ACTIVITIES -d '{"per_page":1}'` — if the CLI itself fails, your token has expired. `composio link strava` re-issues it.

**Empty pages with "No activities yet"**
You haven't synced. Run `pnpm sync:initial`.

**`Functions cannot be passed directly to Client Components`**
You added a chart and passed an inline function as a prop. Use one of the `format` kind values in `components/charts.tsx` (or add a new one there) instead.

**Streak shows 0d**
The streak counter is strict — it counts consecutive calendar days with at least one activity, ending today (or yesterday if you haven't trained today yet). If you skip even one day, it resets.

---

## License

MIT. Personal project — no warranty, but PRs welcome.
