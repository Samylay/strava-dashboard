import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader, Card, Section, Stat, Table, Th, Td, Pill } from "@/components/ui";
import { ActivityMap } from "@/components/activity-map";
import { StreamsChart } from "@/components/activity-streams-chart";
import { getActivityById, getSplits, getStreams } from "@/lib/queries";
import { loadActivityDetail } from "@/lib/sync";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatPaceOrSpeed,
  sportEmoji,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ActivityPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const activity = getActivityById(id);
  if (!activity) notFound();

  let streams = getStreams(id);
  let splits = getSplits(id);
  if (Object.keys(streams).length === 0) {
    try {
      await loadActivityDetail(id);
      streams = getStreams(id);
      splits = getSplits(id);
    } catch {
      // soft-fail
    }
  }

  const distArr = (streams.distance as number[] | undefined) ?? [];
  const altArr = (streams.altitude as number[] | undefined) ?? [];
  const hrArr = (streams.heartrate as number[] | undefined) ?? [];
  const velArr = (streams.velocity_smooth as number[] | undefined) ?? [];

  const sampleEvery = Math.max(1, Math.floor(distArr.length / 600));
  const chartData: { km: number; alt?: number; hr?: number; pace?: number }[] = [];
  for (let i = 0; i < distArr.length; i += sampleEvery) {
    const km = distArr[i] / 1000;
    const row: { km: number; alt?: number; hr?: number; pace?: number } = { km };
    if (altArr[i] != null) row.alt = altArr[i];
    if (hrArr[i] != null) row.hr = hrArr[i];
    if (velArr[i] != null && velArr[i] > 0.5) row.pace = 1000 / velArr[i];
    chartData.push(row);
  }

  return (
    <>
      <PageHeader
        title={activity.name}
        subtitle={
          format(new Date(activity.start_date_local ?? activity.start_date), "EEE, MMM d, yyyy · HH:mm") +
          ` · ${activity.sport_type}`
        }
        right={
          <Pill active>
            {sportEmoji(activity.sport_type)} {activity.sport_type}
          </Pill>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <Stat label="Distance" value={formatDistance(activity.distance_m)} accent />
        <Stat label="Moving time" value={formatDuration(activity.moving_time_s)} />
        <Stat label="Elapsed" value={formatDuration(activity.elapsed_time_s)} />
        <Stat label="Pace / Speed" value={formatPaceOrSpeed(activity.average_speed_mps, activity.sport_type)} />
        <Stat
          label="Avg HR"
          value={activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : "—"}
          hint={activity.max_heartrate ? `max ${Math.round(activity.max_heartrate)}` : undefined}
        />
        <Stat label="Elevation" value={formatElevation(activity.total_elevation_gain_m)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card>
          <Section title="Route"><div /></Section>
          <ActivityMap encodedPolyline={activity.polyline} />
        </Card>

        <Card>
          <Section title="Profile"><div /></Section>
          {chartData.length > 0 ? (
            <div className="space-y-3">
              {altArr.length > 0 && (
                <StreamsChart
                  data={chartData}
                  yKey="alt"
                  color="#7d5cff"
                  yLabel="Elevation (m)"
                  format="int"
                />
              )}
              {hrArr.length > 0 && (
                <StreamsChart
                  data={chartData}
                  yKey="hr"
                  color="#ef4444"
                  yLabel="Heart rate (bpm)"
                  format="int"
                />
              )}
              {velArr.length > 0 && (
                <StreamsChart
                  data={chartData}
                  yKey="pace"
                  color="#22c55e"
                  yLabel="Pace (sec/km, lower = faster)"
                  format="pace"
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-fg-muted">No streams available for this activity.</p>
          )}
        </Card>
      </div>

      {splits.length > 0 && (
        <Section title="Splits">
          <Table>
            <thead>
              <tr>
                <Th>Lap</Th>
                <Th className="text-right">Distance</Th>
                <Th className="text-right">Time</Th>
                <Th className="text-right">Pace / Speed</Th>
                <Th className="text-right">Avg HR</Th>
                <Th className="text-right">Elev Δ</Th>
              </tr>
            </thead>
            <tbody>
              {splits.map((s) => (
                <tr key={s.split_index}>
                  <Td>{s.split_index + 1}</Td>
                  <Td className="text-right tabular-nums">{formatDistance(s.distance_m)}</Td>
                  <Td className="text-right tabular-nums">{formatDuration(s.moving_time_s)}</Td>
                  <Td className="text-right tabular-nums">
                    {formatPaceOrSpeed(s.average_speed_mps, activity.sport_type)}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {s.average_heartrate ? `${Math.round(s.average_heartrate)} bpm` : "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {s.elevation_diff_m != null ? `${Math.round(s.elevation_diff_m)} m` : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>
      )}
    </>
  );
}
