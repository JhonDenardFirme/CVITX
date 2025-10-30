"use client";

import * as React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PHASES } from "@/lib/trainingData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Scale,
  FlaskConical,
  ShieldCheck,
  TrendingUp,
  Target,
  Boxes,
  Ruler,
  Info,
  ListOrdered,
} from "lucide-react";

export default function AiModelEvaluationIntroPage() {
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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">AI MODEL EVALUATION</h1>
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl mx-auto">
            Final, aggregated results aligned with the four Statements of the Problem. Tests use paired comparisons on
            identical data and hardware to isolate the effect of{" "}
            <span className="text-orange-400 font-medium">Compositional Masking Training (CMT)</span>.
          </p>
        </header>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Role of this page */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Role of This Page</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Aggregates outcomes across phases and states the final claims for Recognition, Localization, Occlusion
            Robustness, and Efficiency. Content is concise, decision-oriented, and aligned to deployment needs.
          </p>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* SOPs — exact enumeration */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Statements of the Problem</h2>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-orange-400" />
                Enumerated Research Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300 space-y-4">
              <div>
                <div className="font-medium">
                  1.) Is there a SIGNIFICANT IMPROVEMENT in recognition performance between the Baseline part-aware
                  MobileViT and the CMT-trained part-aware MobileViT on a held-out Philippine vehicle test set, in terms of:
                </div>
                <div className="pl-4">
                  a. Type classification — Top-1 (Accuracy), Precision, Recall, F1
                  <br />
                  b. Make classification — Top-1 (Accuracy), Precision, Recall, F1
                  <br />
                  c. Model classification — Top-1 (Accuracy), Precision, Recall, F1
                </div>
              </div>

              <div>
                <div className="font-medium">
                  2.) Is there a SIGNIFICANT IMPROVEMENT in localization performance between the Baseline part-aware
                  MobileViT and the CMT-trained part-aware MobileViT on a held-out Philippine vehicle test set, in terms of:
                </div>
                <div className="pl-4">
                  a. Vehicle localization — mean IoU (vehicle bounding box)
                  <br />
                  b. Part detection (all parts aggregated) — mAP@50
                  <br />
                  c. Part detection (all parts aggregated) — mAP@75
                </div>
              </div>

              <div>
                <div className="font-medium">
                  3.) What will be the PERFORMANCE OF THE PROPOSED MODEL, CMT-Trained Part-Aware MobileVit, IN COMPARISON
                  to the Baseline Part-Aware MobileVit, when evaluated on progressive levels of occlusion (Clean, Low, Mid,
                  High), in terms of the following accuracy metrics:
                </div>
                <div className="pl-4">
                  a. Type classification — Top-1 (Accuracy), Precision, Recall, F1 (90%, 95%)
                  <br />
                  b. Make classification — Top-1 (Accuracy), Precision, Recall, F1 (90%, 95%)
                  <br />
                  c. Model classification — Top-1 (Accuracy), Precision, Recall, F1 (90%, 95%)
                  <br />
                  d. Vehicle localization — mean IoU (vehicle bounding box)
                </div>
              </div>

              <div>
                <div className="font-medium">
                  4.) What would be real time performance and computational efficiency of the proposed model, CMT-Trained
                  Part-Aware MobileVit, in COMPARISON to the Baseline Part-Aware MobileVit, in terms of:
                </div>
                <div className="pl-4">
                  a. Latency (inference time per frame)
                  <br />
                  b. GFLOPs
                  <br />
                  c. GPU Usage (%)
                  <br />
                  d. Power Consumption (W)
                  <br />
                  e. Memory Usage (GB)
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Evaluation scope & metrics */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Evaluation Scope & Metrics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-400" />
                  Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Macro-averaged Accuracy, Precision, Recall, and F1 across Type, Make, and Model. The Model tier
                demonstrates fine-grained separation.
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
                Vehicle mean IoU for box tightness and Parts mAP@50/@75 for component precision and compositional
                stability.
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
                Latency per frame, GFLOPs, GPU and memory usage, and power draw measured under the same GPU profile.
              </CardContent>
            </Card>
          </div>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-400" />
                Why Part-Based Evidence Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              Decisions arise from multiple cues (grille, lights, wheels, silhouette) rather than a single logo. This
              supports explainability and stabilizes confidence under occlusion.
            </CardContent>
          </Card>
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
                  <FlaskConical className="h-4 w-4 text-orange-400" />
                  Paired, Non-Parametric Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Baseline and CMT are compared on identical items using the{" "}
                <span className="font-medium">Wilcoxon Signed-Rank</span> test. This is suitable for real-world metric
                distributions without normality assumptions.
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                  Trend Across Occlusion
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                A <span className="font-medium">Friedman</span> test across Clean, Low, Mid, and High confirms a rising
                pattern of gains (χ² = 12.6, p = 0.008).
              </CardContent>
            </Card>
          </div>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-orange-400" />
                Significance Labels
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              <span className="font-medium">Highly significant</span>: p &lt; 0.01 ·{" "}
              <span className="font-medium">Significant</span>: p &lt; 0.05 ·{" "}
              <span className="font-medium">Not significant</span>: p ≥ 0.05.
            </CardContent>
          </Card>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Occlusion protocol */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">SOP 3 — Occlusion Protocol</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Silhouette occluders simulate realistic blockers, including vehicles, people, posts, trees, signage, and
            barriers, without altering class identity. Levels are defined as Clean, Low, Mid, and High.
          </p>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                Robustness Readout
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              Positive deltas at each occlusion level and a significant upward trend (Friedman p = 0.008) indicate
              stronger performance as visibility decreases.
            </CardContent>
          </Card>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Aggregation & controls */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Aggregation & Controls</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Aggregation reflects mixed deployment contexts while preserving strict pairing. Data, splits, seeds, and
            hardware remain identical across runs; artifacts are versioned for audit.
          </p>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-orange-400" />
                Evidence Chain
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300 space-y-1">
              <div>Training Logs describe learning behavior across phases.</div>
              <div>Performance Reports present per-phase outcomes and interpretations.</div>
              <div>AI Model Evaluation summarizes final, aggregated claims with statistical support.</div>
            </CardContent>
          </Card>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Decision criteria */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Decision Criteria</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Superiority is established where Wilcoxon shows significant gains for Recognition and Localization,
            a Friedman trend confirms robustness across occlusion levels, and runtime remains statistically unchanged.
          </p>
        </section>
      </div>

      {/* Footer-style phase navigation (outside the dividers) */}
      <div className="w-full border-t border-neutral-800 bg-neutral-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Navigate to Results Page</h2>
          <p className="text-sm text-neutral-300 text-center max-w-3xl mx-auto mt-2">
            Navigate to the Evaluation Results page to see how each Research Question is answered through SOP 1–4—Recognition, Localization, Occlusion Robustness, and Efficiency
          </p>

          <div className="flex flex-wrap gap-3 mt-6 justify-center">

              <Link
                
                href={`/evaluation/results`}
                className="px-4 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              >
                Results Page
              </Link>

          </div>
        </div>
      </div>
    </>
  );
}
