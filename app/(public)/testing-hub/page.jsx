"use client";

import React from "react";
import Link from "next/link";
import { EvervaultCard, Icon } from "@/components/ui/evervault-card";
import Navbar from "@/components/Navbar";

export default function TestingHubPage() {
  const CARDS = [
    {
      key: "performance-testing",
      title: "Performance Test",
      subhead: "Live Performance Evaluation",
      desc: "Run Recognition & Localization Metrics",
      href: "/testing-hub/performance-testing",
    },
    {
      key: "occlusion-testing",
      title: "Occlusion Test",
      subhead: "Live Occlusion Evaluation",
      desc: "Compare Clean / Low / Mid / High Occlusion Tiers",
      href: "/testing-hub/occlusion-testing",
    },
  ];

  return (
    <div
      className="w-full min-h-screen px-32 pb-16 flex flex-col items-center gap-12 bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/Banner.png')" }}
    >
      {/* Header */}
      <Navbar />
      <div className="text-center -mt-8">
        <p className="text-6xl font-bold text-white">Testing Hub</p>
        <p className="text-sm text-gray-300">
          Upload a test ZIP and run live evaluations — Performance & Occlusion Testing
        </p>
      </div>

      {/* 2 Evervault cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {CARDS.map((c) => (
          <div
            key={c.key}
            className="border border-black/[0.2] dark:border-white/[0.2] flex flex-col items-start max-w-sm mx-auto p-4 relative h-[30rem]"
          >
            {/* corner accents */}
            <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
            <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

            {/* Card body */}
            <Link href={c.href} className="w-full h-full" title={c.title}>
              <EvervaultCard text={c.title} />
            </Link>

            {/* Title + Description */}
            <div className="w-full flex flex-col justify-center items-center">
              <h2 className="dark:text-white text-black mt-4 text-base font-medium text-center">
                {c.subhead}
              </h2>
              <p className="text-xs border font-light dark:border-white/[0.2] border-black/[0.2] rounded-full mt-1 text-black dark:text-white px-3 py-1 text-center">
                {c.desc}
              </p>
            </div>

            {/* Disabled menu button (visual parity only) */}
            <div className="absolute top-4 right-4">
              <div className="p-1 rounded-sm border-[1px] border-neutral-800 opacity-40 pointer-events-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
