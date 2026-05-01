"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FormatKind = "int" | "pace";

function fmt(kind: FormatKind, v: number): string {
  if (kind === "int") return Math.round(v).toString();
  if (kind === "pace") {
    if (!v || v <= 0) return "—";
    const m = Math.floor(v / 60);
    const s = Math.round(v % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return String(v);
}

export function StreamsChart({
  data,
  yKey,
  color,
  yLabel,
  format = "int",
  height = 180,
}: {
  data: { km: number; [k: string]: number | null | undefined }[];
  yKey: string;
  color: string;
  yLabel: string;
  format?: FormatKind;
  height?: number;
}) {
  const f = (v: number) => fmt(format, v);
  return (
    <div>
      <div className="text-xs text-fg-muted mb-1">{yLabel}</div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#2a2e36" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="km"
            type="number"
            tick={{ fill: "#8b929d", fontSize: 10 }}
            tickFormatter={(v) => `${(v as number).toFixed(1)}`}
            domain={["dataMin", "dataMax"]}
            stroke="#2a2e36"
          />
          <YAxis tick={{ fill: "#8b929d", fontSize: 10 }} tickFormatter={f} stroke="#2a2e36" width={42} />
          <Tooltip
            contentStyle={{
              background: "#15171c",
              border: "1px solid #2a2e36",
              borderRadius: 6,
              fontSize: 11,
            }}
            formatter={f as never}
            labelFormatter={(l) => `${(l as number).toFixed(2)} km`}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
