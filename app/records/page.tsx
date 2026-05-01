import Link from "next/link";
import { format } from "date-fns";
import { PageHeader, Card, Section, Stat, Table, Th, Td, EmptyState } from "@/components/ui";
import { getActivities, getActivityCount, getRecords } from "@/lib/queries";
import { currentStreak } from "@/lib/stats";
import { formatDistance, formatDuration, formatElevation } from "@/lib/format";

export const dynamic = "force-dynamic";

const PR_LABELS: Record<number, string> = {
  1000: "1 km",
  5000: "5 km",
  10000: "10 km",
  21097: "Half marathon",
  42195: "Marathon",
};

export default function RecordsPage() {
  if (getActivityCount() === 0) return <EmptyState title="No activities yet" />;

  const records = getRecords();
  const all = getActivities();

  const longestRide = all
    .filter((a) => /ride/i.test(a.sport_type))
    .reduce((m, a) => (a.distance_m > (m?.distance_m ?? 0) ? a : m), null as null | (typeof all)[number]);
  const biggestClimb = all.reduce(
    (m, a) => (a.total_elevation_gain_m > (m?.total_elevation_gain_m ?? 0) ? a : m),
    null as null | (typeof all)[number]
  );
  const longestRun = all
    .filter((a) => /run/i.test(a.sport_type))
    .reduce((m, a) => (a.distance_m > (m?.distance_m ?? 0) ? a : m), null as null | (typeof all)[number]);

  const streak = currentStreak(all);

  return (
    <>
      <PageHeader title="Personal records" subtitle="Best efforts and milestones" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat
          label="Longest run"
          value={longestRun ? formatDistance(longestRun.distance_m) : "—"}
          hint={longestRun ? <Link href={`/activity/${longestRun.id}`}>{longestRun.name}</Link> : undefined}
          accent
        />
        <Stat
          label="Longest ride"
          value={longestRide ? formatDistance(longestRide.distance_m) : "—"}
          hint={longestRide ? <Link href={`/activity/${longestRide.id}`}>{longestRide.name}</Link> : undefined}
        />
        <Stat
          label="Biggest climb"
          value={biggestClimb ? formatElevation(biggestClimb.total_elevation_gain_m) : "—"}
          hint={biggestClimb ? <Link href={`/activity/${biggestClimb.id}`}>{biggestClimb.name}</Link> : undefined}
        />
        <Stat label="Current streak" value={`${streak} d`} hint="active days in a row" />
      </div>

      <Section title="Run distance bests">
        {records.length === 0 ? (
          <Card>
            <p className="text-sm text-fg-muted">
              Open a few run activities to lazy-load streams — bests get computed automatically.
            </p>
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Distance</Th>
                <Th>Sport</Th>
                <Th className="text-right">Time</Th>
                <Th className="text-right">Avg pace</Th>
                <Th>Achieved</Th>
                <Th>Activity</Th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const paceSec = r.time_s / (r.distance_m / 1000);
                const min = Math.floor(paceSec / 60);
                const sec = Math.round(paceSec % 60);
                return (
                  <tr key={`${r.sport_type}-${r.distance_m}`}>
                    <Td>{PR_LABELS[r.distance_m] ?? `${r.distance_m} m`}</Td>
                    <Td>{r.sport_type}</Td>
                    <Td className="text-right tabular-nums">{formatDuration(r.time_s)}</Td>
                    <Td className="text-right tabular-nums">
                      {min}:{String(sec).padStart(2, "0")} /km
                    </Td>
                    <Td>{format(new Date(r.achieved_at), "MMM d, yyyy")}</Td>
                    <Td>
                      <Link
                        href={`/activity/${r.activity_id}`}
                        className="text-fg-muted hover:text-strava"
                      >
                        {r.activity_name ?? `#${r.activity_id}`}
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Section>
    </>
  );
}
