# RETIRED — 2026-07-07

Scrapped as a standalone app (never deployed here: no Composio key, no data,
no node_modules) and **merged into LifeOS** at Samy's direction.

- Pure analytics libs (`lib/stats.ts`, `lib/format.ts`) + their 17 tests were
  ported to `~/apps/lifeos/app/src/lib/training/` (db/Composio-coupled parts
  excised — LifeOS has its own live Strava sync in `src/lib/strava-sync.ts`).
- The view sections (records, trends, distributions, compare, sports,
  heatmap) are queued as LifeOS ROADMAP tasks T08–T13 for the nightly
  autoloop, using this repo as the reference implementation.
- Keep this repo until those tasks are done, then it can be archived.
