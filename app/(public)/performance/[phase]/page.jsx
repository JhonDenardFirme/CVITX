"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import {
  Info,
  FileText,
  BarChart3,
  Crosshair,
  Gauge,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { perPhaseTables } from "@/lib/performanceData";
import Navbar from "@/components/Navbar";

const ROUTE_PHASES = ["phase-1", "phase-2", "phase-3", "phase-4", "phase-5", "phase-6"];
const PHASE_KEYS = ["P1", "P2", "P3", "P4", "P5", "P6"];

const chartConfig = {
  baseline: { label: "Baseline", color: "hsl(188.7 94.5% 42.7%)" },
  cmt: { label: "CMT", color: "hsl(24.6 95% 53.1%)" },
};

const fmtDelta = (d) => (typeof d === "number" ? `${d >= 0 ? "+" : ""}${d.toFixed(4)}` : "—");
const fmt = (n) => (typeof n === "number" ? (n % 1 === 0 ? n.toString() : n.toFixed(4)) : "—");

const rowLabel = (row) => (row?.level ? `${row.level}: ${row.metric}` : row?.metric ?? "");
const toChartRows = (rows) =>
  rows.map((r) => ({ name: rowLabel(r), baseline: r?.baseline ?? null, cmt: r?.cmt ?? null }));

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/* ───────────────────────────────────────────────────────────────
   Metric Table — no Y scroll, tighter and even column spacing
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

      {/* wrapper ensures no vertical scroll is forced */}
      <CardContent className="px-6 pt-4 overflow-hidden">
        <div className="overflow-hidden">
          <Table className="text-sm overflow-hidden">
            {caption ? <TableCaption className="text-xs">{caption}</TableCaption> : null}
            <TableHeader>
              <TableRow>
                {hasLevel && <TableHead className="w-[120px]">Level</TableHead>}
                <TableHead className="pr-4">Metric</TableHead>
                <TableHead className="w-[120px] pr-1">Baseline</TableHead>
                <TableHead className="w-[120px] pl-1">CMT</TableHead>
                <TableHead className="w-[86px] pl-1 pr-1">Δ</TableHead>
                <TableHead className="w-[52px]">W</TableHead>
                <TableHead className="w-[80px]">p</TableHead>
                <TableHead>Interpretation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`${r.metric}-${i}`}>
                  {hasLevel && <TableCell className="font-medium">{r.level ?? "—"}</TableCell>}

                  {/* Metric — give right padding to open space before Baseline */}
                  <TableCell className="pr-4">{r.metric}</TableCell>

                  {/* Baseline — reduced width, tiny right padding; tabular numbers */}
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

                  {/* CMT — same reduced width, tiny left padding to pair with Baseline */}
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

                  {/* Δ, W, p kept compact to pull them closer */}
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
                  <TableCell className="text-muted-foreground">
                    {r.interpretation ?? "—"}
                  </TableCell>
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
   Horizontal Bars — thicker bars, phase-aware fixed heights
   (Client-only render; Phase 1–2 = 320px; Phase 3–6 = 520px)
   ─────────────────────────────────────────────────────────────── */
function HorizontalBars({
  title,
  icon: Icon,
  description,
  rows,
  barSize = 16,
  height = 320, // will be overridden by caller per-phase
}) {
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
              {/* symmetric right gutter keeps bars centered */}
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
   Bottom Navigation — standardized /performance/phase-N
   ─────────────────────────────────────────────────────────────── */
function PhaseNavPerformance({ currentIdx }) {
  const prev = currentIdx > 0 ? currentIdx - 1 : null;
  const next = currentIdx < ROUTE_PHASES.length - 1 ? currentIdx + 1 : null;

  return (
    <div className="mt-10 space-y-4">
      <Card className="bg-neutral-950/60 border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Navigate performance phases</CardTitle>
          <CardDescription>Jump across Phase 1 to Phase 6 performance reports.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {ROUTE_PHASES.map((slug, i) => (
            <Link
              key={slug}
              href={`/performance/${slug}`}
              className={`px-3 py-1 rounded-md border ${
                i === currentIdx
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
          href={prev !== null ? `/performance/${ROUTE_PHASES[prev]}` : "#"}
          aria-disabled={prev === null}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${
            prev !== null
              ? "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              : "pointer-events-none opacity-40 bg-neutral-900 border-neutral-800 text-neutral-500"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          {prev !== null ? `Phase ${prev + 1}` : "No previous"}
        </Link>

        <Link
          href="/performance"
          className="text-neutral-300 underline underline-offset-4 hover:text-white"
        >
          Back to Performance Overview
        </Link>

        <Link
          href={next !== null ? `/performance/${ROUTE_PHASES[next]}` : "#"}
          aria-disabled={next === null}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${
            next !== null
              ? "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              : "pointer-events-none opacity-40 bg-neutral-900 border-neutral-800 text-neutral-500"
          }`}
        >
          {next !== null ? `Phase ${next + 1}` : "Done"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Interpretation card — subtle orange-black background
   ─────────────────────────────────────────────────────────────── */
function InterpretationCard() {
  return (
    <Card className="border border-orange-600/50 bg-orange-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-orange-300">
          <Info className="h-4 w-4" />
          Interpretation
        </CardTitle>
        <CardDescription className="text-orange-200/80">
          Summary analysis for this phase’s performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-orange-100/90">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus imperdiet arcu in
          interdum consectetur, neque nibh placerat lorem, vitae maximus velit arcu sed nibh.
        </p>
        <p>
          Curabitur semper, arcu vitae mollis auctor, tortor sem lacinia arcu, non aliquet nunc
          ipsum ac mi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere.
        </p>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────────────────────────────────────────
   Page — responds to /performance/phase-N (no querystring)
   ─────────────────────────────────────────────────────────────── */
export default function PerformanceReportPage() {
  const params = useParams();
  const phaseSlug = typeof params?.phase === "string" ? params.phase.toLowerCase() : "phase-1";
  const idx = ROUTE_PHASES.indexOf(phaseSlug);
  const safeIdx = idx >= 0 ? idx : 0;
  const safePhaseKey = PHASE_KEYS[safeIdx];

  const tables = perPhaseTables?.[safePhaseKey] || {};
  const recog = tables?.recognition ?? [];
  const loc = tables?.localization ?? [];
  const eff = tables?.efficiency ?? [];

  // Bars are thick (16). Recognition chart height is phase-aware:
  // Phase 1–2: 320px; Phase 3–6: 520px (flows like P1/2 but with more air).
  const barSize = 16;
  const recogHeight = safeIdx <= 1 ? 320 : 720;
  const locHeight = 320;
  const effHeight = 320;

  return (
    <>
      {/* Hero / Banner (no top navbar) */}
      <div
        className="relative w-full min-h-[40vh] px-16 pb-10 bg-cover bg-center bg-no-repeat bg-fixed overflow-auto"
        style={{ backgroundImage: "url('/Banner.png')" }}
        suppressHydrationWarning
      >
        <Navbar></Navbar>
        <div className="flex flex-col justify-center items-center w-full p-10 mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.png" className="h-24" alt="Logo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BannerTitle.png" className="h-20" alt="Title" />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-10" suppressHydrationWarning>
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Performance Report — Phase {safeIdx + 1}
          </h1>
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl mx-auto">
            Baseline (cyan) vs CMT (orange) across Recognition, Localization, and Efficiency.
          </p>
        </header>

        {/* Recognition */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-300">
            <Info className="h-4 w-4" />
            <span className="text-sm">Recognition includes Type/Make/Model (as applicable).</span>
          </div>

          <MetricTable
            icon={FileText}
            title="Recognition Reports"
            caption={`Phase ${safeIdx + 1} — Accuracy, Precision, Recall, F1`}
            rows={recog}
          />
          <HorizontalBars
            icon={BarChart3}
            title="Recognition Visualization"
            description="Baseline vs CMT per metric"
            rows={recog}
            barSize={barSize}
            height={recogHeight}
          />

          <hr className="my-8 border-neutral-800/80" />
        </section>

        {/* Localization */}
        <section className="space-y-4">
          <MetricTable
            icon={Crosshair}
            title="Localization Reports"
            caption={`Phase ${safeIdx + 1} — Mean IoU, mAP@50, mAP@75`}
            rows={loc}
          />
          <HorizontalBars
            icon={BarChart3}
            title="Localization Visualization"
            description="Baseline vs CMT per metric"
            rows={loc}
            barSize={barSize}
            height={locHeight}
          />

          <hr className="my-8 border-neutral-800/80" />
        </section>

        {/* Efficiency */}
        <section className="space-y-4">
          <MetricTable
            icon={Gauge}
            title="Efficiency Reports"
            caption={`Phase ${safeIdx + 1} — Latency, FLOPs, GPU/Power/Memory`}
            rows={eff}
          />
          <HorizontalBars
            icon={BarChart3}
            title="Efficiency Visualization"
            description="Baseline vs CMT per metric"
            rows={eff}
            barSize={barSize}
            height={effHeight}
          />
          <hr className="my-8 border-neutral-800/80" />
        </section>

        {/* Interpretation */}
        <InterpretationCard />

        {/* Bottom navigation */}
        <PhaseNavPerformance currentIdx={safeIdx} />
      </div>
    </>
  );
}
