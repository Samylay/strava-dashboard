"use client";

import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

interface Value {
  date: string; // YYYY-MM-DD
  count: number; // any numeric value
}

export function ActivityHeatmap({
  values,
  startDate,
  endDate,
  unit = "",
}: {
  values: Value[];
  startDate: Date;
  endDate: Date;
  unit?: string;
}) {
  const max = values.reduce((m, v) => Math.max(m, v.count), 0);

  const colorScale = (count: number) => {
    if (count <= 0) return "color-empty";
    const ratio = count / max;
    if (ratio < 0.2) return "color-1";
    if (ratio < 0.4) return "color-2";
    if (ratio < 0.6) return "color-3";
    if (ratio < 0.8) return "color-4";
    return "color-5";
  };

  return (
    <div className="strava-heatmap">
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        gutterSize={2}
        showWeekdayLabels
        classForValue={(v) => colorScale(v?.count ?? 0)}
        titleForValue={(v) => {
          if (!v) return "no activity";
          return `${v.date}: ${v.count}${unit ? " " + unit : ""}`;
        }}
      />
      <style jsx global>{`
        .strava-heatmap .react-calendar-heatmap text {
          fill: #5a606b;
          font-size: 9px;
        }
        .strava-heatmap rect.color-empty { fill: #1d2026; }
        .strava-heatmap rect.color-1 { fill: #4a1c00; }
        .strava-heatmap rect.color-2 { fill: #7d2e00; }
        .strava-heatmap rect.color-3 { fill: #b53e00; }
        .strava-heatmap rect.color-4 { fill: #e24a00; }
        .strava-heatmap rect.color-5 { fill: #fc4c02; }
        .strava-heatmap rect { rx: 2; ry: 2; }
      `}</style>
    </div>
  );
}
