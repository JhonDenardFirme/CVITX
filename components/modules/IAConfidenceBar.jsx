"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// expects 0..1 values; we render them as 0..100
function toPct100(x) {
  if (x == null || Number.isNaN(+x)) return 0;
  const n = Math.max(0, Math.min(1, +x));
  return Math.round(n * 100);
}

/** IAConfidenceBar
 * props: { baseline, cmt }
 * baseline/cmt follow your variant shape with *_conf fields (0..1).
 */
export default function IAConfidenceBar({ baseline, cmt }) {
  if (!baseline && !cmt) return null;

  const chartData = [
    {
      metric: "Type",
      baseline: toPct100(baseline?.type_conf),
      cmt: toPct100(cmt?.type_conf),
    },
    {
      metric: "Make",
      baseline: toPct100(baseline?.make_conf),
      cmt: toPct100(cmt?.make_conf),
    },
    {
      metric: "Model",
      baseline: toPct100(baseline?.model_conf),
      cmt: toPct100(cmt?.model_conf),
    },
  ];

  // shadcn chart color tokens
  const chartConfig = {
    baseline: { label: "Baseline", color: "var(--chart-1)" },
    cmt: { label: "CMT", color: "var(--chart-2)" },
  };

  return (
    <ChartContainer config={chartConfig} className="w-full h-64">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="metric"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={28}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
          formatter={(val, name) => [`${val}%`, name === "baseline" ? "Baseline" : "CMT"]}
        />
        <Bar
          dataKey="baseline"
          name="Baseline"
          fill="var(--color-baseline)"
          radius={4}
        />
        <Bar dataKey="cmt" name="CMT" fill="var(--color-cmt)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
