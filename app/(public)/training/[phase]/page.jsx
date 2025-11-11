"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Info,
  LineChart as LineChartIcon,
  ChevronLeft,
  ChevronRight,
  Images,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { TRAINING_LABELS_25, PHASES } from "@/lib/trainingData";

/* ───────────────────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────────────────── */
function clamp01(n) {
  if (n == null || Number.isNaN(+n)) return 0;
  const x = +n;
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// Build a 50-step two-part series: B-01..B-25 then C-01..C-25
function buildTwoPartSeries(pair, labels = TRAINING_LABELS_25) {
  const len = Math.min(
    25,
    pair?.baseline?.length ?? 0,
    pair?.cmt?.length ?? 0,
    labels.length
  );
  const basePart = Array.from({ length: len }, (_, i) => ({
    idx: i + 1,
    step: `B-${String(i + 1).padStart(2, "0")}`,
    baselineVal: clamp01(pair.baseline[i]),
    cmtVal: null,
  }));
  const cmtPart = Array.from({ length: len }, (_, i) => ({
    idx: len + i + 1,
    step: `C-${String(i + 1).padStart(2, "0")}`,
    baselineVal: null,
    cmtVal: clamp01(pair.cmt[i]),
  }));
  return [...basePart, ...cmtPart];
}

// Use absolute HSL colors (no CSS variables)
const chartConfig = {
  baselineVal: { label: "Baseline", color: "hsl(188.7 94.5% 42.7%)" },
  cmtVal: { label: "CMT", color: "hsl(24.6 95% 53.1%)" },
};


/* ───────────────────────────────────────────────────────────────
   Reusable chart: two-part single line (blue then orange)
   ─────────────────────────────────────────────────────────────── */
function TwoPartAreaChart({ title, description, pair }) {
  const data = React.useMemo(() => buildTwoPartSeries(pair), [pair]);

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 opacity-80" />
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* FIX: give the container a fixed height so Recharts can render */}
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillBaselineVal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-baselineVal)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-baselineVal)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCmtVal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-cmtVal)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-cmtVal)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="step"
              allowDuplicatedCategory={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            {/* FIX: add YAxis with a 0..1 domain (hidden ticks) */}
            <YAxis domain={[0, 1]} tickLine={false} axisLine={false} tick={false} />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => {
                    const isBaseline = String(value).startsWith("B-");
                    const stepNo = String(value).slice(2);
                    return `${isBaseline ? "Baseline" : "CMT"} — Step ${stepNo}`;
                  }}
                  valueFormatter={(v) =>
                    v == null || Number.isNaN(+v) ? "—" : (+v).toFixed(4)
                  }
                />
              }
            />

            {/* First half (Baseline, blue) */}
            <Area
              dataKey="baselineVal"
              type="natural"
              fill="url(#fillBaselineVal)"
              stroke="var(--color-baselineVal)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            {/* Second half (CMT, orange) */}
            <Area
              dataKey="cmtVal"
              type="natural"
              fill="url(#fillCmtVal)"
              stroke="var(--color-cmtVal)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />

            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────
   Simple horizontal image slider
   ─────────────────────────────────────────────────────────────── */
function PhaseImageSlider({ images = [] }) {
  if (!images?.length) return null;
  return (
    <Card className="bg-neutral-950/60 border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Images className="h-4 w-4 text-neutral-300" />
          Phase snapshots
        </CardTitle>
        <CardDescription>
          Slide to browse example frames/visuals from this phase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="shrink-0 snap-start w-[260px] h-[160px] rounded-md overflow-hidden border border-neutral-800 bg-neutral-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`phase image ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────
   Phase Navigation Bar (labels only: Phase 1..Phase 6)
   ─────────────────────────────────────────────────────────────── */
function PhaseNav({ currentKey }) {
  const idx = PHASES.findIndex((p) => p.key === currentKey);
  const prev = idx > 0 ? PHASES[idx - 1] : null;
  const next = idx < PHASES.length - 1 ? PHASES[idx + 1] : null;

  return (
    <div className="mt-10 space-y-4">
      <Card className="bg-neutral-950/60 border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Navigate training phases</CardTitle>
          <CardDescription>
            Jump across Phase 1 to Phase 6 training logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PHASES.map((p, i) => (
            <Link
              key={p.key}
              href={`/training/${p.key}`}
              className={`px-3 py-1 rounded-md border ${p.key === currentKey
                  ? "bg-orange-500/20 border-orange-500 text-orange-300"
                  : "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                }`}
            >
              {`Phase ${i + 1}`}
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Link
          href={prev ? `/training/${prev.key}` : "#"}
          aria-disabled={!prev}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${prev
              ? "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              : "pointer-events-none opacity-40 bg-neutral-900 border-neutral-800 text-neutral-500"
            }`}
        >
          <ChevronLeft className="h-4 w-4" />
          {prev ? `Phase ${idx}` : "No previous"}
        </Link>

        <Link
          href="/training"
          className="text-neutral-300 underline underline-offset-4 hover:text-white"
        >
          Back to Training Logs Intro
        </Link>

        <Link
          href={next ? `/traininf/${next.key}` : "#"}
          aria-disabled={!next}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${next
              ? "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              : "pointer-events-none opacity-40 bg-neutral-900 border-neutral-800 text-neutral-500"
            }`}
        >
          {next ? `Phase ${idx + 2}` : "Done"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Page
   ─────────────────────────────────────────────────────────────── */
export default function TrainingLogsPage() {
  const { phase } = useParams(); // expects "phase-1".."phase-6"
  const data = PHASES.find((p) => p.key === String(phase)) ?? PHASES[0];

  return (
    <>
      {/* Hero / Banner */}
      <div
        className="relative w-full min-h-[40vh] px-16 pb-10 bg-cover bg-center bg-no-repeat bg-fixed overflow-auto"
        style={{ backgroundImage: "url('/Banner.png')" }}
      >
        <Navbar />
        <div className="flex flex-col justify-center items-center w-full p-10 mt-6">

          <img src="/Logo.png" className="h-24" alt="Logo" />

          <img src="/BannerTitle.png" className="h-20" alt="Title" />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-10">
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {data.title}
          </h1>
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl mx-auto">
            {data.intro}
          </p>
        </header>

        {/* Image slider */}
        <PhaseImageSlider images={data.images} />

        {/* Five charts */}
        <div className="space-y-8">
          {data?.metrics?.length ? (
            data.metrics.map((m) => (
              <TwoPartAreaChart
                key={m.key}
                title={`${m.label} | Baseline → CMT`}
                description={`${m.desc} `}
                pair={m.pair}
              />
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No metrics found</CardTitle>
                <CardDescription>
                  Ensure PHASES[*].metrics is populated in
                  <code className="ml-1">/lib/documentation-data.js</code>.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Analysis (from data file) */}
        {data?.analysis ? (
          <Card className="bg-neutral-950/60 border-neutral-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-neutral-300" />
                {data.analysis.title}
              </CardTitle>
              <CardDescription>{data.analysis.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-neutral-300">
              {data.analysis.paragraphs.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {/* Phase navigation */}
        <PhaseNav currentKey={data.key} />

        <hr className="border-neutral-800/80" />
      </div>
    </>
  );
}
