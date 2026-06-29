"use client";

import { Cell, Pie, PieChart } from "recharts";
import type { AttendanceBreakdown } from "../service";

export function AttendanceDonut({ data }: { data: AttendanceBreakdown }) {
  // Agrupar tardanzas en presentes para la distribución binaria (Presentes vs Ausencias)
  const presentValue = data.present + data.late;
  const totalValue = presentValue + data.absent;

  const slices = [
    { key: "present", label: "Presentes", color: "var(--present)", value: presentValue },
    { key: "absent", label: "Ausencias", color: "var(--absent)", value: data.absent },
  ].filter((s) => s.value > 0);

  if (totalValue === 0) {
    return (
      <div className="flex h-50 items-center justify-center text-sm text-muted-foreground">
        Aún no hay asistencias registradas.
      </div>
    );
  }

  const listItems = [
    { key: "present", label: "Presentes", color: "var(--present)", value: presentValue },
    { key: "absent", label: "Ausencias", color: "var(--absent)", value: data.absent },
  ];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-45 shrink-0">
        <PieChart width={180} height={180}>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={84}
            paddingAngle={2}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {slices.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            {totalValue}
          </span>
          <span className="eyebrow">Marcas</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {listItems.map((s) => {
          const value = s.value;
          const pct =
            totalValue > 0 ? Math.round((value / totalValue) * 100) : 0;
          return (
            <li key={s.key} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-xs"
                style={{ background: s.color }}
              />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-mono tabular-nums text-foreground">{value}</span>
              <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
