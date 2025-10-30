// performanceData.js
// Dummy but consistent per-phase evaluation tables for your dashboard / Chapter 4.
// Conventions:
// - Only include levels that actually apply per phase (no blanks).
// - delta is a NUMBER (no leading "+"). Add the plus sign in UI formatting if needed.
// - Fields: level, metric, baseline, cmt, delta, W, p, interpretation.

export const VERSION = "per-phase-dummy-v1";

// ==============================
// 📗 Phase 1 — Type only
// ==============================

// P1-A · Recognition (Type)
export const P1_Recognition = [
  { level: "Type", metric: "Accuracy",  baseline: 0.842, cmt: 0.871, delta: 0.029, W: 12, p: 0.041, interpretation: "Significant type-level improvement" },
  { level: "Type", metric: "Precision", baseline: 0.823, cmt: 0.861, delta: 0.038, W: 11, p: 0.038, interpretation: "Reduced false positives" },
  { level: "Type", metric: "Recall",    baseline: 0.835, cmt: 0.872, delta: 0.037, W: 10, p: 0.032, interpretation: "Higher recall" },
  { level: "Type", metric: "F1",        baseline: 0.829, cmt: 0.867, delta: 0.038, W:  9, p: 0.028, interpretation: "Balanced gain" },
];

// P1-B · Localization
export const P1_Localization = [
  { metric: "Mean IoU", baseline: 0.742, cmt: 0.761, delta: 0.019, W: 8, p: 0.047, interpretation: "Slight bounding-box improvement" },
  { metric: "mAP@50",   baseline: 0.703, cmt: 0.749, delta: 0.046, W: 7, p: 0.034, interpretation: "Higher part detection" },
  { metric: "mAP@75",   baseline: 0.621, cmt: 0.683, delta: 0.062, W: 6, p: 0.021, interpretation: "More precise localization" },
];

// P1-C · Efficiency
export const P1_Efficiency = [
  { metric: "Latency (ms)", baseline: 21.8, cmt: 22.1, delta: 0.3,  W: 9, p: 0.217, interpretation: "Real-time retained" },
  { metric: "GFLOPs",       baseline:  7.52, cmt:  7.60, delta: 0.08, W: 8, p: 0.183, interpretation: "Minor increase" },
  { metric: "GPU Usage (%)",baseline: 69.2, cmt: 70.1, delta: 0.9,  W: 8, p: 0.190, interpretation: "Stable load" },
  { metric: "Power (W)",    baseline:110.8, cmt:111.3, delta: 0.5,  W: 7, p: 0.206, interpretation: "No impact" },
  { metric: "Memory (GB)",  baseline:  4.58, cmt:  4.60, delta: 0.02, W: 7, p: 0.221, interpretation: "Stable use" },
];

// ==============================
// 📗 Phase 2 — Make only
// ==============================

export const P2_Recognition = [
  { level: "Make", metric: "Accuracy",  baseline: 0.802, cmt: 0.847, delta: 0.045, W:10, p:0.025, interpretation: "Improved frontal make recognition" },
  { level: "Make", metric: "Precision", baseline: 0.785, cmt: 0.841, delta: 0.056, W: 9, p:0.020, interpretation: "Better logo distinction" },
  { level: "Make", metric: "Recall",    baseline: 0.796, cmt: 0.850, delta: 0.054, W: 8, p:0.018, interpretation: "Higher true-positive rate" },
  { level: "Make", metric: "F1",        baseline: 0.791, cmt: 0.845, delta: 0.054, W: 7, p:0.016, interpretation: "Statistically significant gain" },
];

export const P2_Localization = [
  { metric: "Mean IoU", baseline: 0.751, cmt: 0.774, delta: 0.023, W: 8, p: 0.039, interpretation: "Slight tightening of boxes" },
  { metric: "mAP@50",   baseline: 0.701, cmt: 0.755, delta: 0.054, W: 7, p: 0.013, interpretation: "Improved frontal part detection" },
  { metric: "mAP@75",   baseline: 0.623, cmt: 0.692, delta: 0.069, W: 6, p: 0.009, interpretation: "Higher precision" },
];

export const P2_Efficiency = [
  { metric: "Latency (ms)", baseline: 22.0, cmt: 22.3, delta: 0.3,  W: 9, p: 0.184, interpretation: "Real-time retained" },
  { metric: "GFLOPs",       baseline:  7.54, cmt:  7.68, delta: 0.14, W: 8, p: 0.170, interpretation: "Negligible increase" },
  { metric: "GPU Usage (%)",baseline: 70.1, cmt: 71.0, delta: 0.9,  W: 8, p: 0.176, interpretation: "Stable load" },
  { metric: "Power (W)",    baseline:111.0, cmt:111.8, delta: 0.8,  W: 7, p: 0.199, interpretation: "No significant change" },
  { metric: "Memory (GB)",  baseline:  4.59, cmt:  4.63, delta: 0.04, W: 7, p: 0.210, interpretation: "Stable use" },
];

// ==============================
// 📗 Phase 3 — Type + Make + Model
// ==============================

export const P3_Recognition = [
  // Type
  { level: "Type",  metric: "Accuracy",  baseline: 0.842, cmt: 0.870, delta: 0.028, W: 9, p: 0.036, interpretation: "Incremental gain" },
  { level: "Type",  metric: "Precision", baseline: 0.831, cmt: 0.865, delta: 0.034, W: 8, p: 0.031, interpretation: "Reduced type confusion" },
  { level: "Type",  metric: "Recall",    baseline: 0.838, cmt: 0.870, delta: 0.032, W: 8, p: 0.029, interpretation: "Slight recall increase" },
  { level: "Type",  metric: "F1",        baseline: 0.835, cmt: 0.868, delta: 0.033, W: 7, p: 0.027, interpretation: "Consistent gain" },
  // Make
  { level: "Make",  metric: "Accuracy",  baseline: 0.802, cmt: 0.848, delta: 0.046, W: 9, p: 0.022, interpretation: "Higher brand recognition" },
  { level: "Make",  metric: "Precision", baseline: 0.790, cmt: 0.845, delta: 0.055, W: 8, p: 0.017, interpretation: "Sharper logo distinction" },
  { level: "Make",  metric: "Recall",    baseline: 0.794, cmt: 0.847, delta: 0.053, W: 8, p: 0.016, interpretation: "Improved brand recall" },
  { level: "Make",  metric: "F1",        baseline: 0.791, cmt: 0.846, delta: 0.055, W: 7, p: 0.013, interpretation: "Balanced improvement" },
  // Model
  { level: "Model", metric: "Accuracy",  baseline: 0.831, cmt: 0.883, delta: 0.052, W:10, p: 0.011, interpretation: "Fine-grained recognition" },
  { level: "Model", metric: "Precision", baseline: 0.819, cmt: 0.876, delta: 0.057, W: 9, p: 0.009, interpretation: "Better model separation" },
  { level: "Model", metric: "Recall",    baseline: 0.824, cmt: 0.879, delta: 0.055, W: 8, p: 0.007, interpretation: "Higher recall" },
  { level: "Model", metric: "F1",        baseline: 0.823, cmt: 0.879, delta: 0.056, W: 7, p: 0.006, interpretation: "Highly significant" },
];

export const P3_Localization = [
  { metric: "Mean IoU", baseline: 0.748, cmt: 0.781, delta: 0.033, W: 8, p: 0.027, interpretation: "Better alignment" },
  { metric: "mAP@50",   baseline: 0.726, cmt: 0.777, delta: 0.051, W: 7, p: 0.018, interpretation: "Higher part recall" },
  { metric: "mAP@75",   baseline: 0.614, cmt: 0.685, delta: 0.071, W: 6, p: 0.004, interpretation: "Higher precision" },
];

export const P3_Efficiency = [
  { metric: "Latency (ms)", baseline: 22.2, cmt: 22.5, delta: 0.3,  W: 9, p: 0.189, interpretation: "Real-time maintained" },
  { metric: "GFLOPs",       baseline:  7.55, cmt:  7.72, delta: 0.17, W: 8, p: 0.165, interpretation: "Slight increase" },
  { metric: "GPU Usage (%)",baseline: 70.4, cmt: 71.2, delta: 0.8,  W: 8, p: 0.172, interpretation: "Stable" },
  { metric: "Power (W)",    baseline:111.3, cmt:112.1, delta: 0.8,  W: 7, p: 0.197, interpretation: "Negligible cost" },
  { metric: "Memory (GB)",  baseline:  4.61, cmt:  4.65, delta: 0.04, W: 7, p: 0.208, interpretation: "Within margin" },
];

// ==============================
// 📗 Phase 4 — Type + Make + Model
// ==============================

export const P4_Recognition = [
  // Type
  { level: "Type",  metric: "Accuracy",  baseline: 0.838, cmt: 0.873, delta: 0.035, W: 9, p: 0.033, interpretation: "Improved vehicle-type detection" },
  { level: "Type",  metric: "Precision", baseline: 0.829, cmt: 0.868, delta: 0.039, W: 8, p: 0.028, interpretation: "Reduced false positives" },
  { level: "Type",  metric: "Recall",    baseline: 0.834, cmt: 0.871, delta: 0.037, W: 8, p: 0.026, interpretation: "Higher recall" },
  { level: "Type",  metric: "F1",        baseline: 0.837, cmt: 0.874, delta: 0.037, W: 7, p: 0.023, interpretation: "Significant gain" },
  // Make
  { level: "Make",  metric: "Accuracy",  baseline: 0.792, cmt: 0.848, delta: 0.056, W: 9, p: 0.020, interpretation: "Improved brand identification" },
  { level: "Make",  metric: "Precision", baseline: 0.784, cmt: 0.845, delta: 0.061, W: 8, p: 0.017, interpretation: "Sharper brand distinction" },
  { level: "Make",  metric: "Recall",    baseline: 0.789, cmt: 0.849, delta: 0.060, W: 8, p: 0.016, interpretation: "Improved brand recall" },
  { level: "Make",  metric: "F1",        baseline: 0.794, cmt: 0.851, delta: 0.057, W: 7, p: 0.015, interpretation: "Significant gain" },
  // Model
  { level: "Model", metric: "Accuracy",  baseline: 0.817, cmt: 0.879, delta: 0.062, W: 9, p: 0.009, interpretation: "Strong fine-grained recognition" },
  { level: "Model", metric: "Precision", baseline: 0.812, cmt: 0.878, delta: 0.066, W: 8, p: 0.008, interpretation: "Higher precision" },
  { level: "Model", metric: "Recall",    baseline: 0.815, cmt: 0.880, delta: 0.065, W: 8, p: 0.007, interpretation: "Stronger recall" },
  { level: "Model", metric: "F1",        baseline: 0.820, cmt: 0.881, delta: 0.061, W: 7, p: 0.006, interpretation: "Highly significant" },
];

export const P4_Localization = [
  { metric: "Mean IoU", baseline: 0.736, cmt: 0.774, delta: 0.038, W: 8, p: 0.024, interpretation: "Better object localization" },
  { metric: "mAP@50",   baseline: 0.710, cmt: 0.768, delta: 0.058, W: 7, p: 0.015, interpretation: "Stronger detection" },
  { metric: "mAP@75",   baseline: 0.628, cmt: 0.702, delta: 0.074, W: 6, p: 0.005, interpretation: "High precision" },
];

export const P4_Efficiency = [
  { metric: "Latency (ms)", baseline: 22.4, cmt: 22.6, delta: 0.2,  W: 9, p: 0.195, interpretation: "Unchanged speed" },
  { metric: "GFLOPs",       baseline:  7.58, cmt:  7.73, delta: 0.15, W: 8, p: 0.177, interpretation: "Negligible load increase" },
  { metric: "GPU Usage (%)",baseline: 70.7, cmt: 71.5, delta: 0.8,  W: 8, p: 0.183, interpretation: "Stable" },
  { metric: "Power (W)",    baseline:111.5, cmt:112.2, delta: 0.7,  W: 7, p: 0.202, interpretation: "No significant cost" },
  { metric: "Memory (GB)",  baseline:  4.63, cmt:  4.67, delta: 0.04, W: 7, p: 0.214, interpretation: "Stable memory" },
];

// ==============================
// 📗 Phase 5 — Type + Make + Model
// ==============================

export const P5_Recognition = [
  // Type
  { level: "Type",  metric: "Accuracy",  baseline: 0.836, cmt: 0.872, delta: 0.036, W: 9, p: 0.030, interpretation: "Significant gain" },
  { level: "Type",  metric: "Precision", baseline: 0.827, cmt: 0.866, delta: 0.039, W: 8, p: 0.026, interpretation: "Reduced false positives" },
  { level: "Type",  metric: "Recall",    baseline: 0.831, cmt: 0.869, delta: 0.038, W: 8, p: 0.024, interpretation: "Improved sensitivity" },
  { level: "Type",  metric: "F1",        baseline: 0.832, cmt: 0.870, delta: 0.038, W: 9, p: 0.029, interpretation: "Significant overall gain" },
  // Make
  { level: "Make",  metric: "Accuracy",  baseline: 0.790, cmt: 0.844, delta: 0.054, W: 9, p: 0.020, interpretation: "Improved brand accuracy" },
  { level: "Make",  metric: "Precision", baseline: 0.780, cmt: 0.842, delta: 0.062, W: 8, p: 0.017, interpretation: "Better logo discrimination" },
  { level: "Make",  metric: "Recall",    baseline: 0.786, cmt: 0.845, delta: 0.059, W: 8, p: 0.016, interpretation: "Higher brand recall" },
  { level: "Make",  metric: "F1",        baseline: 0.788, cmt: 0.845, delta: 0.057, W: 8, p: 0.018, interpretation: "Statistically significant" },
  // Model
  { level: "Model", metric: "Accuracy",  baseline: 0.814, cmt: 0.876, delta: 0.062, W: 9, p: 0.010, interpretation: "Strong fine-grained accuracy" },
  { level: "Model", metric: "Precision", baseline: 0.806, cmt: 0.874, delta: 0.068, W: 8, p: 0.008, interpretation: "Sharper model separation" },
  { level: "Model", metric: "Recall",    baseline: 0.811, cmt: 0.877, delta: 0.066, W: 7, p: 0.007, interpretation: "Robust recall" },
  { level: "Model", metric: "F1",        baseline: 0.816, cmt: 0.878, delta: 0.062, W: 7, p: 0.007, interpretation: "Highly significant" },
];

export const P5_Localization = [
  { metric: "Mean IoU", baseline: 0.729, cmt: 0.769, delta: 0.040, W: 8, p: 0.022, interpretation: "Better vehicle bounding" },
  { metric: "mAP@50",   baseline: 0.703, cmt: 0.763, delta: 0.060, W: 7, p: 0.014, interpretation: "Higher detection accuracy" },
  { metric: "mAP@75",   baseline: 0.624, cmt: 0.698, delta: 0.074, W: 6, p: 0.005, interpretation: "High precision" },
];

export const P5_Efficiency = [
  { metric: "Latency (ms)", baseline: 22.5, cmt: 22.8, delta: 0.3,  W: 9, p: 0.201, interpretation: "No impact" },
  { metric: "GFLOPs",       baseline:  7.61, cmt:  7.76, delta: 0.15, W: 8, p: 0.175, interpretation: "Stable load" },
  { metric: "GPU Usage (%)",baseline: 71.0, cmt: 71.8, delta: 0.8,  W: 8, p: 0.180, interpretation: "Normal increase" },
  { metric: "Power (W)",    baseline:111.8, cmt:112.5, delta: 0.7,  W: 7, p: 0.199, interpretation: "Efficient runtime" },
  { metric: "Memory (GB)",  baseline:  4.64, cmt:  4.68, delta: 0.04, W: 7, p: 0.210, interpretation: "Stable usage" },
];

// ==============================
// 📗 Phase 6 — Type + Make + Model
// ==============================

export const P6_Recognition = [
  // Type
  { level: "Type",  metric: "Accuracy",  baseline: 0.828, cmt: 0.867, delta: 0.039, W: 9, p: 0.024, interpretation: "Maintained robustness" },
  { level: "Type",  metric: "Precision", baseline: 0.818, cmt: 0.865, delta: 0.047, W: 9, p: 0.020, interpretation: "Fewer false classifications" },
  { level: "Type",  metric: "Recall",    baseline: 0.823, cmt: 0.869, delta: 0.046, W: 9, p: 0.019, interpretation: "Higher true-positive recovery" },
  { level: "Type",  metric: "F1",        baseline: 0.825, cmt: 0.868, delta: 0.043, W: 9, p: 0.023, interpretation: "Significant improvement" },
  // Make
  { level: "Make",  metric: "Accuracy",  baseline: 0.776, cmt: 0.838, delta: 0.062, W: 8, p: 0.017, interpretation: "Strong brand retention" },
  { level: "Make",  metric: "Precision", baseline: 0.767, cmt: 0.835, delta: 0.068, W: 8, p: 0.014, interpretation: "Higher precision" },
  { level: "Make",  metric: "Recall",    baseline: 0.772, cmt: 0.839, delta: 0.067, W: 8, p: 0.013, interpretation: "Stronger recall" },
  { level: "Make",  metric: "F1",        baseline: 0.782, cmt: 0.842, delta: 0.060, W: 8, p: 0.016, interpretation: "Statistically significant" },
  // Model
  { level: "Model", metric: "Accuracy",  baseline: 0.806, cmt: 0.873, delta: 0.067, W: 7, p: 0.007, interpretation: "Large gain under occlusion" },
  { level: "Model", metric: "Precision", baseline: 0.798, cmt: 0.871, delta: 0.073, W: 7, p: 0.006, interpretation: "Exceptional fine-detail resilience" },
  { level: "Model", metric: "Recall",    baseline: 0.803, cmt: 0.874, delta: 0.071, W: 7, p: 0.006, interpretation: "Very robust recall" },
  { level: "Model", metric: "F1",        baseline: 0.812, cmt: 0.877, delta: 0.065, W: 7, p: 0.006, interpretation: "Highly significant" },
];

export const P6_Localization = [
  { metric: "Mean IoU", baseline: 0.718, cmt: 0.763, delta: 0.045, W: 8, p: 0.019, interpretation: "Robust bounding under occlusion" },
  { metric: "mAP@50",   baseline: 0.693, cmt: 0.757, delta: 0.064, W: 7, p: 0.012, interpretation: "Improved detection under clutter" },
  { metric: "mAP@75",   baseline: 0.611, cmt: 0.694, delta: 0.083, W: 6, p: 0.004, interpretation: "Significant precision gain" },
];

export const P6_Efficiency = [
  { metric: "Latency (ms)", baseline: 22.6, cmt: 22.9, delta: 0.3,  W: 9, p: 0.210, interpretation: "Real-time sustained" },
  { metric: "GFLOPs",       baseline:  7.63, cmt:  7.79, delta: 0.16, W: 8, p: 0.182, interpretation: "Acceptable cost" },
  { metric: "GPU Usage (%)",baseline: 71.2, cmt: 72.1, delta: 0.9,  W: 8, p: 0.185, interpretation: "Stable GPU use" },
  { metric: "Power (W)",    baseline:112.0, cmt:112.8, delta: 0.8,  W: 7, p: 0.201, interpretation: "Efficient consumption" },
  { metric: "Memory (GB)",  baseline:  4.66, cmt:  4.70, delta: 0.04, W: 7, p: 0.215, interpretation: "Stable usage" },
];

// ==============================
// Aggregate export for convenience
// ==============================
export const perPhaseTables = {
  P1: { recognition: P1_Recognition, localization: P1_Localization, efficiency: P1_Efficiency },
  P2: { recognition: P2_Recognition, localization: P2_Localization, efficiency: P2_Efficiency },
  P3: { recognition: P3_Recognition, localization: P3_Localization, efficiency: P3_Efficiency },
  P4: { recognition: P4_Recognition, localization: P4_Localization, efficiency: P4_Efficiency },
  P5: { recognition: P5_Recognition, localization: P5_Localization, efficiency: P5_Efficiency },
  P6: { recognition: P6_Recognition, localization: P6_Localization, efficiency: P6_Efficiency },
};

export default perPhaseTables;

/*
UI tips:
- To render "+Δ" in the table, format the numeric `delta` in your component:
  const fmtDelta = (d) => (d >= 0 ? `+${d.toFixed(3)}` : d.toFixed(3));
- Group rows by `level` when displaying Recognition tables.
- Keep numbers as-is (no rounding here) to let the UI decide.
*/
