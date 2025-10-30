// lib/imageAnalysis.normalize.js

function to01(x) {
  if (x == null || Number.isNaN(+x)) return null;
  const n = +x;
  if (n <= 1) return Math.max(0, Math.min(1, n));
  if (n <= 100) return Math.max(0, Math.min(100, n)) / 100;
  return 1; // clamp if someone sent >100 by mistake
}

/* ────────────────────────────────────────────────────────────────────────────
   Colors: accept only simple shape or primitive
   Expected: { finish: "Glossy", base: "RED", lightness: "DARK", conf: 0.93 }
   Also tolerate primitives ("RED") or array/object-map containers.
   ──────────────────────────────────────────────────────────────────────────── */
function normColor(c) {
  if (c == null) return null;

  // Primitive like "RED" → treat as base label
  if (typeof c === "string" || typeof c === "number") {
    return { finish: null, base: String(c), lightness: null, conf: null };
  }

  if (typeof c !== "object") return null;

  const finish = c.finish != null ? String(c.finish) : null;
  const base = c.base != null ? String(c.base) : null;
  const lightness = c.lightness != null ? String(c.lightness) : null;
  const conf = to01(c.conf ?? c.p ?? c.confidence ?? null);

  // If nothing meaningful is present, drop it
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
   Parts & main normalization
   ──────────────────────────────────────────────────────────────────────────── */
function normPart(p) {
  if (!p || typeof p !== "object") return null;
  const name = p.name ?? p.label ?? p.part ?? null;
  const conf = to01(p.conf ?? p.confidence ?? p.score ?? null);
  if (!name) return null;
  return { name: String(name), conf };
}

export function normalizeVariant(v) {
  if (!v) return null;

  const type_conf  = to01(v.type_conf  ?? v.typeConfidence  ?? null);
  const make_conf  = to01(v.make_conf  ?? v.makeConfidence  ?? null);
  const model_conf = to01(v.model_conf ?? v.modelConfidence ?? null);

  const colors = normColors(v);

  const partsRaw = Array.isArray(v.parts) ? v.parts : [];
  const parts = partsRaw.map(normPart).filter(Boolean);

  const annotated_image = v.annotated_image?.url
    ? { url: v.annotated_image.url, s3_key: v.annotated_image.s3_key ?? null }
    : v.annotated_url
    ? { url: v.annotated_url, s3_key: null }
    : null;

  return {
    ...v,
    type_conf,
    make_conf,
    model_conf,
    colors,
    parts,
    annotated_image,
  };
}
