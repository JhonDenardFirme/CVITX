"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export default function CompareConfChart({ baseline, cmt }) {
  if (!baseline || !cmt) return null;

  const data = [
    { metric: "type", baseline: baseline.type_conf ?? 0, cmt: cmt.type_conf ?? 0 },
    { metric: "make", baseline: baseline.make_conf ?? 0, cmt: cmt.make_conf ?? 0 },
    { metric: "model", baseline: baseline.model_conf ?? 0, cmt: cmt.model_conf ?? 0 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="metric" />
          <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 1]} />
          <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
          <Legend />
          <Bar dataKey="baseline" name="Baseline" />
          <Bar dataKey="cmt" name="CMT" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
