import { getDb } from "./db";
import type { ActivityRow } from "./stats";

export function getActivities(opts: {
  from?: string;
  to?: string;
  sport?: string | null;
  limit?: number;
} = {}): ActivityRow[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (opts.from) {
    where.push("start_date >= @from");
    params.from = opts.from;
  }
  if (opts.to) {
    where.push("start_date <= @to");
    params.to = opts.to;
  }
  if (opts.sport && opts.sport !== "all") {
    where.push("sport_type = @sport");
    params.sport = opts.sport;
  }
  const sql =
    `SELECT id, name, sport_type, start_date, start_date_local,
            distance_m, moving_time_s, elapsed_time_s, total_elevation_gain_m,
            average_speed_mps, max_speed_mps, average_heartrate, max_heartrate,
            average_cadence, average_watts, kilojoules,
            kudos_count, achievement_count, polyline, start_lat, start_lng
     FROM activities` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY start_date DESC` +
    (opts.limit ? ` LIMIT ${Math.floor(opts.limit)}` : "");
  return getDb().prepare(sql).all(params) as ActivityRow[];
}

export function getActivityById(id: number): ActivityRow | null {
  return (
    (getDb()
      .prepare(
        `SELECT id, name, sport_type, start_date, start_date_local,
                distance_m, moving_time_s, elapsed_time_s, total_elevation_gain_m,
                average_speed_mps, max_speed_mps, average_heartrate, max_heartrate,
                average_cadence, average_watts, kilojoules,
                kudos_count, achievement_count, polyline, start_lat, start_lng
         FROM activities WHERE id = ?`
      )
      .get(id) as ActivityRow) ?? null
  );
}

export function getStreams(id: number): Record<string, unknown[]> {
  const rows = getDb()
    .prepare("SELECT type, data FROM activity_streams WHERE activity_id = ?")
    .all(id) as { type: string; data: Buffer }[];
  const out: Record<string, unknown[]> = {};
  for (const r of rows) {
    try {
      out[r.type] = JSON.parse(r.data.toString("utf8"));
    } catch {
      // ignore
    }
  }
  return out;
}

export function getSplits(id: number) {
  return getDb()
    .prepare(
      "SELECT split_index, distance_m, elapsed_time_s, moving_time_s, average_speed_mps, average_heartrate, elevation_diff_m FROM splits WHERE activity_id = ? ORDER BY split_index"
    )
    .all(id) as Array<{
    split_index: number;
    distance_m: number;
    elapsed_time_s: number;
    moving_time_s: number;
    average_speed_mps: number;
    average_heartrate: number | null;
    elevation_diff_m: number | null;
  }>;
}

export function getDistinctSports(): string[] {
  return (
    getDb()
      .prepare("SELECT DISTINCT sport_type FROM activities ORDER BY sport_type")
      .all() as { sport_type: string }[]
  ).map((r) => r.sport_type);
}

export function getSyncState(): { last_synced_activity_date?: string; last_sync_at?: string; max_hr_override?: string } {
  const rows = getDb().prepare("SELECT key, value FROM sync_state").all() as {
    key: string;
    value: string;
  }[];
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function setSyncStateValue(key: string, value: string) {
  getDb()
    .prepare("INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
    .run(key, value);
}

export function getGoals(year: number) {
  return getDb()
    .prepare("SELECT year, sport_type, target_distance_m, target_time_s FROM goals WHERE year = ?")
    .all(year) as Array<{
    year: number;
    sport_type: string;
    target_distance_m: number | null;
    target_time_s: number | null;
  }>;
}

export function setGoal(year: number, sport: string, distance: number | null, time: number | null) {
  getDb()
    .prepare(
      `INSERT INTO goals (year, sport_type, target_distance_m, target_time_s)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(year, sport_type) DO UPDATE SET target_distance_m=excluded.target_distance_m, target_time_s=excluded.target_time_s`
    )
    .run(year, sport, distance, time);
}

export function getRecords() {
  return getDb()
    .prepare(
      `SELECT pr.sport_type, pr.distance_m, pr.time_s, pr.achieved_at, pr.activity_id, a.name AS activity_name
       FROM personal_records pr LEFT JOIN activities a ON a.id = pr.activity_id
       ORDER BY pr.distance_m, pr.time_s`
    )
    .all() as Array<{
    sport_type: string;
    distance_m: number;
    time_s: number;
    achieved_at: string;
    activity_id: number;
    activity_name: string | null;
  }>;
}

export function getActivityCount(): number {
  const r = getDb().prepare("SELECT COUNT(*) as n FROM activities").get() as { n: number };
  return r.n;
}
