import { PageHeader, Card, Section, EmptyState } from "@/components/ui";
import { PeriodPicker } from "@/components/filters";
import { BarSeries, GroupedBarSeries } from "@/components/charts";
import { getActivities, getActivityCount, getStreams, getSyncState } from "@/lib/queries";
import { hrHistogram, paceHistogram, hrZoneBuckets, type HrZones } from "@/lib/stats";
import { resolvePeriod } from "@/lib/periods";

export const dynamic = "force-dynamic";

export default function DistributionsPage({
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

  const runHist = paceHistogram(rows, "Run");
  const rideHist = paceHistogram(rows, "Ride");
  const hrHist = hrHistogram(rows);

  // Aggregate HR zones across activities that have streams
  const state = getSyncState();
  const maxHr =
    Number(state.max_hr_override) ||
    Math.max(...rows.map((r) => r.max_heartrate ?? 0)) ||
    190;

  const totalZones: HrZones = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
  let zoneCovered = 0;
  for (const r of rows) {
    const s = getStreams(r.id);
    if (Array.isArray(s.heartrate) && Array.isArray(s.time)) {
      const z = hrZoneBuckets(s.heartrate as number[], s.time as number[], maxHr);
      totalZones.z1 += z.z1;
      totalZones.z2 += z.z2;
      totalZones.z3 += z.z3;
      totalZones.z4 += z.z4;
      totalZones.z5 += z.z5;
      zoneCovered++;
    }
  }
  const zoneData = [
    { zone: "Z1", value: Math.round(totalZones.z1 / 60) },
    { zone: "Z2", value: Math.round(totalZones.z2 / 60) },
    { zone: "Z3", value: Math.round(totalZones.z3 / 60) },
    { zone: "Z4", value: Math.round(totalZones.z4 / 60) },
    { zone: "Z5", value: Math.round(totalZones.z5 / 60) },
  ];

  return (
    <>
      <PageHeader
        title="Distributions"
        subtitle={period.label}
        right={<PeriodPicker />}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <Card>
          <Section title="Run pace histogram (min/km)"><div /></Section>
          {runHist.length > 0 ? (
            <BarSeries data={runHist} xKey="label" yKey="count" color="#fc4c02" />
          ) : (
            <p className="text-sm text-fg-muted">No run activities in this period.</p>
          )}
        </Card>

        <Card>
          <Section title="Ride pace histogram (min/km)"><div /></Section>
          {rideHist.length > 0 ? (
            <BarSeries data={rideHist} xKey="label" yKey="count" color="#3aa1ff" />
          ) : (
            <p className="text-sm text-fg-muted">No ride activities in this period.</p>
          )}
        </Card>

        <Card>
          <Section title="Heart rate distribution (bpm)"><div /></Section>
          {hrHist.length > 0 ? (
            <BarSeries data={hrHist} xKey="label" yKey="count" color="#ef4444" />
          ) : (
            <p className="text-sm text-fg-muted">No HR data in this period.</p>
          )}
        </Card>

        <Card>
          <Section
            title={`HR zones (minutes) · max HR ${maxHr}`}
            right={
              <span className="text-xs text-fg-muted">
                {zoneCovered} activities with streams
              </span>
            }
          >
            <div />
          </Section>
          {zoneCovered > 0 ? (
            <GroupedBarSeries
              data={zoneData}
              xKey="zone"
              series={[{ key: "value", label: "minutes", color: "#fc4c02" }]}
            />
          ) : (
            <p className="text-sm text-fg-muted">
              Open an activity to load streams; HR zones populate as you do.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
