import { PageHeader, Stat, Section, Card, EmptyState, Pill } from "@/components/ui";
import { PeriodPicker, SportFilter } from "@/components/filters";
import { AreaSeries } from "@/components/charts";
import { getActivities, getActivityCount, getDistinctSports } from "@/lib/queries";
import { kpisForActivities, currentStreak, weeklyBuckets, isoWeekKey } from "@/lib/stats";
import { resolvePeriod } from "@/lib/periods";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatNumber,
  sportEmoji,
} from "@/lib/format";
import { subWeeks, startOfWeek, format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Page({
  searchParams,
}: {
  searchParams: { period?: string; sport?: string };
}) {
  const count = getActivityCount();
  if (count === 0) {
    return (
      <EmptyState
        title="No activities yet"
        body="Run an initial sync to pull your Strava history. Make sure your Strava account is connected in Composio."
        cta={
          <code className="rounded bg-bg-subtle px-2 py-1 text-xs">
            click Sync in the header
          </code>
        }
      />
    );
  }

  const period = resolvePeriod(searchParams.period);
  const sport = searchParams.sport ?? null;
  const sports = getDistinctSports();
  const rows = getActivities({
    from: period.from.toISOString(),
    to: period.to.toISOString(),
    sport,
  });

  const kpis = kpisForActivities(rows, period.days);
  const streak = currentStreak(getActivities({ sport }));

  // 12-week mini chart (always last 12 weeks regardless of period)
  const twelveStart = startOfWeek(subWeeks(new Date(), 11), { weekStartsOn: 1 });
  const twelveRows = getActivities({ from: twelveStart.toISOString(), sport });
  const buckets = weeklyBuckets(twelveRows, "distance_m");
  const bucketMap = new Map(buckets.map((b) => [b.weekStart, b.value]));
  const twelveData = Array.from({ length: 12 }, (_, i) => {
    const ws = startOfWeek(subWeeks(new Date(), 11 - i), { weekStartsOn: 1 });
    const wsKey = isoWeekKey(ws);
    return { week: format(ws, "MMM d"), km: (bucketMap.get(wsKey) ?? 0) / 1000 };
  });

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={period.label + (sport && sport !== "all" ? ` · ${sport}` : "")}
        right={
          <>
            <SportFilter sports={sports} />
            <PeriodPicker />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
        <Stat label="Distance" value={formatDistance(kpis.distance)} accent />
        <Stat label="Moving time" value={formatDuration(kpis.time)} />
        <Stat label="Elevation" value={formatElevation(kpis.elevation)} />
        <Stat label="Activities" value={formatNumber(kpis.count)} />
        <Stat label="Weekly avg" value={formatDistance(kpis.weeklyAvgDistance)} />
        <Stat label="Streak" value={`${streak} d`} hint="consecutive active days" />
      </div>

      <Section title="Last 12 weeks · distance">
        <Card>
          <AreaSeries data={twelveData} xKey="week" yKey="km" yLabel="Distance" format="km" />
        </Card>
      </Section>

      <Section title="Recent activities">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.slice(0, 6).map((a) => (
            <Link
              href={`/activity/${a.id}`}
              key={a.id}
              className="block rounded-lg border border-bg-border bg-bg-card p-4 hover:border-strava/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
                    <span>
                      {sportEmoji(a.sport_type)} {a.sport_type}
                    </span>
                    <span>·</span>
                    <span>{format(new Date(a.start_date_local ?? a.start_date), "MMM d")}</span>
                  </div>
                </div>
                {a.achievement_count > 0 && (
                  <Pill className="shrink-0">🏅 {a.achievement_count}</Pill>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-fg-subtle">dist</div>
                  <div className="tabular-nums">{formatDistance(a.distance_m)}</div>
                </div>
                <div>
                  <div className="text-fg-subtle">time</div>
                  <div className="tabular-nums">{formatDuration(a.moving_time_s)}</div>
                </div>
                <div>
                  <div className="text-fg-subtle">elev</div>
                  <div className="tabular-nums">{formatElevation(a.total_elevation_gain_m)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
