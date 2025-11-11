"use client";

import * as React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { EyeOff, FileText, BarChart3, ArrowLeft, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ───────────────────────────────────────────────────────────────
   Dummy Data — SOP 3 across four occlusion levels
   (Replace with backend-fed values when integrated)
   Structure:
   conditions: [
     { level: "Clean" | "Low" | "Mid" | "High",
       data: [
         { level: "Type" | "Make" | "Model" | "Vehicle", metrics: [ ... ] }
       ]
     }
   ]
   ─────────────────────────────────────────────────────────────── */
const sop3Occlusion = {
  conditions: [
    {
      level: "Clean",
      data: [
        {
          level: "Type",
          metrics: [
            { metric: "Accuracy", baseline: 0.904, cmt: 0.934, delta: 0.030, W: 18, p: 0.0123 },
            { metric: "Precision", baseline: 0.896, cmt: 0.932, delta: 0.036, W: 17, p: 0.0111 },
            { metric: "Recall", baseline: 0.899, cmt: 0.934, delta: 0.035, W: 16, p: 0.0098 },
            { metric: "F1", baseline: 0.897, cmt: 0.933, delta: 0.036, W: 16, p: 0.0095 },
          ],
        },
        {
          level: "Make",
          metrics: [
            { metric: "Accuracy", baseline: 0.864, cmt: 0.905, delta: 0.041, W: 17, p: 0.0172 },
            { metric: "Precision", baseline: 0.857, cmt: 0.902, delta: 0.045, W: 16, p: 0.0150 },
            { metric: "Recall", baseline: 0.860, cmt: 0.903, delta: 0.043, W: 16, p: 0.0142 },
            { metric: "F1", baseline: 0.858, cmt: 0.903, delta: 0.045, W: 15, p: 0.0126 },
          ],
        },
        {
          level: "Model",
          metrics: [
            { metric: "Accuracy", baseline: 0.826, cmt: 0.877, delta: 0.051, W: 16, p: 0.0160 },
            { metric: "Precision", baseline: 0.818, cmt: 0.872, delta: 0.054, W: 15, p: 0.0140 },
            { metric: "Recall", baseline: 0.821, cmt: 0.875, delta: 0.054, W: 14, p: 0.0131 },
            { metric: "F1", baseline: 0.819, cmt: 0.874, delta: 0.055, W: 14, p: 0.0124 },
          ],
        },
        {
          level: "Vehicle",
          metrics: [{ metric: "Mean IoU", baseline: 0.842, cmt: 0.873, delta: 0.031, W: 18, p: 0.0184 }],
        },
      ],
    },
    {
      level: "Low",
      data: [
        {
          level: "Type",
          metrics: [
            { metric: "Accuracy", baseline: 0.884, cmt: 0.922, delta: 0.038, W: 18, p: 0.0089 },
            { metric: "Precision", baseline: 0.876, cmt: 0.918, delta: 0.042, W: 17, p: 0.0077 },
            { metric: "Recall", baseline: 0.879, cmt: 0.921, delta: 0.042, W: 17, p: 0.0073 },
            { metric: "F1", baseline: 0.877, cmt: 0.920, delta: 0.043, W: 16, p: 0.0068 },
          ],
        },
        {
          level: "Make",
          metrics: [
            { metric: "Accuracy", baseline: 0.842, cmt: 0.892, delta: 0.050, W: 17, p: 0.0104 },
            { metric: "Precision", baseline: 0.835, cmt: 0.888, delta: 0.053, W: 16, p: 0.0096 },
            { metric: "Recall", baseline: 0.838, cmt: 0.889, delta: 0.051, W: 16, p: 0.0091 },
            { metric: "F1", baseline: 0.836, cmt: 0.889, delta: 0.053, W: 15, p: 0.0083 },
          ],
        },
        {
          level: "Model",
          metrics: [
            { metric: "Accuracy", baseline: 0.802, cmt: 0.862, delta: 0.060, W: 17, p: 0.0064 },
            { metric: "Precision", baseline: 0.795, cmt: 0.858, delta: 0.063, W: 16, p: 0.0060 },
            { metric: "Recall", baseline: 0.798, cmt: 0.859, delta: 0.061, W: 16, p: 0.0056 },
            { metric: "F1", baseline: 0.796, cmt: 0.858, delta: 0.062, W: 15, p: 0.0051 },
          ],
        },
        {
          level: "Vehicle",
          metrics: [{ metric: "Mean IoU", baseline: 0.806, cmt: 0.846, delta: 0.040, W: 18, p: 0.0079 }],
        },
      ],
    },
    {
      level: "Mid",
      data: [
        {
          level: "Type",
          metrics: [
            { metric: "Accuracy", baseline: 0.842, cmt: 0.897, delta: 0.055, W: 18, p: 0.0038 },
            { metric: "Precision", baseline: 0.835, cmt: 0.893, delta: 0.058, W: 17, p: 0.0033 },
            { metric: "Recall", baseline: 0.838, cmt: 0.895, delta: 0.057, W: 17, p: 0.0031 },
            { metric: "F1", baseline: 0.836, cmt: 0.894, delta: 0.058, W: 16, p: 0.0028 },
          ],
        },
        {
          level: "Make",
          metrics: [
            { metric: "Accuracy", baseline: 0.802, cmt: 0.869, delta: 0.067, W: 18, p: 0.0024 },
            { metric: "Precision", baseline: 0.796, cmt: 0.865, delta: 0.069, W: 17, p: 0.0021 },
            { metric: "Recall", baseline: 0.798, cmt: 0.866, delta: 0.068, W: 17, p: 0.0020 },
            { metric: "F1", baseline: 0.797, cmt: 0.865, delta: 0.068, W: 16, p: 0.0018 },
          ],
        },
        {
          level: "Model",
          metrics: [
            { metric: "Accuracy", baseline: 0.762, cmt: 0.838, delta: 0.076, W: 18, p: 0.0019 },
            { metric: "Precision", baseline: 0.755, cmt: 0.834, delta: 0.079, W: 18, p: 0.0017 },
            { metric: "Recall", baseline: 0.758, cmt: 0.836, delta: 0.078, W: 17, p: 0.0016 },
            { metric: "F1", baseline: 0.756, cmt: 0.835, delta: 0.079, W: 17, p: 0.0015 },
          ],
        },
        {
          level: "Vehicle",
          metrics: [{ metric: "Mean IoU", baseline: 0.761, cmt: 0.812, delta: 0.051, W: 18, p: 0.0027 }],
        },
      ],
    },
    {
      level: "High",
      data: [
        {
          level: "Type",
          metrics: [
            { metric: "Accuracy", baseline: 0.792, cmt: 0.864, delta: 0.072, W: 18, p: 0.0011 },
            { metric: "Precision", baseline: 0.786, cmt: 0.861, delta: 0.075, W: 18, p: 0.0010 },
            { metric: "Recall", baseline: 0.788, cmt: 0.862, delta: 0.074, W: 18, p: 0.0009 },
            { metric: "F1", baseline: 0.787, cmt: 0.862, delta: 0.075, W: 18, p: 0.0009 },
          ],
        },
        {
          level: "Make",
          metrics: [
            { metric: "Accuracy", baseline: 0.742, cmt: 0.832, delta: 0.090, W: 18, p: 0.0008 },
            { metric: "Precision", baseline: 0.736, cmt: 0.829, delta: 0.093, W: 18, p: 0.0008 },
            { metric: "Recall", baseline: 0.738, cmt: 0.830, delta: 0.092, W: 18, p: 0.0007 },
            { metric: "F1", baseline: 0.737, cmt: 0.830, delta: 0.093, W: 18, p: 0.0007 },
          ],
        },
        {
          level: "Model",
          metrics: [
            { metric: "Accuracy", baseline: 0.702, cmt: 0.812, delta: 0.110, W: 18, p: 0.0006 },
            { metric: "Precision", baseline: 0.695, cmt: 0.807, delta: 0.112, W: 18, p: 0.0006 },
            { metric: "Recall", baseline: 0.698, cmt: 0.808, delta: 0.110, W: 18, p: 0.0005 },
            { metric: "F1", baseline: 0.696, cmt: 0.808, delta: 0.112, W: 18, p: 0.0005 },
          ],
        },
        {
          level: "Vehicle",
          metrics: [{ metric: "Mean IoU", baseline: 0.702, cmt: 0.772, delta: 0.070, W: 18, p: 0.0012 }],
        },
      ],
    },
  ],
};

/* ───────────────────────────────────────────────────────────────
   Formatting & helpers
   ─────────────────────────────────────────────────────────────── */
const chartConfig = {
  baseline: { label: "Baseline", color: "hsl(188.7 94.5% 42.7%)" },
  cmt: { label: "CMT", color: "hsl(24.6 95% 53.1%)" },
};

const fmtDelta = (d) => (typeof d === "number" ? `${d >= 0 ? "+" : ""}${Number(d).toFixed(4)}` : "—");
const fmt = (n) => (typeof n === "number" ? (n % 1 === 0 ? n.toString() : Number(n).toFixed(4)) : "—");

const rowLabel = (row) => (row?.level ? `${row.level}: ${row.metric}` : row?.metric ?? "");
const toChartRows = (rows) =>
  rows.map((r) => ({ name: rowLabel(r), baseline: r?.baseline ?? null, cmt: r?.cmt ?? null }));

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/* ───────────────────────────────────────────────────────────────
   Reusable UI
   ─────────────────────────────────────────────────────────────── */
function SOPCard({ title, icon: Icon, children }) {
  return (
    <Card className="bg-neutral-950 border-orange-500/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-orange-400" /> : null}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-neutral-300 space-y-3">{children}</CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────
   Metric Table — (Interpretation column removed)
   ─────────────────────────────────────────────────────────────── */
function MetricTable({ title, icon: Icon, caption, rows }) {
  const hasLevel = rows.some((r) => typeof r.level !== "undefined");

  return (
    <Card className="w-full">
      <CardHeader className="px-6 pb-2 border-b border-neutral-800/60">
        <CardTitle className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 opacity-80" /> : null}
          {title}
        </CardTitle>
        {caption ? <CardDescription>{caption}</CardDescription> : null}
      </CardHeader>
      <CardContent className="px-6 pt-4 overflow-none">
        <div className="overflow-hidden">
          <Table className="text-sm overflow-hidden">
            {caption ? <TableCaption className="text-xs">{caption}</TableCaption> : null}
            <TableHeader>
              <TableRow>
                {hasLevel && <TableHead className="w-[120px]">Level</TableHead>}
                <TableHead className="pr-4">Metric</TableHead>
                <TableHead className="w-[120px] pr-1">Baseline</TableHead>
                <TableHead className="w-[120px] pl-1">CMT</TableHead>
                <TableHead className="w-[72px] pl-1 pr-1">Δ</TableHead>
                <TableHead className="w-[64px]">W</TableHead>
                <TableHead className="w-[80px]">p</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`${r.metric}-${i}`}>
                  {hasLevel && <TableCell className="font-medium">{r.level ?? "—"}</TableCell>}
                  <TableCell className="pr-4">{r.metric}</TableCell>

                  <TableCell className="w-[120px] pr-1 tabular-nums">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: chartConfig.baseline.color }}
                      />
                      {fmt(r.baseline)}
                    </span>
                  </TableCell>

                  <TableCell className="w-[120px] pl-1 tabular-nums">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: chartConfig.cmt.color }}
                      />
                      {fmt(r.cmt)}
                    </span>
                  </TableCell>

                  <TableCell
                    className={
                      r?.delta > 0
                        ? "text-emerald-400 font-medium"
                        : r?.delta < 0
                        ? "text-red-400 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {fmtDelta(r.delta)}
                  </TableCell>
                  <TableCell className="tabular-nums">{fmt(r.W)}</TableCell>
                  <TableCell className="tabular-nums">{fmt(r.p)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────
   Horizontal Bars — thick bars, centered
   ─────────────────────────────────────────────────────────────── */
function HorizontalBars({ title, icon: Icon, description, rows, barSize = 16, height = 720 }) {
  const data = React.useMemo(() => toChartRows(rows), [rows]);
  const mounted = useMounted();

  return (
    <Card className="w-full">
      <CardHeader className="px-6 pb-2 border-b border-neutral-800/60">
        <CardTitle className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 opacity-80" /> : null}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent className="px-6 pt-4">
        {!mounted ? (
          <div style={{ height }} className="w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
            <RBarChart
              data={data}
              layout="vertical"
              margin={{ left: 24, right: 24, top: 8, bottom: 8 }}
              barCategoryGap={24}
            >
              <CartesianGrid horizontal vertical={false} />
              <XAxis type="number" />
              <YAxis
                yAxisId="left"
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={180}
              />
              <YAxis yAxisId="right" orientation="right" tick={false} axisLine={false} width={180} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                yAxisId="left"
                dataKey="baseline"
                name="Baseline"
                fill="var(--color-baseline)"
                radius={4}
                barSize={barSize}
              />
              <Bar
                yAxisId="left"
                dataKey="cmt"
                name="CMT"
                fill="var(--color-cmt)"
                radius={4}
                barSize={barSize}
              />
            </RBarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────
   Data shaping for SOP 3
   ─────────────────────────────────────────────────────────────── */
function flattenSOP3Condition(cond) {
  const rows = [];
  cond?.data?.forEach((block) => {
    block.metrics?.forEach((m) => rows.push({ level: block.level, ...m }));
  });
  return rows;
}

function getConditionByLevel(conditions, level) {
  if (!Array.isArray(conditions)) return null;
  return conditions.find((c) => String(c.level).toLowerCase() === String(level).toLowerCase());
}

/* ───────────────────────────────────────────────────────────────
   Simple inline Upload Box — Occlusion mode
   ─────────────────────────────────────────────────────────────── */
function UploadBox() {
  const [file, setFile] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState(null); // "ok" | "error" | null
  const [jobId, setJobId] = React.useState(null);
  const [msg, setMsg] = React.useState("");

  async function onUpload() {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    setJobId(null);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/testing/upload?mode=occlusion`, {
        method: "POST",
        body: fd,
      });
      const bodyText = await res.text();
      let json = {};
      try {
        json = JSON.parse(bodyText);
      } catch {}
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      setStatus("ok");
      setJobId(json?.job_id || null);
      setMsg("Upload accepted. Backend will run occlusion evaluation and populate results.");
    } catch (e) {
      setStatus("error");
      setMsg(String(e?.message || "Upload failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full bg-neutral-950 border-orange-500/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <UploadIcon className="h-4 w-4 text-orange-400" />
          Upload Occlusion Test Dataset (ZIP)
        </CardTitle>
        <CardDescription>
          Attach a <span className="font-mono">.zip</span> with Clean/Low/Mid/High tiers. We’ll submit it to the tester.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <Input
          type="file"
          accept=".zip"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={busy}
          className="max-w-sm"
        />
        <Button onClick={onUpload} disabled={!file || busy}>
          {busy ? "Uploading…" : "Upload & Run"}
        </Button>
        <div className="text-xs md:ml-2 opacity-70">
          {status === "ok" && (
            <span className="text-emerald-400">
              ✅ {msg} {jobId ? `Job ID: ${jobId}` : null}
            </span>
          )}
          {status === "error" && <span className="text-red-400">❌ {msg}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────
   Page — /testing-hub/occlusion-testing (SOP 3)
   Renders 4 sections: Clean, Low, Mid, High
   ─────────────────────────────────────────────────────────────── */
export default function OcclusionTestingPage() {
  const conditions = sop3Occlusion?.conditions ?? [];
  const orderedLevels = ["Clean", "Low", "Mid", "High"];

  return (
    <>
      {/* Hero / Banner — adapted for Testing Hub */}
      <div
        className="relative w-full min-h-[40vh] px-16 pb-10 bg-cover bg-center bg-no-repeat bg-fixed overflow-auto"
        style={{ backgroundImage: "url('/Banner.png')" }}
        suppressHydrationWarning
      >
        <Navbar />
        <div className="flex flex-col justify-center items-center w-full p-10 mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.png" className="h-24" alt="Logo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BannerTitle.png" className="h-20" alt="Title" />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-14" suppressHydrationWarning>
        {/* Title + subtitle */}
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Occlusion Testing — SOP 3</h1>
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl mx-auto">
            Baseline (cyan) vs CMT (orange) under Clean, Low, Mid, and High occlusion levels.
          </p>
        </header>

        {/* Upload Box */}
        <UploadBox />

        {/* Scope card */}
        <SOPCard title="SOP 3 — Occlusion Robustness (Clean → High)" icon={EyeOff}>
          <div className="pl-1">
            <div className="font-medium">
              Compare recognition (Type/Make/Model: Acc/Prec/Rec/F1) and vehicle localization (Mean IoU) across occlusion tiers.
            </div>
            <div className="pl-4">
              Results are paired per image across models; values below are macro-averaged aggregates.
            </div>
          </div>
        </SOPCard>

        {/* Four sections: Clean, Low, Mid, High */}
        {orderedLevels.map((lvl, idx) => {
          const cond = getConditionByLevel(conditions, lvl) || { level: lvl, data: [] };
          const rows = flattenSOP3Condition(cond);

          return (
            <div key={lvl} className="space-y-6">
              <Card className="bg-neutral-900/40 border-neutral-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <EyeOff className="h-4 w-4 opacity-80" />
                    {`SOP 3 — ${lvl} Occlusion`}
                  </CardTitle>
                  <CardDescription>Baseline vs CMT across Type/Make/Model and Vehicle Mean IoU</CardDescription>
                </CardHeader>
              </Card>

              <MetricTable
                icon={FileText}
                title={`${lvl} — Metrics`}
                caption="Wilcoxon W and p-values per metric"
                rows={rows}
              />
              <HorizontalBars
                icon={BarChart3}
                title={`${lvl} — Visualization`}
                description="Baseline vs CMT per metric"
                rows={rows}
                barSize={16}
                height={720}
              />

              {idx < orderedLevels.length - 1 ? <hr className="my-8 border-neutral-800/60" /> : null}
            </div>
          );
        })}

        {/* Navigation */}
        <Card className="bg-neutral-950/60 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Navigation</CardTitle>
            <CardDescription>Jump to other testing modes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link
              href="/testing-hub"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Testing Hub
            </Link>
            <Link
              href="/testing-hub/performance-testing"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            >
              Go to Performance Testing
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
