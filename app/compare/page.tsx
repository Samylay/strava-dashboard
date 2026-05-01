import { PageHeader, Card, Section, Stat, EmptyState } from "@/components/ui";
import { LineSeries } from "@/components/charts";
import { getActivities, getActivityCount } from "@/lib/queries";
import { kpisForActivities, comparePeriods } from "@/lib/stats";
import { resolvePeriod, previousEquivalent } from "@/lib/periods";
import { formatDistance, formatDuration, formatElevation, formatNumber } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PRESETS = [
  { label: "This month vs last", a: "month", b: "prev" },
  { label: "Last 30 days vs prior", a: "30d", b: "prev" },
  { label: "YTD vs last YTD", a: "ytd", b: "prevYear" },
  { label: "This year vs last", a: "year", b: "prevYear" },
];

function resolveCompareB(spec: string, aSpec: string) {
  if (spec === "prev") return previousEquivalent(resolvePeriod(aSpec));
  if (spec === "prevYear") {
    const a = resolvePeriod(aSpec);
    const from = new Date(a.from);
    from.setFullYear(from.getFullYear() - 1);
    const to = new Date(a.to);
    to.setFullYear(to.getFullYear() - 1);
    return {
      from,
      to,
      days: a.days,
      label: `${a.label} (last year)`,
    };
  }
  return resolvePeriod(spec);
}

export default function ComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string };
}) {
  if (getActivityCount() === 0) return <EmptyState title="No activities yet" />;

  const aSpec = searchParams.a ?? "month";
  const bSpec = searchParams.b ?? "prev";
  const a = resolvePeriod(aSpec);
  const b = resolveCompareB(bSpec, aSpec);

  const aRows = getActivities({ from: a.from.toISOString(), to: a.to.toISOString() });
  const bRows = getActivities({ from: b.from.toISOString(), to: b.to.toISOString() });

  const aKpis = kpisForActivities(aRows, a.days);
  const bKpis = kpisForActivities(bRows, b.days);
  const cmp = comparePeriods(aRows, bRows, "distance_m");

  const len = Math.max(cmp.aWeekly.length, cmp.bWeekly.length, 1);
  const overlay = Array.from({ length: len }, (_, i) => ({
    week: `W${i + 1}`,
    a: (cmp.aWeekly[i] ?? 0) / 1000,
    b: (cmp.bWeekly[i] ?? 0) / 1000,
  }));

  const delta = (av: number, bv: number) => {
    if (bv === 0) return av > 0 ? "+∞" : "0%";
    const pct = ((av - bv) / bv) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  };

  return (
    <>
      <PageHeader
        title="Compare periods"
        subtitle={`${a.label} vs ${b.label}`}
        right={
          <div className="flex items-center gap-1 rounded-md border border-bg-border bg-bg-card p-1">
            {PRESETS.map((p) => (
              <Link
                key={p.label}
                href={`/compare?a=${p.a}&b=${p.b}`}
                className={`rounded px-2.5 py-1 text-xs ${
                  aSpec === p.a && bSpec === p.b
                    ? "bg-strava/15 text-strava"
                    : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat
          label="Distance"
          value={formatDistance(aKpis.distance)}
          hint={`${formatDistance(bKpis.distance)} prev · ${delta(aKpis.distance, bKpis.distance)}`}
          accent
        />
        <Stat
          label="Time"
          value={formatDuration(aKpis.time)}
          hint={`${formatDuration(bKpis.time)} prev · ${delta(aKpis.time, bKpis.time)}`}
        />
        <Stat
          label="Elevation"
          value={formatElevation(aKpis.elevation)}
          hint={`${formatElevation(bKpis.elevation)} prev · ${delta(aKpis.elevation, bKpis.elevation)}`}
        />
        <Stat
          label="Activities"
          value={formatNumber(aKpis.count)}
          hint={`${formatNumber(bKpis.count)} prev · ${delta(aKpis.count, bKpis.count)}`}
        />
      </div>

      <Section title="Weekly distance overlay (km)">
        <Card>
          <LineSeries
            data={overlay}
            xKey="week"
            series={[
              { key: "a", label: a.label, color: "#fc4c02" },
              { key: "b", label: b.label, color: "#3aa1ff" },
            ]}
            format="int"
          />
        </Card>
      </Section>
    </>
  );
}
