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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  FileText,
  Crosshair,
  Gauge,
  BarChart3,
  ListOrdered,
  Target,
  Boxes,
  Ruler,
  ArrowLeft,
  Upload as UploadIcon,
} from "lucide-react";

/* =====================================================================
   📄 Performance Testing — Set A (SOP 1, 2, 4 only)
   Single-page that combines the header/intro + the tables/visualizations.
   NOTE: Dummy data is inlined below. When backend is integrated, replace
   these arrays with the backend-filled values for the current job/dataset.
   ===================================================================== */

/* ───────────────────────────────────────────────────────────────
   Dummy Data (SOP 1, 2, 4) — to be replaced by backend results later
   Backend should fill these arrays based on the uploaded ZIP/job-id.
   (Interpretation fields removed per request.)
   ─────────────────────────────────────────────────────────────── */
const sop1Recognition = [
  {
    level: "Type",
    metrics: [
      { metric: "Accuracy", baseline: 0.841, cmt: 0.872, delta: +0.031, W: 17, p: 0.034 },
      { metric: "Precision", baseline: 0.824, cmt: 0.865, delta: +0.041, W: 16, p: 0.027 },
      { metric: "Recall", baseline: 0.833, cmt: 0.870, delta: +0.037, W: 15, p: 0.024 },
      { metric: "F1", baseline: 0.829, cmt: 0.868, delta: +0.039, W: 14, p: 0.021 },
    ],
  },
  {
    level: "Make",
    metrics: [
      { metric: "Accuracy", baseline: 0.803, cmt: 0.849, delta: +0.046, W: 12, p: 0.018 },
      { metric: "Precision", baseline: 0.787, cmt: 0.844, delta: +0.057, W: 11, p: 0.015 },
      { metric: "Recall", baseline: 0.796, cmt: 0.851, delta: +0.055, W: 10, p: 0.013 },
      { metric: "F1", baseline: 0.792, cmt: 0.846, delta: +0.054, W: 9, p: 0.010 },
    ],
  },
  {
    level: "Model",
    metrics: [
      { metric: "Accuracy", baseline: 0.831, cmt: 0.883, delta: +0.052, W: 10, p: 0.011 },
      { metric: "Precision", baseline: 0.820, cmt: 0.877, delta: +0.057, W: 9, p: 0.008 },
      { metric: "Recall", baseline: 0.825, cmt: 0.880, delta: +0.055, W: 8, p: 0.007 },
      { metric: "F1", baseline: 0.823, cmt: 0.879, delta: +0.056, W: 7, p: 0.006 },
    ],
  },
];

const sop2Localization = [
  { metric: "Mean IoU (Vehicle Box)", baseline: 0.749, cmt: 0.779, delta: +0.030, W: 8, p: 0.025 },
  { metric: "mAP@50 (Parts)", baseline: 0.716, cmt: 0.771, delta: +0.055, W: 7, p: 0.018 },
  { metric: "mAP@75 (Parts)", baseline: 0.624, cmt: 0.689, delta: +0.065, W: 6, p: 0.009 },
];

const sop4Efficiency = [
  { metric: "Latency (ms/frame)", baseline: 22.0, cmt: 22.3, delta: +0.3, W: 9, p: 0.187 },
  { metric: "GFLOPs", baseline: 7.54, cmt: 7.69, delta: +0.15, W: 8, p: 0.173 },
  { metric: "GPU Usage (%)", baseline: 70.1, cmt: 71.0, delta: +0.9, W: 8, p: 0.180 },
  { metric: "Power (W)", baseline: 111.0, cmt: 111.7, delta: +0.7, W: 7, p: 0.201 },
  { metric: "Memory (GB)", baseline: 4.59, cmt: 4.63, delta: +0.04, W: 7, p: 0.215 },
];

/* ───────────────────────────────────────────────────────────────
   Formatting & helpers
   ─────────────────────────────────────────────────────────────── */
const chartConfig = {
  baseline: { label: "Baseline", color: "hsl(188.7 94.5% 42.7%)" }, // cyan-ish
  cmt: { label: "CMT", color: "hsl(24.6 95% 53.1%)" },              // orange-ish
};

const fmtDelta = (d) =>
  typeof d === "number" ? `${d >= 0 ? "+" : ""}${Number(d).toFixed(4)}` : "—";
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
   Metric Table — equal spacing, tabular numbers (no Interpretation col)
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
   Horizontal Bars — thick bars, centered, client-only
   ─────────────────────────────────────────────────────────────── */
function HorizontalBars({ title, icon: Icon, description, rows, barSize = 16, height = 520 }) {
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
                width={200}
              />
              <YAxis yAxisId="right" orientation="right" tick={false} axisLine={false} width={200} />
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
   Data shaping for each SOP
   ─────────────────────────────────────────────────────────────── */
function flattenSOP1(groups) {
  const rows = [];
  groups?.forEach((g) => {
    g.metrics?.forEach((m) => rows.push({ level: g.level, ...m }));
  });
  return rows;
}

/* ───────────────────────────────────────────────────────────────
   Simple inline Upload Box (no dialog, no extra fields)
   Lives below the header, before tables. Posts to /api/testing/upload.
   Backend should consume the ZIP and later fill results for this page.
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
      // Mode is fixed to "performance" for Set A
      const res = await fetch(`/api/testing/upload?mode=performance`, {
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
      setMsg("Upload accepted. Backend will run evaluation and should populate results later.");
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
          Upload Test Dataset (ZIP)
        </CardTitle>
        <CardDescription>
          Attach a <span className="font-mono">.zip</span> (Set A). We’ll submit it to the backend tester.
          {/* BACKEND INTEGRATION NOTE: After job completion, the backend should fill the SOP arrays (SOP1/SOP2/SOP4) for this page. */}
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
   Page — /testing-hub/performance-testing (Set A)
   ─────────────────────────────────────────────────────────────── */
export default function PerformanceTestingSetAPage() {
  const sop1Rows = flattenSOP1(sop1Recognition);
  const sop2Rows = sop2Localization || [];
  const sop4Rows = sop4Efficiency || [];

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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Performance Testing — Set A</h1>
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl mx-auto">
            Live, paired evaluation (Baseline vs CMT) for the uploaded Set A dataset. This page covers{" "}
            <b>SOP 1 (Recognition)</b>, <b>SOP 2 (Localization)</b>, and <b>SOP 4 (Efficiency)</b>. Occlusion robustness (SOP 3) lives in the Occlusion Testing page.
          </p>
        </header>

        {/* Upload Box — inline container (no dialog) */}
        <UploadBox />

        {/* ───────────── Divider ───────────── */}
        <hr className="my-6 border-neutral-700/70" />

        {/* Page scope cards (quick context) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-400" />
                Recognition (SOP 1)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              Macro-averaged Accuracy, Precision, Recall, and F1 across Type, Make, and Model.
            </CardContent>
          </Card>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Boxes className="h-4 w-4 text-orange-400" />
                Localization (SOP 2)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              Vehicle mean IoU and Part mAP@50/@75 highlight compositional precision.
            </CardContent>
          </Card>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Ruler className="h-4 w-4 text-orange-400" />
                Efficiency (SOP 4)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              Latency, FLOPs, GPU%, Power, and Memory — same hardware profile for both models.
            </CardContent>
          </Card>
        </section>

        {/* ───────────────── SOP 1 ───────────────── */}
        <hr className="my-10 border-neutral-700/70" />
        <h2 className="text-center text-2xl md:text-3xl font-semibold">Statement of the Problem 1</h2>

        <SOPCard title="SOP 1 — Overall Recognition Performance" icon={ListOrdered}>
          <div className="pl-1">
            <div className="font-medium">
              Is there a significant improvement in recognition between Baseline and CMT in terms of:
            </div>
            <div className="pl-4">
              a. <b>Type</b> — Accuracy, Precision, Recall, F1<br />
              b. <b>Make</b> — Accuracy, Precision, Recall, F1<br />
              c. <b>Model</b> — Accuracy, Precision, Recall, F1
            </div>
          </div>
        </SOPCard>

        <MetricTable
          icon={FileText}
          title="SOP 1 — Recognition (Aggregated)"
          caption="Baseline vs CMT; Wilcoxon W and p-values"
          rows={sop1Rows}
        />
        <HorizontalBars
          icon={BarChart3}
          title="SOP 1 — Recognition Visualization"
          description="Baseline vs CMT per metric (Type, Make, Model)"
          rows={sop1Rows}
          barSize={16}
          height={760}
        />

        {/* ───────────────── SOP 2 ───────────────── */}
        <hr className="my-10 border-neutral-700/70" />
        <h2 className="text-center text-2xl md:text-3xl font-semibold">Statement of the Problem 2</h2>

        <SOPCard title="SOP 2 — Overall Localization Performance" icon={Crosshair}>
          <div className="pl-1">
            <div className="font-medium">
              Is there a significant improvement in localization between Baseline and CMT in terms of:
            </div>
            <div className="pl-4">
              a. Vehicle localization — mean IoU<br />
              b. Part detection — mAP@50<br />
              c. Part detection — mAP@75
            </div>
          </div>
        </SOPCard>

        <MetricTable
          icon={Crosshair}
          title="SOP 2 — Localization (Aggregated)"
          caption="Baseline vs CMT; Wilcoxon W and p-values"
          rows={sop2Rows}
        />
        <HorizontalBars
          icon={BarChart3}
          title="SOP 2 — Localization Visualization"
          description="Baseline vs CMT per localization metric"
          rows={sop2Rows}
          barSize={16}
          height={360}
        />

        {/* ───────────────── SOP 4 ───────────────── */}
        <hr className="my-10 border-neutral-700/70" />
        <h2 className="text-center text-2xl md:text-3xl font-semibold">Statement of the Problem 4</h2>

        <SOPCard title="SOP 4 — Computational Efficiency" icon={Gauge}>
          <div className="pl-1">
            <div className="font-medium">
              What is the real-time performance and efficiency of CMT vs Baseline in terms of:
            </div>
            <div className="pl-4">
              a. Latency (ms/frame), b. GFLOPs, c. GPU Usage (%), d. Power (W), e. Memory (GB)
            </div>
          </div>
        </SOPCard>

        <MetricTable
          icon={Gauge}
          title="SOP 4 — Efficiency (Aggregated)"
          caption="Baseline vs CMT; Wilcoxon W and p-values"
          rows={sop4Rows}
        />
        <HorizontalBars
          icon={BarChart3}
          title="SOP 4 — Efficiency Visualization"
          description="Baseline vs CMT per efficiency metric"
          rows={sop4Rows}
          barSize={16}
          height={360}
        />

        {/* ───────────────── Mini navigation ───────────────── */}
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
              href="/testing-hub/occlusion-testing"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            >
              Go to Occlusion Testing
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
