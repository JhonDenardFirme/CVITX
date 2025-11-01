// File: lib/imageAnalysisNormalize.js
// (Your imports use "@/lib/imageAnalysisNormalize" — this filename is correct.)

function to01(x) {
  if (x == null || Number.isNaN(+x)) return null;
  const n = +x;
  if (n <= 1) return Math.max(0, Math.min(1, n));
  if (n <= 100) return Math.max(0, Math.min(100, n)) / 100;
  return 1; // clamp if someone sent >100 by mistake
}

/* ────────────────────────────────────────────────────────────────────────────
   Colors
   ──────────────────────────────────────────────────────────────────────────── */
function normColor(c) {
  if (c == null) return null;

  if (typeof c === "string" || typeof c === "number") {
    return { finish: null, base: String(c), lightness: null, conf: null };
  }
  if (typeof c !== "object") return null;

  const finish = c.finish != null ? String(c.finish) : null;
  const base = c.base != null ? String(c.base) : null;
  const lightness = c.lightness != null ? String(c.lightness) : null;
  const conf = to01(c.conf ?? c.p ?? c.confidence ?? null);

  if (!finish && !base && !lightness && conf == null) return null;
  return { finish, base, lightness, conf };
}

function normColors(v) {
  let raw = [];
  if (Array.isArray(v.colors)) raw = v.colors;
  else if (v.colors && typeof v.colors === "object") raw = Object.values(v.colors);
  else if (v.color != null) raw = [v.color];
  return raw.map(normColor).filter(Boolean);
}

/* ────────────────────────────────────────────────────────────────────────────
   Parts — SINGLE SOURCE OF TRUTH from backend overlay (no FE filtering)
   ──────────────────────────────────────────────────────────────────────────── */

// Minimal part normalizer — do NOT rename labels; reflect backend overlay text.
function normPart(p) {
  if (!p || typeof p !== "object") return null;
  const name = p.name ?? p.label ?? p.part ?? null;
  if (!name) return null;

  let conf = to01(p.conf ?? p.confidence ?? p.score ?? p.p ?? null);
  if (conf == null) conf = 0; // keep visible even if backend omitted confidence

  const box_sq =
    Array.isArray(p.box_sq) && p.box_sq.length === 4
      ? p.box_sq.map(Number)
      : undefined;

  return { name: String(name), conf, ...(box_sq ? { box_sq } : {}) };
}

export function normalizeVariant(v) {
  if (!v) return null;

  const type_conf  = to01(v.type_conf  ?? v.typeConfidence  ?? null);
  const make_conf  = to01(v.make_conf  ?? v.makeConfidence  ?? null);
  const model_conf = to01(v.model_conf ?? v.modelConfidence ?? null);

  const colors = normColors(v);

  // Priority: use the backend’s filtered overlay set first.
  // If missing, fall back to the decoded list, then the raw scoreboard.
  let partsSrc = [];
  if (Array.isArray(v._debug_parts_sq)) {
    partsSrc = v._debug_parts_sq;             // ← filtered (what the worker draws)
  } else if (Array.isArray(v.vision?.parts)) {
    partsSrc = v.vision.parts;                // ← decoded, less filtered
  } else if (Array.isArray(v.parts)) {
    partsSrc = v.parts;                       // ← raw scoreboard
  }

  // Map only; do NOT apply FE-side allowlists, thresholds, or top-K.
  // Keep backend labels as-is so the list matches the annotated image.
  const parts = (partsSrc || []).map(normPart).filter(Boolean);

  // ── Asset convenience fields (with safe fallbacks) ─────────────────────────
  let annotated_image = null;
  if (v.assets?.annotated_url) {
    annotated_image = {
      url: v.assets.annotated_url,
      s3_key: v.assets.annotated_image_s3_key ?? v.assets.annotated_s3_key ?? null,
    };
  } else if (v.annotated_image?.url) {
    annotated_image = { url: v.annotated_image.url, s3_key: v.annotated_image.s3_key ?? null };
  } else if (v.annotated_url) {
    annotated_image = { url: v.annotated_url, s3_key: null };
  }

  let vehicle_image = null;
  if (v.assets?.vehicle_url) {
    vehicle_image = {
      url: v.assets.vehicle_url,
      s3_key: v.assets.vehicle_image_s3_key ?? v.assets.vehicle_s3_key ?? null,
    };
  } else if (v.vehicle_image?.url) {
    vehicle_image = { url: v.vehicle_image.url, s3_key: v.vehicle_image.s3_key ?? null };
  }

  let plate_image = null;
  if (v.assets?.plate_url) {
    plate_image = {
      url: v.assets.plate_url,
      s3_key: v.assets.plate_image_s3_key ?? v.assets.plate_s3_key ?? null,
    };
  } else if (v.plate_image?.url) {
    plate_image = { url: v.plate_image.url, s3_key: v.plate_image.s3_key ?? null };
  }

  const _debug_pad_scale = v._debug_pad_scale ?? null;

  return {
    ...v,
    type_conf,
    make_conf,
    model_conf,
    colors,
    parts, // ← exactly mirrors backend overlay when _debug_parts_sq exists
    annotated_image,
    vehicle_image,
    plate_image,
    _debug_pad_scale,
  };
}
