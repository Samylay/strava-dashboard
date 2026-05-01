import { PageHeader, Card, Section, EmptyState } from "@/components/ui";
import { PeriodPicker, SportFilter } from "@/components/filters";
import { LineSeries } from "@/components/charts";
import { getActivities, getActivityCount, getDistinctSports } from "@/lib/queries";
import { rollingAverage, weeklyBuckets, type BucketKey } from "@/lib/stats";
import { resolvePeriod } from "@/lib/periods";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function build(rows: ReturnType<typeof getActivities>, key: BucketKey, divisor = 1) {
  const buckets = weeklyBuckets(rows, key);
  const values = buckets.map((b) => b.value / divisor);
  const ra = rollingAverage(values, 4);
  return buckets.map((b, i) => ({
    week: format(new Date(b.weekStart), "MMM d"),
    value: values[i],
    rolling: ra[i] ?? undefined,
  }));
}

function buildAvg(
  rows: ReturnType<typeof getActivities>,
  field: "average_heartrate" | "average_speed_mps"
) {
  // weekly average of activity averages, weighted by moving_time
  const map = new Map<string, { sum: number; weight: number; weekStart: string }>();
  for (const r of rows) {
    if (r[field] == null) continue;
    const d = new Date(r.start_date_local ?? r.start_date);
    const ws = (() => {
      const x = new Date(d);
      const day = x.getUTCDay() || 7;
      if (day !== 1) x.setUTCDate(x.getUTCDate() - (day - 1));
      x.setUTCHours(0, 0, 0, 0);
      return x.toISOString().slice(0, 10);
    })();
    const cur = map.get(ws) ?? { sum: 0, weight: 0, weekStart: ws };
    const w = r.moving_time_s ?? 1;
    cur.sum += (r[field] as number) * w;
    cur.weight += w;
    map.set(ws, cur);
  }
  const arr = Array.from(map.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const values = arr.map((b) => (b.weight > 0 ? b.sum / b.weight : 0));
  const ra = rollingAverage(values, 4);
  return arr.map((b, i) => ({
    week: format(new Date(b.weekStart), "MMM d"),
    value: values[i],
    rolling: ra[i] ?? undefined,
  }));
}

export default function TrendsPage({
  searchParams,
}: {
  searchParams: { period?: string; sport?: string };
}) {
  if (getActivityCount() === 0) return <EmptyState title="No activities yet" />;

  const period = resolvePeriod(searchParams.period ?? "all");
  const sport = searchParams.sport ?? null;
  const sports = getDistinctSports();
  const rows = getActivities({
    from: period.from.toISOString(),
    to: period.to.toISOString(),
    sport,
  });

  const distance = build(rows, "distance_m", 1000); // km
  const elevation = build(rows, "total_elevation_gain_m");
  const hr = buildAvg(rows, "average_heartrate");
  const speed = buildAvg(rows, "average_speed_mps");
  // pace: convert avg speed (mps) to sec/km
  const pace = speed.map((s) => ({
    week: s.week,
    value: s.value > 0 ? 1000 / s.value : 0,
    rolling: s.rolling && s.rolling > 0 ? 1000 / s.rolling : undefined,
  }));

  return (
    <>
      <PageHeader
        title="Trends"
        subtitle="Weekly metrics with 4-week rolling average"
        right={
          <>
            <SportFilter sports={sports} />
            <PeriodPicker />
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <Section title="Distance per week (km)"><div /></Section>
          <LineSeries
            data={distance}
            xKey="week"
            series={[
              { key: "value", label: "Weekly", color: "#fc4c02" },
              { key: "rolling", label: "4-wk avg", color: "#fcb482", strokeDasharray: "4 4" },
            ]}
            format="int"
          />
        </Card>

        <Card>
          <Section title="Elevation per week (m)"><div /></Section>
          <LineSeries
            data={elevation}
            xKey="week"
            series={[
              { key: "value", label: "Weekly", color: "#7d5cff" },
              { key: "rolling", label: "4-wk avg", color: "#b9a6ff", strokeDasharray: "4 4" },
            ]}
            format="int"
          />
        </Card>

        <Card>
          <Section title="Avg HR per week (bpm)"><div /></Section>
          <LineSeries
            data={hr}
            xKey="week"
            series={[
              { key: "value", label: "Weekly", color: "#ef4444" },
              { key: "rolling", label: "4-wk avg", color: "#fca5a5", strokeDasharray: "4 4" },
            ]}
            format="int"
          />
        </Card>

        <Card>
          <Section title="Avg pace (sec/km, lower = faster)"><div /></Section>
          <LineSeries
            data={pace}
            xKey="week"
            series={[
              { key: "value", label: "Weekly", color: "#22c55e" },
              { key: "rolling", label: "4-wk avg", color: "#86efac", strokeDasharray: "4 4" },
            ]}
            format="pace"
          />
        </Card>
      </div>
    </>
  );
}
