import { PageHeader, Card, Section, Table, Th, Td, EmptyState } from "@/components/ui";
import { PeriodPicker } from "@/components/filters";
import { Donut } from "@/components/charts";
import { getActivities, getActivityCount } from "@/lib/queries";
import { sportBreakdown } from "@/lib/stats";
import { resolvePeriod } from "@/lib/periods";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatPaceOrSpeed,
  sportEmoji,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default function SportsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  if (getActivityCount() === 0) return <EmptyState title="No activities yet" />;
  const period = resolvePeriod(searchParams.period ?? "year");
  const rows = getActivities({
    from: period.from.toISOString(),
    to: period.to.toISOString(),
  });
  const breakdown = sportBreakdown(rows);

  return (
    <>
      <PageHeader
        title="Sport breakdown"
        subtitle={period.label}
        right={<PeriodPicker />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card>
          <Section title="Time share"><div /></Section>
          <Donut
            data={breakdown.map((s) => ({
              name: `${sportEmoji(s.sport_type)} ${s.sport_type}`,
              value: s.moving_time_s,
            }))}
            format="hours"
          />
        </Card>
        <Card>
          <Section title="Distance share"><div /></Section>
          <Donut
            data={breakdown.map((s) => ({
              name: `${sportEmoji(s.sport_type)} ${s.sport_type}`,
              value: s.distance_m,
            }))}
            format="distance_m"
          />
        </Card>
      </div>

      <Section title="Per-sport stats">
        <Table>
          <thead>
            <tr>
              <Th>Sport</Th>
              <Th className="text-right">Activities</Th>
              <Th className="text-right">Distance</Th>
              <Th className="text-right">Time</Th>
              <Th className="text-right">Elevation</Th>
              <Th className="text-right">Avg pace/speed</Th>
              <Th className="text-right">Avg HR</Th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((s) => (
              <tr key={s.sport_type}>
                <Td>
                  <span>
                    {sportEmoji(s.sport_type)} {s.sport_type}
                  </span>
                </Td>
                <Td className="text-right tabular-nums">{s.count}</Td>
                <Td className="text-right tabular-nums">{formatDistance(s.distance_m)}</Td>
                <Td className="text-right tabular-nums">{formatDuration(s.moving_time_s)}</Td>
                <Td className="text-right tabular-nums">{formatElevation(s.elevation_m)}</Td>
                <Td className="text-right tabular-nums">
                  {formatPaceOrSpeed(s.avg_speed_mps, s.sport_type)}
                </Td>
                <Td className="text-right tabular-nums">
                  {s.avg_hr ? `${Math.round(s.avg_hr)} bpm` : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Section>
    </>
  );
}
