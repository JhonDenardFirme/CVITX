// app/api/reports/technical/route.js
//
// POST /api/reports/technical?workspace_id=...
// Body: {
//   workspace,
//   videos,           // { items, byId, coveredVideoIds }
//   detections,       // flat list
//   groupedByVideo,   // (optional, not required)
//   summary
// }
//
// Response: application/pdf (binary)

import { NextResponse } from "next/server";
import { openai } from "@/lib/server/openai";
import { buildTechnicalReportSystemPrompt } from "@/lib/server/cvitxReportPrompt";
import { buildReportPdfBuffer } from "@/lib/server/reportPdf";

export const runtime = "nodejs";

// --- Helper utilities ------------------------------------------------------

function safeNumber(value) {
  if (value == null) return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

function computeMode(values) {
  const counts = {};
  for (const v of values) {
    if (!v) continue;
    const key = String(v);
    counts[key] = (counts[key] || 0) + 1;
  }

  let best = null;
  let bestCount = 0;

  for (const key of Object.keys(counts)) {
    const count = counts[key];
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }

  return best;
}

function computeMedian(nums) {
  if (!Array.isArray(nums) || nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

// Detect something that *looks* like a React element object.
function isReactElementLike(value) {
  if (!value || typeof value !== "object") return false;
  return (
    Object.prototype.hasOwnProperty.call(value, "$$typeof") &&
    Object.prototype.hasOwnProperty.call(value, "type") &&
    Object.prototype.hasOwnProperty.call(value, "props")
  );
}

/**
 * Deep-sanitize a value so that it is safe to pass into PDF builder, and
 * collect any paths where React-like objects were encountered.
 *
 * - Keeps: strings, numbers, booleans, null, arrays, plain objects.
 * - If it finds a React-element-like object, it replaces it with null
 *   and records the path in `foundPaths`.
 */
function deepSanitizeForPdf(value, path = "root", foundPaths = []) {
  if (value == null) {
    return value;
  }

  const t = typeof value;

  if (t === "string" || t === "number" || t === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v, idx) =>
      deepSanitizeForPdf(v, `${path}[${idx}]`, foundPaths)
    );
  }

  if (isReactElementLike(value)) {
    foundPaths.push(path);
    return null;
  }

  if (t === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      const childPath = `${path}.${key}`;
      out[key] = deepSanitizeForPdf(value[key], childPath, foundPaths);
    }
    return out;
  }

  // Functions, symbols, etc. -> drop to null.
  foundPaths.push(path);
  return null;
}

// Build high-level stats that the report prompt can reference.
function buildDerivedStats(workspace, videos, detections, summary) {
  const types = [];
  const makes = [];
  const models = [];
  const colors = [];
  const plateTexts = [];
  const confs = [];

  let highConfCount = 0;
  let totalForHigh = 0;

  (detections || []).forEach((d) => {
    if (!d || typeof d !== "object") return;

    const t = d.type || d.typeLabel || null;
    const m = d.make || d.makeLabel || null;
    const mo = d.model || d.modelLabel || null;

    if (t) types.push(t);
    if (m) makes.push(m);
    if (mo) models.push(mo);

    let col = null;
    if (d.primary_color) {
      col = d.primary_color;
    } else if (Array.isArray(d.colors) && d.colors[0] && d.colors[0].base) {
      col = d.colors[0].base;
    }
    if (col) colors.push(col);

    const plate =
      typeof d.plate_text === "string" && d.plate_text.trim().length
        ? d.plate_text.trim()
        : null;
    if (plate) plateTexts.push(plate);

    const tc = safeNumber(d.type_conf);
    const mc = safeNumber(d.make_conf);
    const moc = safeNumber(d.model_conf);

    const localConfs = [];
    if (tc != null) localConfs.push(tc);
    if (mc != null) localConfs.push(mc);
    if (moc != null) localConfs.push(moc);

    if (localConfs.length) {
      const avg =
        localConfs.reduce((acc, v) => acc + v, 0) / localConfs.length;
      confs.push(avg);
      totalForHigh += 1;
      if (avg >= 0.8) highConfCount += 1;
    }
  });

  const dominant_type = computeMode(types);
  const dominant_make = computeMode(makes);
  const dominant_model = computeMode(models);
  const dominant_color = computeMode(colors);
  const most_common_plate_text = computeMode(plateTexts);

  const avg_conf =
    confs.length > 0
      ? confs.reduce((acc, v) => acc + v, 0) / confs.length
      : null;
  const median_conf = computeMedian(confs);

  const percent_high_conf_detections =
    totalForHigh > 0 ? (highConfCount / totalForHigh) * 100 : 0;

  const plate_read_success_count = plateTexts.length;

  const sorted = [...(detections || [])].sort((a, b) => {
    const at = Date.parse(a.detected_at || "");
    const bt = Date.parse(b.detected_at || "");
    const av = Number.isNaN(at) ? Infinity : at;
    const bv = Number.isNaN(bt) ? Infinity : bt;
    return av - bv;
  });

  const first_detection = sorted[0] || null;
  const last_detection = sorted[sorted.length - 1] || null;

  const byId = (videos && videos.byId) || {};

  const first_video =
    first_detection && first_detection.videoId
      ? byId[first_detection.videoId] || null
      : null;

  const last_video =
    last_detection && last_detection.videoId
      ? byId[last_detection.videoId] || null
      : null;

  const origin_area_label =
    (first_video && first_video.camera_label) ||
    (first_detection && first_detection.camera_label) ||
    (workspace && workspace.title) ||
    "the area covered by the earliest camera";

  const destination_area_label =
    (last_video && last_video.camera_label) ||
    (last_detection && last_detection.camera_label) ||
    (workspace && workspace.title) ||
    "the area covered by the latest camera";

  const vehicle_profile_label = (() => {
    const colorPart = dominant_color ? `${dominant_color} ` : "";
    if (dominant_make && dominant_model) {
      return `Subject Vehicle – ${colorPart}${dominant_make} ${dominant_model}`;
    }
    if (dominant_type) {
      return `Subject Vehicle – ${colorPart}${dominant_type}`;
    }
    return "Subject Vehicle – CVITX Inferred Profile";
  })();

  const vehicle_profile_plate = most_common_plate_text || "Unknown";

  const report_generated_at = new Date().toISOString();
  const safeCode = (workspace && workspace.code ? workspace.code : "REPORT")
    .toString()
    .replace(/[^A-Za-z0-9_-]/g, "");
  const cleanedTs = report_generated_at.replace(/[^0-9]/g, "");
  const report_id = `CVITX_${safeCode}_${cleanedTs}`;

  return {
    dominant_type,
    dominant_make,
    dominant_model,
    dominant_color,
    most_common_plate_text,
    vehicle_profile_label,
    vehicle_profile_plate,
    avg_type_make_model_conf: avg_conf,
    median_type_make_model_conf: median_conf,
    percent_high_conf_detections,
    plate_read_success_count,
    first_detection,
    last_detection,
    first_video,
    last_video,
    origin_area_label,
    destination_area_label,
    report_generated_at,
    report_id,
  };
}

// --- Route handler ---------------------------------------------------------

export async function POST(req) {
  try {
    const body = await req.json();

    // Basic inbound log (compact)
    // eslint-disable-next-line no-console
    console.log("[/api/reports/technical] Incoming body summary:", {
      hasWorkspace: !!body.workspace,
      hasVideos: !!body.videos,
      detectionsCount: Array.isArray(body.detections)
        ? body.detections.length
        : null,
      hasSummary: !!body.summary,
    });

    let workspace = body.workspace;
    let videos = body.videos;
    let detections = Array.isArray(body.detections) ? body.detections : [];
    let summary = body.summary || {};

    if (!workspace || !Array.isArray(detections) || detections.length === 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "[/api/reports/technical] Invalid payload: workspace or detections missing/empty."
      );
      return NextResponse.json(
        {
          error:
            "Invalid payload: workspace and non-empty detections array are required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // 1) Deep-sanitize inbound data to ensure it's PDF-safe (no React elements)
    // -----------------------------------------------------------------------
    const inboundFoundPaths = [];

    workspace = deepSanitizeForPdf(workspace, "workspace", inboundFoundPaths);
    videos = deepSanitizeForPdf(videos, "videos", inboundFoundPaths);
    detections = deepSanitizeForPdf(
      detections,
      "detections",
      inboundFoundPaths
    );
    summary = deepSanitizeForPdf(summary, "summary", inboundFoundPaths);

    if (inboundFoundPaths.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "[/api/reports/technical] Sanitized React-like payload values at paths:",
        inboundFoundPaths
      );
    }

    // -----------------------------------------------------------------------
    // 2) Build derived stats (using sanitized data)
    // -----------------------------------------------------------------------
    const derived = buildDerivedStats(workspace, videos, detections, summary);

    const systemPrompt = buildTechnicalReportSystemPrompt();

    const userInput = {
      workspace,
      videos,
      detections,
      summary,
      derived,
    };

    // eslint-disable-next-line no-console
    console.log("[/api/reports/technical] OpenAI userInput summary:", {
      workspaceId: workspace?.id || null,
      workspaceCode: workspace?.code || null,
      detectionsCount: detections.length,
      distinctVideoCount: summary?.distinctVideoCount ?? null,
      distinctCameraCount: summary?.distinctCameraCount ?? null,
      derivedReportId: derived.report_id,
    });

    const inputMessages = [
      {
        role: "user",
        content:
          "You are given CVITX analysis data below in JSON format. " +
          "Using the instructions, generate a single JSON object that follows the required schema for the technical report sections. " +
          "Respond ONLY with valid JSON (a single JSON object, no extra text).\n\n" +
          "Input JSON data:\n" +
          JSON.stringify(userInput),
      },
    ];

    // -----------------------------------------------------------------------
    // 3) Call OpenAI Responses API with JSON output
    // -----------------------------------------------------------------------

    // eslint-disable-next-line no-console
    console.log("[/api/reports/technical] Calling OpenAI.responses.create", {
      model: "gpt-5.1",
      max_output_tokens: 4096,
      temperature: 0.3,
    });

    const response = await openai.responses.create({
      model: "gpt-5.1",
      instructions: systemPrompt,
      input: inputMessages,
      max_output_tokens: 4096,
      temperature: 0.3,
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    // eslint-disable-next-line no-console
    console.log("[/api/reports/technical] OpenAI raw response summary:", {
      id: response.id,
      status: response.status,
      output_type: response.output[0]?.type || null,
      output_index_count: response.output.length,
    });

    const text = response.output_text;

    // eslint-disable-next-line no-console
    console.log(
      "[/api/reports/technical] OpenAI output_text (first 300 chars):",
      typeof text === "string" ? text.slice(0, 300) : "(not a string)"
    );

    let sections;
    try {
      sections = JSON.parse(text);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        "[/api/reports/technical] Failed to parse JSON from model",
        err
      );
      // eslint-disable-next-line no-console
      console.error(
        "[/api/reports/technical] Full text from model:",
        text
      );
      return NextResponse.json(
        {
          error: "Model did not return valid JSON.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------------------
    // 4) Sanitize sections as well (defensive, even though they are JSON)
    // -----------------------------------------------------------------------
    const sectionFoundPaths = [];
    sections = deepSanitizeForPdf(sections, "sections", sectionFoundPaths);

    if (sectionFoundPaths.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "[/api/reports/technical] Sanitized React-like values in sections at paths:",
        sectionFoundPaths
      );
    }

    const reportMeta = {
      id: derived.report_id,
      generatedAt: derived.report_generated_at,
    };

    // eslint-disable-next-line no-console
    console.log("[/api/reports/technical] Building PDF with reportMeta:", {
      reportId: reportMeta.id,
      generatedAt: reportMeta.generatedAt,
    });

    // -----------------------------------------------------------------------
    // 5) Build PDF buffer (using pdfkit builder)
    // -----------------------------------------------------------------------
    const pdfBuffer = await buildReportPdfBuffer({
      workspace,
      videos,
      detections,
      summary,
      derived,
      sections,
      reportMeta,
    });

    // eslint-disable-next-line no-console
    console.log(
      "[/api/reports/technical] PDF buffer generated. Byte length:",
      pdfBuffer && typeof pdfBuffer.length === "number"
        ? pdfBuffer.length
        : "(unknown)"
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportMeta.id}.pdf"`,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[/api/reports/technical] error", err);
    return NextResponse.json(
      {
        error: "Failed to generate technical report PDF.",
        detail: String(err && err.message ? err.message : err),
      },
      { status: 500 }
    );
  }
}
