"use client";

import * as React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PHASES } from "@/lib/trainingData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Target, Layers3, Activity } from "lucide-react";

export default function DocumentationIntroPage() {
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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">TRAINING LOGS</h1>
          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl mx-auto">
            This page shows how CVITX learned over time. We start with the{" "}
            <span className="text-cyan-400 font-medium">Baseline</span> run and continue with{" "}
            <span className="text-orange-400 font-medium">Compositional Masking Training (CMT)</span>. Use the logs to
            read the story of the model’s learning. For numbers and tests, check{" "}
            <span className="font-medium">Performance Reports</span> and{" "}
            <span className="font-medium">AI Model Evaluation</span>.
          </p>
        </header>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Overview */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Overview</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            The logs explain what each phase tried to teach and how masking affected behavior. Curves help you see
            direction and stability. The separate report pages turn those signals into tested results.
          </p>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Training Regimes */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Training Regimes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-orange-400" />
                  Baseline (Unmasked)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Trains on clean images to build reliable visual priors and class structure. Serves as the reference run
                for all comparisons.
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-orange-400" />
                  CMT (Masked)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Adds structured occlusions so the model learns from multiple cues, not just logos or plates. This is
                where robustness comes from.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Masking Strategies */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Masking Strategies</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-orange-400" />
                  Progressive Masking
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Hides 1, 3, or 5 parts in rounds. Because different parts disappear each time, the model widens the set
                of features it trusts and avoids single-cue shortcuts.
              </CardContent>
            </Card>

            <Card className="bg-neutral-950 border-orange-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-400" />
                  Contextual Masking
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300">
                Uses saliency to hide low, then mid, then high-impact regions. Early passes keep key areas visible; later
                passes force the model to read the scene from secondary cues.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Curriculum Framework */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Curriculum Learning Framework</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Difficulty ramps from controlled images to busy roads. Each phase continues from Baseline into CMT with the
            same data, seeds, and hardware.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { t: "Phase 1 — Coarse Type", d: "Builds basic type awareness." },
              { t: "Phase 2 — Frontal Make", d: "Brand cues in clean, frontal views." },
              { t: "Phase 3 — Make–Model", d: "Fine-grained classes in controlled scenes." },
              { t: "Phase 4 — Street (Single)", d: "Single-vehicle frames with mild clutter." },
              { t: "Phase 5 — Street (Multi)", d: "Urban frames with multiple vehicles." },
              { t: "Phase 6 — Highway (Heavy)", d: "Fast motion, scale changes, heavy occlusion." },
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

        {/* Coverage & Reading the Curves */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Coverage & Reading the Curves</h2>

          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            <span className="font-semibold">Recognition</span> covers{" "}
            <span className="font-medium">Type · Make · Model</span>.{" "}
            <span className="font-semibold">Localization</span> covers{" "}
            <span className="font-medium">Vehicle Box</span> and <span className="font-medium">Parts Box</span>.
          </p>

          <Card className="bg-neutral-950 border-orange-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-400" />
                Healthy End State
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-neutral-300">
              Expect steady drops, brief bumps when a phase or masking level changes, and a lower plateau near the end.
              After the Baseline plateaus, CMT should push a little further or hold a steadier floor.
            </CardContent>
          </Card>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Why Baseline → CMT */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Why Baseline → CMT</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Baseline organizes the basics. CMT then shakes the evidence so the model learns to reason from parts and
            context. That’s the path to robustness, not just higher scores.
          </p>
        </section>

        {/* ───────────── Divider ───────────── */}
        <hr className="my-16 border-neutral-500" />

        {/* Controls & Reproducibility */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Controls & Reproducibility</h2>
          <p className="text-neutral-300 text-center max-w-3xl mx-auto">
            Baseline and CMT share the same data, splits, preprocessing, seeds, and GPU. Only masking changes. We keep
            checkpoints and artifacts versioned and time-stamped so runs are easy to audit.
          </p>
        </section>
      </div>

      {/* Footer-style phase navigation (outside the dividers) */}
      <div className="w-full border-t border-neutral-800 bg-neutral-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
          <h2 className="text-xl md:text-2xl font-semibold text-center">Navigate to Phases</h2>
          <p className="text-sm text-neutral-300 text-center max-w-3xl mx-auto mt-2">
            Open any phase to see its curves and notes. For per-phase metrics, check{" "}
            <span className="font-medium">Performance Reports</span>. For the final verdict, see{" "}
            <span className="font-medium">AI Model Evaluation</span>.
          </p>

          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            {PHASES.map((p, i) => (
              <Link
                key={p.key}
                href={`/training/${p.key}`}
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
