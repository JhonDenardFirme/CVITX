// File: components/modules/VideoConfidenceBar.jsx
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

/** VideoConfidenceBar
 * props: { variant }
 * variant follows your detection shape with *_conf fields (0..1).
 */
export default function VideoConfidenceBar({ variant }) {
  if (!variant) return null;

  const chartData = [
    {
      metric: "Type",
      cmt: toPct100(variant.type_conf),
    },
    {
      metric: "Make",
      cmt: toPct100(variant.make_conf),
    },
    {
      metric: "Model",
      cmt: toPct100(variant.model_conf),
    },
  ];

  // shadcn chart color tokens
  const chartConfig = {
    cmt: { label: "CMT", color: "var(--chart-1)" },
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
          content={
            <ChartTooltipContent
              indicator="dashed"
              formatter={(val) => [`${val}%`, "CMT"]}
            />
          }
        />
        <Bar
          dataKey="cmt"
          name="CMT"
          fill="var(--color-cmt)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
