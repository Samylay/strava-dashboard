import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const execFileAsync = promisify(execFile);

function composioBin(): string {
  // Prefer ~/.composio/composio (the default install path), fall back to PATH lookup.
  const home = os.homedir();
  const candidate = path.join(home, ".composio", "composio");
  if (fs.existsSync(candidate)) return candidate;
  return "composio";
}

async function exec<T = unknown>(slug: string, args: Record<string, unknown>): Promise<T> {
  const bin = composioBin();
  const data = JSON.stringify(args);
  const { stdout } = await execFileAsync(bin, ["execute", slug, "-d", data], {
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  });
  let parsed: {
    successful?: boolean;
    data?: unknown;
    error?: unknown;
    storedInFile?: boolean;
    outputFilePath?: string;
  };
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error(`${slug}: failed to parse CLI output`);
  }
  if (!parsed.successful) {
    const errMsg =
      typeof parsed.error === "string"
        ? parsed.error
        : JSON.stringify(parsed.error ?? "unknown");
    throw new Error(`${slug} failed: ${errMsg}`);
  }
  // Large payloads get spilled to a JSON file by the CLI
  if (parsed.storedInFile && parsed.outputFilePath) {
    const raw = fs.readFileSync(parsed.outputFilePath, "utf8");
    const fromFile = JSON.parse(raw) as { data?: unknown };
    return (fromFile.data ?? fromFile) as T;
  }
  return (parsed.data as T) ?? ({} as T);
}

// ---------- Types ----------

export interface StravaActivitySummary {
  id: number;
  name: string;
  sport_type: string;
  type?: string;
  start_date: string;
  start_date_local?: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  average_watts?: number;
  kilojoules?: number;
  suffer_score?: number;
  kudos_count?: number;
  achievement_count?: number;
  gear_id?: string | null;
  map?: { summary_polyline?: string | null };
  start_latlng?: [number, number] | null;
}

export interface StravaStreams {
  heartrate?: number[];
  time?: number[];
  distance?: number[];
  altitude?: number[];
  velocity_smooth?: number[];
  cadence?: number[];
  latlng?: [number, number][];
}

export interface StravaLap {
  lap_index: number;
  distance: number;
  elapsed_time: number;
  moving_time: number;
  average_speed: number;
  average_heartrate?: number;
  total_elevation_gain?: number;
  start_index?: number;
  end_index?: number;
}

// ---------- Helpers ----------

function unwrapList(data: unknown): StravaActivitySummary[] {
  if (Array.isArray(data)) return data as StravaActivitySummary[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.details)) return d.details as StravaActivitySummary[];
    if (Array.isArray(d.data)) return d.data as StravaActivitySummary[];
  }
  return [];
}

function unwrap<T>(data: unknown): T {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.details !== undefined) return d.details as T;
    if (d.data !== undefined) return d.data as T;
  }
  return data as T;
}

// ---------- Public API ----------

export async function listActivities(opts: {
  page?: number;
  perPage?: number;
  after?: number;
  before?: number;
}): Promise<StravaActivitySummary[]> {
  const args: Record<string, unknown> = {
    page: opts.page ?? 1,
    per_page: opts.perPage ?? 30,
  };
  if (opts.after) args.after = opts.after;
  if (opts.before) args.before = opts.before;
  const data = await exec("STRAVA_LIST_ATHLETE_ACTIVITIES", args);
  return unwrapList(data);
}

export async function getActivityStreams(id: number): Promise<StravaStreams> {
  const data = await exec("STRAVA_GET_ACTIVITY_STREAMS", {
    id,
    keys: "heartrate,time,distance,altitude,velocity_smooth,cadence,latlng",
    key_by_type: true,
  });
  // shape: { heartrate: { data: [...] }, time: { data: [...] }, ... } when key_by_type
  const inner = unwrap<Record<string, { data?: unknown[] }>>(data);
  const out: StravaStreams = {};
  for (const [k, v] of Object.entries(inner ?? {})) {
    if (v && Array.isArray(v.data)) {
      (out as Record<string, unknown>)[k] = v.data;
    }
  }
  return out;
}

export async function getActivityLaps(id: number): Promise<StravaLap[]> {
  const data = await exec("STRAVA_LIST_ACTIVITY_LAPS", { id });
  if (Array.isArray(data)) return data as StravaLap[];
  const inner = unwrap<unknown>(data);
  return Array.isArray(inner) ? (inner as StravaLap[]) : [];
}

export async function getAthlete(): Promise<{
  id: number;
  firstname?: string;
  lastname?: string;
  weight?: number;
  ftp?: number;
} | null> {
  try {
    const data = await exec("STRAVA_GET_AUTHENTICATED_ATHLETE", {});
    return unwrap(data);
  } catch {
    return null;
  }
}
