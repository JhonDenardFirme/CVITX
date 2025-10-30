// ==============================================
// 📘 CVITX — SOP Aggregated Evaluation Results
// File: /data/sopData.js
// ----------------------------------------------
// This module exports the statistical results
// for SOP1–SOP4 (aggregated across all phases).
// All numbers are dummy placeholders consistent
// with your thesis documentation.
// ==============================================

export const sop1Recognition = [
  // SOP 1 — Recognition (Type / Make / Model)
  {
    level: "Type",
    metrics: [
      { metric: "Accuracy", baseline: 0.841, cmt: 0.872, delta: +0.031, W: 17, p: 0.034, interpretation: "Significant improvement in type recognition" },
      { metric: "Precision", baseline: 0.824, cmt: 0.865, delta: +0.041, W: 16, p: 0.027, interpretation: "Reduced false positives" },
      { metric: "Recall", baseline: 0.833, cmt: 0.870, delta: +0.037, W: 15, p: 0.024, interpretation: "Higher detection sensitivity" },
      { metric: "F1", baseline: 0.829, cmt: 0.868, delta: +0.039, W: 14, p: 0.021, interpretation: "Balanced overall gain" },
    ],
  },
  {
    level: "Make",
    metrics: [
      { metric: "Accuracy", baseline: 0.803, cmt: 0.849, delta: +0.046, W: 12, p: 0.018, interpretation: "Statistically significant improvement" },
      { metric: "Precision", baseline: 0.787, cmt: 0.844, delta: +0.057, W: 11, p: 0.015, interpretation: "Improved per-make classification" },
      { metric: "Recall", baseline: 0.796, cmt: 0.851, delta: +0.055, W: 10, p: 0.013, interpretation: "Enhanced recall" },
      { metric: "F1", baseline: 0.792, cmt: 0.846, delta: +0.054, W: 9, p: 0.010, interpretation: "Highly significant overall improvement" },
    ],
  },
  {
    level: "Model",
    metrics: [
      { metric: "Accuracy", baseline: 0.831, cmt: 0.883, delta: +0.052, W: 10, p: 0.011, interpretation: "Improved fine-grained classification" },
      { metric: "Precision", baseline: 0.820, cmt: 0.877, delta: +0.057, W: 9, p: 0.008, interpretation: "Better model differentiation" },
      { metric: "Recall", baseline: 0.825, cmt: 0.880, delta: +0.055, W: 8, p: 0.007, interpretation: "Higher recall rate" },
      { metric: "F1", baseline: 0.823, cmt: 0.879, delta: +0.056, W: 7, p: 0.006, interpretation: "Highly significant and balanced gain" },
    ],
  },
];

// --------------------------------------------------

export const sop2Localization = [
  // SOP 2 — Localization (IoU / mAP)
  { metric: "Mean IoU (Vehicle Box)", baseline: 0.749, cmt: 0.779, delta: +0.030, W: 8, p: 0.025, interpretation: "Significant overlap gain" },
  { metric: "mAP@50 (Parts)", baseline: 0.716, cmt: 0.771, delta: +0.055, W: 7, p: 0.018, interpretation: "Stronger detection of key vehicle parts" },
  { metric: "mAP@75 (Parts)", baseline: 0.624, cmt: 0.689, delta: +0.065, W: 6, p: 0.009, interpretation: "High-precision localization" },
];

// --------------------------------------------------

export const sop3Occlusion = {
  // SOP 3 — Occlusion Robustness (Progressive Levels)
  conditions: [
    {
      level: "Clean",
      data: [
        {
          level: "Type",
          metrics: [
            { metric: "Accuracy", baseline: 0.842, cmt: 0.872, delta: +0.030, W: 12, p: 0.042 },
            { metric: "Precision", baseline: 0.825, cmt: 0.861, delta: +0.036, W: 11, p: 0.039 },
            { metric: "Recall", baseline: 0.834, cmt: 0.869, delta: +0.035, W: 10, p: 0.033 },
            { metric: "F1", baseline: 0.829, cmt: 0.867, delta: +0.038, W: 9, p: 0.029 },
          ],
        },
        {
          level: "Make",
          metrics: [
            { metric: "Accuracy", baseline: 0.803, cmt: 0.845, delta: +0.042, W: 10, p: 0.030 },
            { metric: "Precision", baseline: 0.786, cmt: 0.842, delta: +0.056, W: 9, p: 0.026 },
            { metric: "Recall", baseline: 0.795, cmt: 0.849, delta: +0.054, W: 8, p: 0.024 },
            { metric: "F1", baseline: 0.790, cmt: 0.846, delta: +0.056, W: 7, p: 0.021 },
          ],
        },
        {
          level: "Model",
          metrics: [
            { metric: "Accuracy", baseline: 0.828, cmt: 0.879, delta: +0.051, W: 9, p: 0.018 },
            { metric: "Precision", baseline: 0.817, cmt: 0.875, delta: +0.058, W: 8, p: 0.015 },
            { metric: "Recall", baseline: 0.822, cmt: 0.878, delta: +0.056, W: 7, p: 0.013 },
            { metric: "F1", baseline: 0.820, cmt: 0.877, delta: +0.057, W: 6, p: 0.010 },
          ],
        },
        { level: "Vehicle IoU", metrics: [{ metric: "Mean IoU", baseline: 0.751, cmt: 0.777, delta: +0.026, W: 8, p: 0.034 }] },
      ],
    },
    {
      level: "Low",
      data: [
        { level: "Type", metrics: [
          { metric: "Accuracy", baseline: 0.821, cmt: 0.862, delta: +0.041, W: 12, p: 0.031 },
          { metric: "Precision", baseline: 0.810, cmt: 0.856, delta: +0.046, W: 11, p: 0.027 },
          { metric: "Recall", baseline: 0.816, cmt: 0.861, delta: +0.045, W: 10, p: 0.023 },
          { metric: "F1", baseline: 0.813, cmt: 0.858, delta: +0.045, W: 9, p: 0.020 },
        ]},
        { level: "Make", metrics: [
          { metric: "Accuracy", baseline: 0.785, cmt: 0.836, delta: +0.051, W: 10, p: 0.022 },
          { metric: "Precision", baseline: 0.772, cmt: 0.834, delta: +0.062, W: 9, p: 0.018 },
          { metric: "Recall", baseline: 0.780, cmt: 0.841, delta: +0.061, W: 8, p: 0.016 },
          { metric: "F1", baseline: 0.776, cmt: 0.838, delta: +0.062, W: 7, p: 0.013 },
        ]},
        { level: "Model", metrics: [
          { metric: "Accuracy", baseline: 0.808, cmt: 0.867, delta: +0.059, W: 9, p: 0.012 },
          { metric: "Precision", baseline: 0.796, cmt: 0.864, delta: +0.068, W: 8, p: 0.009 },
          { metric: "Recall", baseline: 0.803, cmt: 0.869, delta: +0.066, W: 7, p: 0.008 },
          { metric: "F1", baseline: 0.799, cmt: 0.866, delta: +0.067, W: 6, p: 0.006 },
        ]},
        { level: "Vehicle IoU", metrics: [{ metric: "Mean IoU", baseline: 0.739, cmt: 0.769, delta: +0.030, W: 8, p: 0.025 }] },
      ],
    },
    // ... Mid and High occlusion sections can follow same structure as above.
  ],
  friedmanTest: { chi2: 12.6, p: 0.008, interpretation: "Significant trend — CMT’s gains increase with occlusion severity." },
};

// --------------------------------------------------

export const sop4Efficiency = [
  // SOP 4 — Efficiency
  { metric: "Latency (ms/frame)", baseline: 22.0, cmt: 22.3, delta: +0.3, W: 9, p: 0.187, interpretation: "No significant difference; real-time maintained" },
  { metric: "GFLOPs", baseline: 7.54, cmt: 7.69, delta: +0.15, W: 8, p: 0.173, interpretation: "Negligible computational increase" },
  { metric: "GPU Usage (%)", baseline: 70.1, cmt: 71.0, delta: +0.9, W: 8, p: 0.180, interpretation: "Stable utilization" },
  { metric: "Power (W)", baseline: 111.0, cmt: 111.7, delta: +0.7, W: 7, p: 0.201, interpretation: "No power impact" },
  { metric: "Memory (GB)", baseline: 4.59, cmt: 4.63, delta: +0.04, W: 7, p: 0.215, interpretation: "Stable memory usage" },
];

// --------------------------------------------------

export const sopOverview = [
  { sop: "SOP 1 — Recognition", test: "Wilcoxon", significant: true, outcome: "CMT significantly improves accuracy, precision, recall, and F1 across all levels" },
  { sop: "SOP 2 — Localization", test: "Wilcoxon", significant: true, outcome: "CMT yields more precise bounding-box detection" },
  { sop: "SOP 3 — Occlusion Robustness", test: "Wilcoxon + Friedman", significant: true, outcome: "CMT’s gains increase with occlusion severity" },
  { sop: "SOP 4 — Efficiency", test: "Wilcoxon", significant: false, outcome: "CMT maintains real-time performance without significant computational overhead" },
];

// ==============================================
// Usage Example (in your Next.js component):
// import { sop1Recognition, sop3Occlusion } from "@/data/sopData";
// ==============================================
