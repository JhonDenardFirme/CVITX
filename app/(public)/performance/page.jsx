"use client";

import * as React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PHASES } from "@/lib/trainingData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Boxes, Ruler, Activity, Info } from "lucide-react";

export default function PerformanceReportsIntroPage() {
  return (
    <>
      {/* Hero / Banner — UNCHANGED */}
      <div
        className="relative w-full min-h-[100vh] px-16 pb-16 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden"
        style={{ backgroundImage: "url('/Banner.png')" }}
      >
        <Navbar />

        <div className="flex flex-col justify-center items-center w-full p-16 mt-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.png" className="h-52" alt="Logo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BannerTitle.png" className="h-36" alt="Title" />
        </div>

        <div className="absolute blue-gradient w-[350px] h-[350px] z-10 -top-44 -right-16"></div>
        <div className="absolute lightblue-gradient w-[250px] h-[250px] z-10 -top-36 -right-16"></div>

        <div className="absolute orange-gradient w-[350px] h-[350px] z-10 -bottom-44 -left-52"></div>
        <div className="absolute light-orange-gradient w-[500px] h-[500px] z-10 -bottom-44 -left-52"></div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:py-16">
        {/* Title + subtitle */}
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">PERFORMANCE REPORTS</h1>
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl mx-auto">
            Phase-by-phase results after the <span className="text-cyan-400 font-medium">Baseline</span> run and the
            <span className="text-orange-400 font-medium"> CMT</span> continuation. The setup remains fixed; only the
            training strategy changes. Each phase presents paired metrics, significance, and a short operational note.
          </p>
        </header>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Role of this page */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Role of This Page</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Training Logs describe learning behavior. This page reports outcomes per phase. Tables and tests are concise
            and decision-oriented.
          </p>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* What is measured */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">What Is Measured</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-400" />
                  Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Answers <em>what</em> the object is: <span className="font-medium">Type · Make · Model</span>.
                Reported as Accuracy, Precision, Recall, and F1.
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-orange-400" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Answers <em>where</em> the object and parts are. Whole-vehicle IoU and{" "}
                <span className="font-medium">Parts Box</span> scores track cues such as headlights, grille, and wheels.
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-orange-400" />
                  Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Real-time viability on the reference GPU: latency per frame, GPU/Memory, and power. Accuracy gains
                should not degrade throughput.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Statistical methods */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Statistical Methods</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-orange-400" />
                  Paired Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Baseline and CMT are compared on the same images. The{" "}
                <span className="font-medium">Wilcoxon Signed-Rank</span> test evaluates whether CMT consistently
                outperforms Baseline without assuming normality.
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-400" />
                  Occlusion Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                For Clean → Low → Mid → High occlusion, the <span className="font-medium">Friedman</span> test detects
                a rising pattern of gains across levels.
              </CardContent>
            </Card>
          </div>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-orange-400" />
                What Counts as “Significant”
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              Results are flagged when the gain is unlikely due to chance (common cutoff: <em>p</em> &lt; 0.05).
              Direction and effect size are still reported for borderline cases.
            </CardContent>
          </Card>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* How to read each phase */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">How to Read Each Phase</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Each phase contains side-by-side Baseline vs CMT tables for Recognition, Localization, and Efficiency. Look
            for higher F1, tighter boxes, and steady runtime. Notes clarify implications for deployment.
          </p>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Controls & fairness */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Controls & Fairness</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Data, splits, preprocessing, seeds, and GPU remain identical across Baseline and CMT. Only masking changes.
            Artifacts are versioned and time-stamped for audit and repeat runs.
          </p>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Scope by phase */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Scope by Phase</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Quick map of each report’s focus before opening the tables.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { t: "Phase 1 — Coarse Type", d: "Separation of vehicle types in controlled views." },
              { t: "Phase 2 — Frontal Make", d: "Brand cues with frontal emphasis, logo shortcuts checked." },
              { t: "Phase 3 — Make–Model", d: "Fine-grained siblings in controlled scenes." },
              { t: "Phase 4 — Street (Single)", d: "One main subject with light clutter." },
              { t: "Phase 5 — Street (Multi)", d: "Overlaps and occlusions in urban frames." },
              { t: "Phase 6 — Highway (Heavy)", d: "Speed, density, and partial visibility." },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-md border border-neutral-800 bg-neutral-950/60 p-4 hover:border-neutral-700 transition"
              >
                <div className="text-sm font-semibold mb-1">{c.t}</div>
                <div className="text-sm text-neutral-300">{c.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Metric reading guide */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Metric Reading Guide</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-400" />
                  Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Accuracy shows overall correctness. Precision controls false positives. Recall captures misses. F1
                balances both. Gains at the <span className="font-medium">Model</span> level indicate true fine-grained
                improvement.
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-orange-400" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Mean IoU reflects how tight vehicle boxes are. <span className="font-medium">Parts</span> scores show
                whether informative components remain tracked when obvious cues are hidden.
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-orange-400" />
                  Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Reported on the same GPU profile used in development. The target is steady runtime with better
                predictions.
              </CardContent>
            </Card>
          </div>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-orange-400" />
                Interpreting Mixed Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              One metric may move more than another. Priority rests on{" "}
              <span className="font-medium">Model-level F1</span> and{" "}
              <span className="font-medium">Parts Box</span> under occlusion, which best reflect compositional robustness.
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Footer-style phase navigation (outside the dividers) */}
      <div className="w-full border-t border-neutral-800 bg-neutral-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Navigate to Phases</h2>
          <p className="text-sm text-neutral-300 text-center max-w-3xl mx-auto mt-2">
            Open a phase to view its paired tables and notes. For learning behavior, see{" "}
            <span className="font-medium">Training Logs</span>. For the final roll-up, see{" "}
            <span className="font-medium">AI Model Evaluation</span>.
          </p>

          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            {PHASES.map((p, i) => (
              <Link
                key={p.key}
                href={`/performance/${p.key}`}
                className="px-4 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              >
                {`Phase ${i + 1}`}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
