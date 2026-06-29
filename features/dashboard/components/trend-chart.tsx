"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SessionTrendPoint } from "../service";

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: SessionTrendPoint }[];
}

function ChartTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{p.course}</p>
      <p className="text-muted-foreground">{p.label}</p>
      <p className="mt-1 font-mono tabular-nums">
        {p.rate}% asistencia · {p.total} marcas
      </p>
    </div>
  );
}

export function TrendChart({ data }: { data: SessionTrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Cuando cierres sesiones de asistencia verás la tendencia aquí.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--marker)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--marker)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          dy={6}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(v) => `${v}%`}
          width={40}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="var(--marker)"
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={{ r: 3, fill: "var(--marker)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
