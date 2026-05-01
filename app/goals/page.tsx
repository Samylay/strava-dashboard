import { PageHeader, Card, Section, EmptyState } from "@/components/ui";
import { GoalForm, MaxHrForm } from "@/components/goals-form";
import {
  getActivities,
  getActivityCount,
  getDistinctSports,
  getGoals,
  getSyncState,
} from "@/lib/queries";
import { formatDistance, sportEmoji } from "@/lib/format";
import { startOfYear, differenceInCalendarDays, endOfYear } from "date-fns";

export const dynamic = "force-dynamic";

export default function GoalsPage() {
  if (getActivityCount() === 0) return <EmptyState title="No activities yet" />;

  const year = new Date().getFullYear();
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const today = new Date();
  const dayOfYear = differenceInCalendarDays(today, yearStart) + 1;
  const totalDays = differenceInCalendarDays(yearEnd, yearStart) + 1;

  const sports = getDistinctSports();
  const goals = getGoals(year);
  const goalMap = new Map(goals.map((g) => [g.sport_type, g]));

  const ytdRows = getActivities({ from: yearStart.toISOString() });
  const ytdBySport = new Map<string, number>();
  for (const r of ytdRows) {
    ytdBySport.set(r.sport_type, (ytdBySport.get(r.sport_type) ?? 0) + (r.distance_m ?? 0));
  }

  const state = getSyncState();
  const maxHr = state.max_hr_override ? Number(state.max_hr_override) : null;

  return (
    <>
      <PageHeader title="Goals" subtitle={`${year} · day ${dayOfYear} / ${totalDays}`} />

      <Section title="Yearly distance targets">
        <div className="space-y-3">
          {sports.map((s) => {
            const ytd = ytdBySport.get(s) ?? 0;
            const goal = goalMap.get(s);
            const target = goal?.target_distance_m ?? null;
            const pct = target ? Math.min(100, (ytd / target) * 100) : 0;
            const projected = (ytd / dayOfYear) * totalDays;
            return (
              <Card key={s}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{sportEmoji(s)}</span>
                    <span className="font-medium">{s}</span>
                  </div>
                  <GoalForm
                    year={year}
                    sport={s}
                    initialDistanceKm={target ? target / 1000 : null}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-fg-subtle text-xs">YTD</div>
                    <div className="tabular-nums">{formatDistance(ytd)}</div>
                  </div>
                  <div>
                    <div className="text-fg-subtle text-xs">Target</div>
                    <div className="tabular-nums">{target ? formatDistance(target) : "—"}</div>
                  </div>
                  <div>
                    <div className="text-fg-subtle text-xs">Projected EOY</div>
                    <div className="tabular-nums">{formatDistance(projected)}</div>
                  </div>
                </div>
                {target ? (
                  <div className="mt-3 h-2 rounded-full bg-bg-subtle overflow-hidden">
                    <div
                      className="h-full bg-strava transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-fg-muted">
                    Set a target above to track progress.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title="Settings">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Max HR override</div>
              <div className="text-xs text-fg-muted mt-1">
                Used to compute HR zones. Defaults to your highest recorded HR.
              </div>
            </div>
            <MaxHrForm initial={maxHr} />
          </div>
        </Card>
      </Section>
    </>
  );
}
