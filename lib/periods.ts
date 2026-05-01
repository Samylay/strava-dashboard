import { startOfWeek, startOfMonth, startOfYear, subDays, subMonths, subYears, endOfWeek, endOfMonth, endOfYear } from "date-fns";

export type PeriodSpec = "week" | "month" | "year" | "all" | "ytd" | "30d" | "90d";

export interface ResolvedPeriod {
  from: Date;
  to: Date;
  days: number;
  label: string;
}

export function resolvePeriod(spec: string | undefined | null, now = new Date()): ResolvedPeriod {
  const s = (spec ?? "year") as PeriodSpec;
  const to = now;
  let from: Date;
  let label = "";
  switch (s) {
    case "week":
      from = startOfWeek(now, { weekStartsOn: 1 });
      label = "This week";
      break;
    case "month":
      from = startOfMonth(now);
      label = "This month";
      break;
    case "year":
      from = startOfYear(now);
      label = "This year";
      break;
    case "ytd":
      from = startOfYear(now);
      label = "Year to date";
      break;
    case "30d":
      from = subDays(now, 30);
      label = "Last 30 days";
      break;
    case "90d":
      from = subDays(now, 90);
      label = "Last 90 days";
      break;
    case "all":
    default:
      from = new Date("2000-01-01");
      label = "All time";
  }
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  return { from, to, days, label };
}

export function previousEquivalent(p: ResolvedPeriod): ResolvedPeriod {
  const span = p.to.getTime() - p.from.getTime();
  return {
    from: new Date(p.from.getTime() - span),
    to: new Date(p.to.getTime() - span),
    days: p.days,
    label: `Previous ${p.label.toLowerCase()}`,
  };
}

export const PERIOD_OPTIONS: { value: PeriodSpec; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];
