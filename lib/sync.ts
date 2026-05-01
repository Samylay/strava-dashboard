import { getDb } from "./db";
import {
  getActivityLaps,
  getActivityStreams,
  listActivities,
  type StravaActivitySummary,
  type StravaStreams,
} from "./composio";
import { recomputePersonalRecords } from "./stats";

export interface SyncResult {
  ok: boolean;
  count: number;
  partial?: boolean;
  error?: string;
}

const PAGE_SIZE = 30;
const PAGE_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function syncActivities(opts: { initial?: boolean } = {}): Promise<SyncResult> {
  const db = getDb();
  let after: number | undefined;
  if (!opts.initial) {
    const row = db.prepare("SELECT value FROM sync_state WHERE key = ?").get("last_synced_activity_date") as
      | { value: string }
      | undefined;
    if (row) after = Number(row.value);
  }

  const upsert = db.prepare(`
    INSERT INTO activities (
      id, name, sport_type, start_date, start_date_local,
      distance_m, moving_time_s, elapsed_time_s, total_elevation_gain_m,
      average_speed_mps, max_speed_mps, average_heartrate, max_heartrate,
      average_cadence, average_watts, kilojoules, suffer_score,
      kudos_count, achievement_count, gear_id, polyline,
      start_lat, start_lng, raw_json
    ) VALUES (
      @id, @name, @sport_type, @start_date, @start_date_local,
      @distance_m, @moving_time_s, @elapsed_time_s, @total_elevation_gain_m,
      @average_speed_mps, @max_speed_mps, @average_heartrate, @max_heartrate,
      @average_cadence, @average_watts, @kilojoules, @suffer_score,
      @kudos_count, @achievement_count, @gear_id, @polyline,
      @start_lat, @start_lng, @raw_json
    )
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      sport_type=excluded.sport_type,
      start_date=excluded.start_date,
      start_date_local=excluded.start_date_local,
      distance_m=excluded.distance_m,
      moving_time_s=excluded.moving_time_s,
      elapsed_time_s=excluded.elapsed_time_s,
      total_elevation_gain_m=excluded.total_elevation_gain_m,
      average_speed_mps=excluded.average_speed_mps,
      max_speed_mps=excluded.max_speed_mps,
      average_heartrate=excluded.average_heartrate,
      max_heartrate=excluded.max_heartrate,
      average_cadence=excluded.average_cadence,
      average_watts=excluded.average_watts,
      kilojoules=excluded.kilojoules,
      suffer_score=excluded.suffer_score,
      kudos_count=excluded.kudos_count,
      achievement_count=excluded.achievement_count,
      gear_id=excluded.gear_id,
      polyline=excluded.polyline,
      start_lat=excluded.start_lat,
      start_lng=excluded.start_lng,
      raw_json=excluded.raw_json
  `);
  const setSyncState = db.prepare(
    "INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  );

  let total = 0;
  let page = 1;
  let lastSeenStart = after ?? 0;

  try {
    while (true) {
      const batch = await listActivities({ page, perPage: PAGE_SIZE, after });
      if (batch.length === 0) break;

      const tx = db.transaction((items: StravaActivitySummary[]) => {
        for (const a of items) {
          const startEpoch = Math.floor(new Date(a.start_date).getTime() / 1000);
          if (startEpoch > lastSeenStart) lastSeenStart = startEpoch;
          upsert.run({
            id: a.id,
            name: a.name ?? "",
            sport_type: a.sport_type ?? a.type ?? "Workout",
            start_date: a.start_date,
            start_date_local: a.start_date_local ?? null,
            distance_m: a.distance ?? 0,
            moving_time_s: a.moving_time ?? 0,
            elapsed_time_s: a.elapsed_time ?? 0,
            total_elevation_gain_m: a.total_elevation_gain ?? 0,
            average_speed_mps: a.average_speed ?? null,
            max_speed_mps: a.max_speed ?? null,
            average_heartrate: a.average_heartrate ?? null,
            max_heartrate: a.max_heartrate ?? null,
            average_cadence: a.average_cadence ?? null,
            average_watts: a.average_watts ?? null,
            kilojoules: a.kilojoules ?? null,
            suffer_score: a.suffer_score ?? null,
            kudos_count: a.kudos_count ?? 0,
            achievement_count: a.achievement_count ?? 0,
            gear_id: a.gear_id ?? null,
            polyline: a.map?.summary_polyline ?? null,
            start_lat: a.start_latlng?.[0] ?? null,
            start_lng: a.start_latlng?.[1] ?? null,
            raw_json: JSON.stringify(a),
          });
        }
      });
      tx(batch);

      total += batch.length;
      if (batch.length < PAGE_SIZE) break;
      page++;
      await sleep(PAGE_DELAY_MS);
    }

    setSyncState.run("last_synced_activity_date", String(lastSeenStart));
    setSyncState.run("last_sync_at", String(Math.floor(Date.now() / 1000)));
    return { ok: true, count: total };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    if (lastSeenStart > (after ?? 0)) {
      setSyncState.run("last_synced_activity_date", String(lastSeenStart));
    }
    setSyncState.run("last_sync_at", String(Math.floor(Date.now() / 1000)));
    return { ok: false, partial: total > 0, count: total, error: err };
  }
}

export async function loadActivityDetail(id: number): Promise<void> {
  const db = getDb();

  // streams
  const haveStreams = db
    .prepare("SELECT 1 FROM activity_streams WHERE activity_id = ? LIMIT 1")
    .get(id);

  if (!haveStreams) {
    let streams: StravaStreams = {};
    try {
      streams = await getActivityStreams(id);
    } catch {
      // soft-fail; some manual activities have no streams
    }

    const insertStream = db.prepare(
      "INSERT OR REPLACE INTO activity_streams (activity_id, type, data) VALUES (?, ?, ?)"
    );
    const tx = db.transaction(() => {
      for (const [k, v] of Object.entries(streams)) {
        if (v) insertStream.run(id, k, Buffer.from(JSON.stringify(v)));
      }
    });
    tx();
  }

  // laps
  const haveLaps = db.prepare("SELECT 1 FROM splits WHERE activity_id = ? LIMIT 1").get(id);
  if (!haveLaps) {
    try {
      const laps = await getActivityLaps(id);
      const insertSplit = db.prepare(
        "INSERT OR REPLACE INTO splits (activity_id, split_index, distance_m, elapsed_time_s, moving_time_s, average_speed_mps, average_heartrate, elevation_diff_m) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      );
      const tx = db.transaction(() => {
        laps.forEach((l, i) => {
          insertSplit.run(
            id,
            l.lap_index ?? i,
            l.distance ?? null,
            l.elapsed_time ?? null,
            l.moving_time ?? null,
            l.average_speed ?? null,
            l.average_heartrate ?? null,
            l.total_elevation_gain ?? null
          );
        });
      });
      tx();
    } catch {
      // ignore
    }
  }

  recomputePersonalRecords(id);
}
