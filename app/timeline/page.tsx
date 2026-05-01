import Link from "next/link";
import { format, subDays } from "date-fns";
import { PageHeader, Card, Section, Table, Th, Td, EmptyState } from "@/components/ui";
import { ActivityHeatmap } from "@/components/heatmap";
import { SportFilter } from "@/components/filters";
import { getActivities, getDistinctSports } from "@/lib/queries";
import { dailyDistance } from "@/lib/stats";
import {
  formatDistance,
  formatDuration,
  formatPaceOrSpeed,
  formatNumber,
  sportEmoji,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default function TimelinePage({
  searchParams,
}: {
  searchParams: { sport?: string };
}) {
  const sport = searchParams.sport ?? null;
  const sports = getDistinctSports();
  const end = new Date();
  const start = subDays(end, 364);

  const rows = getActivities({ from: start.toISOString(), sport });
  if (rows.length === 0 && sports.length === 0) {
    return <EmptyState title="No activities yet" />;
  }

  const distMap = dailyDistance(rows);
  const heatValues = Array.from(distMap.entries()).map(([date, m]) => ({
    date,
    count: Math.round(m / 1000),
  }));

  const tableRows = getActivities({ sport, limit: 100 });

  return (
    <>
      <PageHeader
        title="Timeline"
        subtitle="Daily activity heatmap (last 365 days) and recent log"
        right={<SportFilter sports={sports} />}
      />

      <Section title="365-day heatmap · daily distance (km)">
        <Card>
          <ActivityHeatmap
            startDate={start}
            endDate={end}
            values={heatValues}
            unit="km"
          />
        </Card>
      </Section>

      <Section title={`Recent activities · ${formatNumber(tableRows.length)} shown`}>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Sport</Th>
              <Th>Name</Th>
              <Th className="text-right">Distance</Th>
              <Th className="text-right">Time</Th>
              <Th className="text-right">Pace / Speed</Th>
              <Th className="text-right">Avg HR</Th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((a) => (
              <tr key={a.id} className="hover:bg-bg-subtle/40 transition-colors">
                <Td>
                  <Link href={`/activity/${a.id}`} className="text-fg-muted hover:text-strava">
                    {format(new Date(a.start_date_local ?? a.start_date), "MMM d, yyyy")}
                  </Link>
                </Td>
                <Td>
                  <span className="text-fg-muted">
                    {sportEmoji(a.sport_type)} {a.sport_type}
                  </span>
                </Td>
                <Td>
                  <Link href={`/activity/${a.id}`} className="hover:text-strava">
                    {a.name}
                  </Link>
                </Td>
                <Td className="text-right tabular-nums">{formatDistance(a.distance_m)}</Td>
                <Td className="text-right tabular-nums">{formatDuration(a.moving_time_s)}</Td>
                <Td className="text-right tabular-nums">
                  {formatPaceOrSpeed(a.average_speed_mps, a.sport_type)}
                </Td>
                <Td className="text-right tabular-nums">
                  {a.average_heartrate ? `${Math.round(a.average_heartrate)} bpm` : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </>
  );
}
