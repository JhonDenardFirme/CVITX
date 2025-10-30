"use client";

import * as React from "react";
import Link from "next/link";
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
  Crosshair,
  Gauge,
  BarChart3,
  ListOrdered,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

import {
  sop1Recognition,
  sop2Localization,
  sop3Occlusion,
  sop4Efficiency,
  sopOverview,
} from "@/lib/evaluationData";
import Navbar from "@/components/Navbar";

/* ───────────────────────────────────────────────────────────────
   Formatting & helpers
   ─────────────────────────────────────────────────────────────── */
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

function ExplanationCard({ title = "Explanation" }) {
  return (
    <Card className="border border-orange-600/50 bg-orange-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-orange-300">
          <Info className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription className="text-orange-200/80">
          Narrative summary for this result set.
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
   Metric Table — no Y scroll, even spacing, tabular nums
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
                <TableHead>Interpretation</TableHead>
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
   Data shaping for each SOP
   ─────────────────────────────────────────────────────────────── */
function flattenSOP1(groups) {
  const rows = [];
  groups?.forEach((g) => {
    g.metrics?.forEach((m) => rows.push({ level: g.level, ...m }));
  });
  return rows;
}

function flattenSOP3Condition(cond) {
  const rows = [];
  cond?.data?.forEach((block) => {
    block.metrics?.forEach((m) => rows.push({ level: block.level, ...m }));
  });
  return rows;
}

/* ───────────────────────────────────────────────────────────────
   Page — /evaluation/results (single page, SOP-sequenced)
   ─────────────────────────────────────────────────────────────── */
export default function EvaluationResultsPage() {
  const sop1Rows = flattenSOP1(sop1Recognition);
  const sop2Rows = sop2Localization || [];
  const sop4Rows = sop4Efficiency || [];

  return (
    <>
      {/* Hero / Banner */}
      <div
        className="relative w-full min-h-[40vh] px-16 pb-10 bg-cover bg-center bg-no-repeat bg-fixed overflow-auto"
        style={{ backgroundImage: "url('/Banner.png')" }}
        suppressHydrationWarning
      >
        <Navbar/>
        <div className="flex flex-col justify-center items-center w-full p-10 mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.png" className="h-24" alt="Logo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BannerTitle.png" className="h-20" alt="Title" />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-14" suppressHydrationWarning>
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">AI Model Evaluation — Results</h1>
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl mx-auto">
            Aggregated SOP results comparing Baseline (cyan) vs CMT (orange): Recognition, Localization, Occlusion Robustness, and Efficiency.
          </p>
        </header>

        {/* ───────────────── SOP 1 ───────────────── */}
        <hr className="my-10 border-neutral-700/70" />
        <h2 className="text-center text-2xl md:text-3xl font-semibold">Statement of the Problem 1</h2>

        <SOPCard title="SOP 1 — Overall Recognition Performance" icon={ListOrdered}>
          <div className="pl-1">
            <div className="font-medium">Is there a significant improvement in recognition between Baseline and CMT in terms of:</div>
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
        <ExplanationCard title="SOP 1 — Explanation" />

        {/* ───────────────── SOP 2 ───────────────── */}
        <hr className="my-10 border-neutral-700/70" />
        <h2 className="text-center text-2xl md:text-3xl font-semibold">Statement of the Problem 2</h2>

        <SOPCard title="SOP 2 — Overall Localization Performance" icon={Crosshair}>
          <div className="pl-1">
            <div className="font-medium">Is there a significant improvement in localization between Baseline and CMT in terms of:</div>
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
        <ExplanationCard title="SOP 2 — Explanation" />

        {/* ───────────────── SOP 3 ───────────────── */}
        <hr className="my-10 border-neutral-700/70" />
        <h2 className="text-center text-2xl md:text-3xl font-semibold">Statement of the Problem 3</h2>

        <SOPCard title="SOP 3 — Occlusion Robustness (Clean → High)" icon={EyeOff}>
          <div className="pl-1">
            <div className="font-medium">
              How does CMT compare to Baseline across progressive occlusion levels (Clean, Low, Mid, High) for:
            </div>
            <div className="pl-4">
              a. Type, Make, Model — Accuracy, Precision, Recall, F1<br />
              b. Vehicle localization — mean IoU<br />
              <i>Trend validated via Friedman Test.</i>
            </div>
          </div>
        </SOPCard>

        {(sop3Occlusion?.conditions || []).map((cond, idx) => {
          const rows = flattenSOP3Condition(cond);
          return (
            <div key={cond.level} className="space-y-6">
              <Card className="bg-neutral-900/40 border-neutral-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <EyeOff className="h-4 w-4 opacity-80" />
                    {`SOP 3 — ${cond.level} Occlusion`}
                  </CardTitle>
                  <CardDescription>Baseline vs CMT across Type/Make/Model and Vehicle IoU</CardDescription>
                </CardHeader>
              </Card>

              <MetricTable
                icon={FileText}
                title={`${cond.level} — Metrics`}
                caption="Wilcoxon W and p-values per metric"
                rows={rows}
              />
              <HorizontalBars
                icon={BarChart3}
                title={`${cond.level} — Visualization`}
                description="Baseline vs CMT per metric"
                rows={rows}
                barSize={16}
                height={720}
              />
              <ExplanationCard title={`SOP 3 — ${cond.level} Explanation`} />

              {idx < (sop3Occlusion.conditions.length - 1) ? (
                <hr className="my-8 border-neutral-800/60" />
              ) : null}
            </div>
          );
        })}

        {sop3Occlusion?.friedmanTest ? (
          <Card className="border border-emerald-600/40 bg-emerald-950/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">SOP 3 — Friedman Test Summary</CardTitle>
              <CardDescription>Trend across occlusion levels</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-emerald-100/90">
              <div className="space-y-1">
                <div>
                  χ² = <b>{fmt(sop3Occlusion.friedmanTest.chi2)}</b> | p ={" "}
                  <b>{fmt(sop3Occlusion.friedmanTest.p)}</b>
                </div>
                <div>{sop3Occlusion.friedmanTest.interpretation}</div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* ───────────────── SOP 4 ───────────────── */}
        <hr className="my-10 border-neutral-700/70" />
        <h2 className="text-center text-2xl md:text-3xl font-semibold">Statement of the Problem 4</h2>

        <SOPCard title="SOP 4 — Computational Efficiency" icon={Gauge}>
          <div className="pl-1">
            <div className="font-medium">What is the real-time performance and efficiency of CMT vs Baseline in terms of:</div>
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
        <ExplanationCard title="SOP 4 — Explanation" />

        {/* ───────────────── Overview (optional) ───────────────── */}
        {Array.isArray(sopOverview) && sopOverview.length > 0 ? (
          <>
            <hr className="my-10 border-neutral-800/80" />
            <Card className="w-full">
              <CardHeader className="px-6 pb-2 border-b border-neutral-800/60">
                <CardTitle className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 opacity-80" />
                  Interpretation Overview
                </CardTitle>
                <CardDescription>Final synthesis across SOP 1–4</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pt-4 overflow-visible">
                <div className="overflow-visible">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>SOP</TableHead>
                        <TableHead>Statistical Test</TableHead>
                        <TableHead>Significant</TableHead>
                        <TableHead>Outcome</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sopOverview.map((r, i) => (
                        <TableRow key={`${r.sop}-${i}`}>
                          <TableCell className="font-medium">{r.sop}</TableCell>
                          <TableCell>{r.test}</TableCell>
                          <TableCell>{r.significant ? "✅ Yes" : "❌ No"}</TableCell>
                          <TableCell className="text-muted-foreground">{r.outcome}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {/* ───────────────── Mini navigation ───────────────── */}
        <Card className="bg-neutral-950/60 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Navigation</CardTitle>
            <CardDescription>Return to the evaluation overview</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/evaluation"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back to Evaluation Overview
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
