"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts";

const STRAVA = "#fc4c02";
const SECONDARY = "#3aa1ff";
const PALETTE = ["#fc4c02", "#3aa1ff", "#7d5cff", "#22c55e", "#facc15", "#f472b6", "#06b6d4", "#a3a3a3"];
const GRID = "#2a2e36";
const FG_MUTED = "#8b929d";

const tooltipStyle = {
  background: "#15171c",
  border: "1px solid #2a2e36",
  borderRadius: 8,
  fontSize: 12,
  color: "#e7e9ee",
};

export type FormatKind =
  | "int"
  | "km"
  | "duration"
  | "pace"
  | "bpm"
  | "hours"
  | "distance_m"
  | "minutes"
  | "elev_m"
  | "count";

function makeFormatter(kind?: FormatKind): ((v: number) => string) | undefined {
  if (!kind) return undefined;
  switch (kind) {
    case "int":
      return (v) => Math.round(v).toString();
    case "km":
      return (v) => `${Math.round(v)} km`;
    case "duration":
      return (v) => {
        const h = Math.floor(v / 3600);
        const m = Math.floor((v % 3600) / 60);
        if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
        return `${m}m`;
      };
    case "pace":
      return (v) => {
        if (!v || v <= 0) return "—";
        const m = Math.floor(v / 60);
        const s = Math.round(v % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
      };
    case "bpm":
      return (v) => `${Math.round(v)}`;
    case "hours":
      return (v) => `${(v / 3600).toFixed(1)}h`;
    case "distance_m":
      return (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} km` : `${Math.round(v)} m`);
    case "minutes":
      return (v) => `${Math.round(v)} min`;
    case "elev_m":
      return (v) => `${Math.round(v)} m`;
    case "count":
      return (v) => Math.round(v).toString();
  }
}

export function LineSeries({
  data,
  xKey,
  series,
  height = 240,
  format,
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: { key: string; label: string; color?: string; strokeDasharray?: string }[];
  height?: number;
  format?: FormatKind;
}) {
  const fmt = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: FG_MUTED, fontSize: 11 }} stroke={GRID} />
        <YAxis tick={{ fill: FG_MUTED, fontSize: 11 }} stroke={GRID} tickFormatter={fmt} width={48} />
        <Tooltip contentStyle={tooltipStyle} formatter={fmt as never} />
        <Legend wrapperStyle={{ fontSize: 11, color: FG_MUTED }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={false}
            strokeDasharray={s.strokeDasharray}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaSeries({
  data,
  xKey,
  yKey,
  yLabel,
  height = 240,
  format,
  color = STRAVA,
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  yLabel?: string;
  height?: number;
  format?: FormatKind;
  color?: string;
}) {
  const fmt = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id={`g-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: FG_MUTED, fontSize: 11 }} stroke={GRID} />
        <YAxis tick={{ fill: FG_MUTED, fontSize: 11 }} stroke={GRID} tickFormatter={fmt} width={48} />
        <Tooltip contentStyle={tooltipStyle} formatter={fmt as never} />
        <Area
          type="monotone"
          dataKey={yKey}
          name={yLabel ?? yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#g-${yKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({
  data,
  xKey,
  yKey,
  height = 200,
  format,
  color = STRAVA,
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
  format?: FormatKind;
  color?: string;
}) {
  const fmt = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: FG_MUTED, fontSize: 11 }} stroke={GRID} />
        <YAxis tick={{ fill: FG_MUTED, fontSize: 11 }} stroke={GRID} tickFormatter={fmt} width={48} />
        <Tooltip contentStyle={tooltipStyle} formatter={fmt as never} />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GroupedBarSeries({
  data,
  xKey,
  series,
  height = 240,
  format,
}: {
  data: Array<Record<string, unknown>>;
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  format?: FormatKind;
}) {
  const fmt = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: FG_MUTED, fontSize: 11 }} stroke={GRID} />
        <YAxis tick={{ fill: FG_MUTED, fontSize: 11 }} stroke={GRID} tickFormatter={fmt} width={48} />
        <Tooltip contentStyle={tooltipStyle} formatter={fmt as never} />
        <Legend wrapperStyle={{ fontSize: 11, color: FG_MUTED }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color ?? PALETTE[i % PALETTE.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data,
  height = 260,
  format,
}: {
  data: { name: string; value: number }[];
  height?: number;
  format?: FormatKind;
}) {
  const fmt = makeFormatter(format);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          stroke="#0b0c0e"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={fmt as never} />
        <Legend wrapperStyle={{ fontSize: 11, color: FG_MUTED }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { STRAVA, SECONDARY, PALETTE };
