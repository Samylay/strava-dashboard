import { format as fmt } from "date-fns";

export function formatDistance(meters: number | null | undefined): string {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toFixed(km >= 100 ? 0 : km >= 10 ? 1 : 2)} km`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return "—";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, "0")}s`;
  return `${sec}s`;
}

export function formatDurationCompact(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return "—";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}m`;
}

// pace = min/km from m/s
export function formatPace(metersPerSec: number | null | undefined): string {
  if (!metersPerSec || metersPerSec <= 0) return "—";
  const secPerKm = 1000 / metersPerSec;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

// km/h from m/s
export function formatSpeed(metersPerSec: number | null | undefined): string {
  if (!metersPerSec || metersPerSec <= 0) return "—";
  return `${(metersPerSec * 3.6).toFixed(1)} km/h`;
}

export function formatPaceOrSpeed(mps: number | null | undefined, sport: string): string {
  return isFootSport(sport) ? formatPace(mps) : formatSpeed(mps);
}

export function isFootSport(sport: string): boolean {
  const s = sport.toLowerCase();
  return s.includes("run") || s.includes("walk") || s.includes("hike") || s === "trailrun";
}

export function formatElevation(meters: number | null | undefined): string {
  if (meters == null) return "—";
  return `${Math.round(meters).toLocaleString()} m`;
}

export function formatDate(d: string | Date | number, pattern = "MMM d, yyyy"): string {
  return fmt(new Date(d), pattern);
}

export function formatDateTime(d: string | Date | number): string {
  return fmt(new Date(d), "MMM d, yyyy HH:mm");
}

export function formatNumber(n: number | null | undefined, digits = 0): string {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function sportEmoji(sport: string): string {
  const s = sport.toLowerCase();
  if (s.includes("run")) return "🏃";
  if (s.includes("ride") || s.includes("cycl") || s.includes("bike")) return "🚴";
  if (s.includes("swim")) return "🏊";
  if (s.includes("walk")) return "🚶";
  if (s.includes("hike")) return "🥾";
  if (s.includes("ski")) return "⛷️";
  if (s.includes("yoga")) return "🧘";
  if (s.includes("workout") || s.includes("weight")) return "🏋️";
  return "🏅";
}
