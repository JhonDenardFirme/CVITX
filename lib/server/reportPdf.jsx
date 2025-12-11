"use server";

// lib/server/reportPdf.jsx
//
// CVITX · Technical Report PDF builder (pdfkit standalone + Jost + Logo)
//
// Public contract:
//
//   export async function buildReportPdfBuffer({
//     workspace,
//     videos,
//     detections,
//     summary,
//     derived,
//     sections,
//     reportMeta,
//   }): Promise<Buffer>

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

// -----------------------------------------------------------------------------
// Assets – Jost font and CVITX logo
// -----------------------------------------------------------------------------

const JOST_FONT_PATH = path.join(
  process.cwd(),
  "public",
  "fonts",
  "Jost-Variable.ttf"
);

const LOGO_PATH = path.join(process.cwd(), "public", "Logo.png");

function tryRegisterJostFont(doc) {
  try {
    if (fs.existsSync(JOST_FONT_PATH)) {
      doc.registerFont("Body", JOST_FONT_PATH);
      doc.font("Body");
      // eslint-disable-next-line no-console
      console.log("[reportPdf] Using Jost font from:", JOST_FONT_PATH);
      return true;
    }

    // eslint-disable-next-line no-console
    console.warn(
      "[reportPdf] Jost font not found at",
      JOST_FONT_PATH,
      "– falling back to built-in pdfkit font."
    );
    return false;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "[reportPdf] Failed to register Jost font, falling back to built-in font.",
      err
    );
    return false;
  }
}

// Centered logo at the top of the page, similar to the sample layout.
function drawLogoCentered(doc) {
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const imgSize = 72; // around 60–80 px visual size
      const pageWidth = doc.page.width;
      const x = (pageWidth - imgSize) / 2;
      const y = doc.y;

      doc.image(LOGO_PATH, x, y, { width: imgSize });
      // Move the cursor down below the logo block
      doc.y = y + imgSize + 16;
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        "[reportPdf] Logo not found at",
        LOGO_PATH,
        "– continuing without logo."
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[reportPdf] Failed to draw logo:", err);
  }
}

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

function safeNumber(value) {
  if (value == null) return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

function toSafeString(value, fallback = "") {
  if (value == null) return fallback;

  const t = typeof value;

  if (t === "string") return value;
  if (t === "number" || t === "boolean") return String(value);

  if (Array.isArray(value)) {
    const parts = value
      .map((v) => toSafeString(v, ""))
      .filter((v) => v && v.length > 0);
    return parts.length ? parts.join(" ") : fallback;
  }

  if (t === "object") {
    if (typeof value.text === "string") {
      return value.text;
    }
    try {
      const json = JSON.stringify(value);
      return json || fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function getSectionText(sections, pathKeys, fallback) {
  if (!sections || typeof sections !== "object") {
    return fallback;
  }

  let cur = sections;
  for (const key of pathKeys) {
    if (!cur || typeof cur !== "object") {
      return fallback;
    }
    cur = cur[key];
  }

  return toSafeString(cur, fallback);
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
  if (!nums || !nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

// Metadata table dates (long form)
function formatDateTimeHuman(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return toSafeString(value, "—");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const year = d.getUTCFullYear();
  const monthName = months[d.getUTCMonth()];
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");

  return `${monthName} ${day}, ${year} ${hh}:${mm}:${ss} UTC`;
}

// Detection timeline (short form)
function formatDateTimeShort(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return toSafeString(value, "—");

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hh}:${mm}:${ss} UTC`;
}

function buildDerivedStats(workspace, videos, detections) {
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
      const avg = localConfs.reduce((acc, v) => acc + v, 0) / localConfs.length;
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
    confs.length > 0 ? confs.reduce((acc, v) => acc + v, 0) / confs.length : null;
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
  };
}

function summarizePdfPayloadForLog({
  workspace,
  videos,
  detections,
  summary,
  reportMeta,
}) {
  return {
    workspaceId: workspace && workspace.id ? workspace.id : null,
    workspaceCode: workspace && workspace.code ? workspace.code : null,
    workspaceTitle: workspace && workspace.title ? workspace.title : null,
    videoItems:
      videos && Array.isArray(videos.items) ? videos.items.length : null,
    detectionCount: Array.isArray(detections) ? detections.length : null,
    distinctVideoCount:
      typeof summary?.distinctVideoCount === "number"
        ? summary.distinctVideoCount
        : null,
    distinctCameraCount:
      typeof summary?.distinctCameraCount === "number"
        ? summary.distinctCameraCount
        : null,
    reportId: reportMeta && reportMeta.id ? reportMeta.id : null,
    generatedAt:
      reportMeta && reportMeta.generatedAt ? reportMeta.generatedAt : null,
  };
}

// -----------------------------------------------------------------------------
// Helpers for layout (headings, body text, title block, tables)
// -----------------------------------------------------------------------------

function setHeading(doc, size) {
  try {
    doc.font("Helvetica-Bold");
  } catch {
    try {
      doc.font("Body");
    } catch {
      // keep whatever font is active
    }
  }
  doc.fontSize(size);
}

function setBody(doc, size) {
  try {
    doc.font("Body");
  } catch {
    try {
      doc.font("Helvetica");
    } catch {
      // keep whatever font is active
    }
  }
  doc.fontSize(size);
}

// Logo + title + subtitle + divider, matching the observed layout.
function drawTitleBlock(doc) {
  drawLogoCentered(doc);

  setHeading(doc, 20);
  doc.text("CVITX", { align: "center" });
  doc.moveDown(0.3);

  setHeading(doc, 14);
  doc.text("Automated Vehicle Detection", { align: "center" });
  doc.text("Timeline Report", { align: "center" });
  doc.moveDown(0.6);

  setBody(doc, 10);
  doc.text("Technical Investigator Summary", { align: "center" });

  // Horizontal divider under subtitle
  const lineY = doc.y + 8;
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const pageWidth = doc.page.width;

  doc
    .moveTo(marginLeft, lineY)
    .lineTo(pageWidth - marginRight, lineY)
    .stroke();

  // Move cursor below the divider
  doc.y = lineY + 14;
}

// Table-like layout for Case Metadata: header row "Field | Value" + rows.
function drawCaseMetadataTable(doc, rows) {
  if (!rows || !rows.length) return;

  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const pageWidth = doc.page.width;

  const tableWidth = pageWidth - marginLeft - marginRight;
  const col1Width = 140; // Field column
  const col2Width = tableWidth - col1Width;

  let y = doc.y;

  setHeading(doc, 10);

  const headerHeight = 20;

  doc.rect(marginLeft, y, tableWidth, headerHeight).stroke();
  doc.text("Field", marginLeft + 6, y + 5, {
    width: col1Width - 12,
  });
  doc.text("Value", marginLeft + col1Width + 6, y + 5, {
    width: col2Width - 12,
  });

  y += headerHeight;

  setBody(doc, 9);
  const rowHeight = 18;

  rows.forEach((row) => {
    const label = toSafeString(row.label, "");
    const value = toSafeString(row.value, "");

    doc.rect(marginLeft, y, tableWidth, rowHeight).stroke();

    doc.text(label, marginLeft + 6, y + 4, {
      width: col1Width - 12,
    });

    doc.text(value, marginLeft + col1Width + 6, y + 4, {
      width: col2Width - 12,
    });

    y += rowHeight;
  });

  doc.y = y + 12; // leave some space after the table
}

// Two-column detection layout: left = details, right = snapshot status/text.
function drawDetectionTwoColumnTable(doc, rows, videoById) {
  if (!rows || !rows.length) return;

  const maxRows = Math.min(rows.length, 10);
  const usableRows = rows.slice(0, maxRows);

  const pageWidth = doc.page.width;
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;

  const fullWidth = pageWidth - marginLeft - marginRight;
  const columnGap = 16;
  const colWidth = (fullWidth - columnGap) / 2;

  const leftX = marginLeft;
  const rightX = marginLeft + colWidth + columnGap;

  const headerY = doc.y;

  setHeading(doc, 11);
  doc.text("Detection Details", leftX, headerY, { width: colWidth });
  doc.text("Snapshots / Images", rightX, headerY, { width: colWidth });
  doc.y = headerY + 20;

  setBody(doc, 9);

  usableRows.forEach((d, idx) => {
    const v = d.videoId ? videoById[d.videoId] || null : null;

    const seq = typeof d.idx === "number" && d.idx >= 1 ? d.idx : idx + 1;

    const time = formatDateTimeShort(d.detected_at);
    const fileName = toSafeString(
      v && (v.file_name || v.fileName),
      "Unknown video"
    );
    const videoId = v && v.id ? String(v.id) : "";
    const camCode = toSafeString(d.camera_code || (v && v.camera_code), "");
    const camLabel = toSafeString(
      d.camera_label || (v && v.camera_label),
      ""
    );
    const plate = toSafeString(
      d.plate_text,
      "Not detected / unreadable"
    );
    const t = toSafeString(d.type, "");
    const m = toSafeString(d.make, "");
    const mo = toSafeString(d.model, "");
    const color =
      toSafeString(
        d.primary_color ||
          (Array.isArray(d.colors) &&
            d.colors[0] &&
            d.colors[0].base),
        ""
      ) || "";

    const classLine = `${t || "?"} ${m || ""} ${mo || ""}${
      color ? ` (${color})` : ""
    }`.trim();

    const infoLines = [
      `Detection #${seq}`,
      `Time: ${time}`,
      `Camera: ${camCode}${camLabel ? ` – ${camLabel}` : ""}`,
      `Video: ${fileName}${videoId ? ` (ID: ${videoId})` : ""}`,
      `Class: ${classLine || "N/A"}`,
      `Plate: ${plate}`,
    ];

    // Starting Y for this row
    const startY = doc.y;

    infoLines.forEach((line, lineIdx) => {
      const yPos = lineIdx === 0 ? startY : undefined;
      doc.text(line, leftX, yPos, { width: colWidth });
    });

    const snapshotText = d.snapshot_url
      ? "Snapshot available for this detection in the CVITX system."
      : "No stored snapshot for this detection.";

    doc.text(snapshotText, rightX, startY, { width: colWidth });

    doc.moveDown(0.8);
  });

  if (rows.length > maxRows) {
    doc.moveDown(0.3);
    setBody(doc, 9);
    doc.text(
      `Note: ${
        rows.length - maxRows
      } additional detections are available in the CSV export and within the main CVITX interface.`,
      { align: "justify" }
    );
  }
}

// Bulleted detection narratives, one bullet per detection.
function drawDetectionNarratives(doc, sections) {
  const narratives = Array.isArray(sections?.detection_narratives)
    ? sections.detection_narratives
    : [];

  if (!narratives.length) return;

  doc.addPage();

  setHeading(doc, 12);
  doc.text("VIII. Detection Narratives (Per Detection)", {
    underline: true,
  });
  doc.moveDown(0.7);

  setBody(doc, 10);

  narratives.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const idxValue =
      typeof entry.idx === "number" ? entry.idx : toSafeString(entry.idx, "");
    const paragraph = toSafeString(entry.paragraph, "");

    if (!paragraph) return;

    doc.text(`• Detection #${idxValue}:`, {
      continued: false,
    });
    doc.moveDown(0.1);
    doc.text(paragraph, {
      align: "justify",
      indent: 14,
    });
    doc.moveDown(0.6);
  });
}

// -----------------------------------------------------------------------------
// Public builder – pdfkit standalone + Jost + logo + structured layout
// -----------------------------------------------------------------------------

export async function buildReportPdfBuffer(args) {
  const {
    workspace = {},
    videos = {},
    detections = [],
    summary = {},
    derived: derivedFromRoute = null,
    sections = {},
    reportMeta = {},
  } = args || {};

  try {
    const derived =
      derivedFromRoute || buildDerivedStats(workspace, videos, detections);
    const snapshot = summarizePdfPayloadForLog({
      workspace,
      videos,
      detections,
      summary,
      reportMeta,
    });

    // eslint-disable-next-line no-console
    console.log("[reportPdf] PDFKIT snapshot:", snapshot);

    const videoById = (videos && videos.byId) || {};
    const sortedDetections = Array.isArray(detections)
      ? [...detections].sort((a, b) => {
          const at = Date.parse(a.detected_at || "");
          const bt = Date.parse(b.detected_at || "");
          const av = Number.isNaN(at) ? Infinity : at;
          const bv = Number.isNaN(bt) ? Infinity : bt;
          return av - bv;
        })
      : [];

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    // Use Jost if available, otherwise built-in fonts
    tryRegisterJostFont(doc);

    // Optional metadata
    try {
      doc.info.Title = "CVITX – Automated Vehicle Detection Timeline Report";
      doc.info.Subject = "CVITX Vehicle Detection Timeline";
      doc.info.Author = "CVITX System";
      if (reportMeta.generatedAt) {
        doc.info.CreationDate = new Date(reportMeta.generatedAt);
      }
    } catch {
      // ignore
    }

    doc.on("data", (chunk) => chunks.push(chunk));

    const endPromise = new Promise((resolve, reject) => {
      doc.on("end", () => {
        try {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      });
      doc.on("error", (err) => reject(err));
    });

    // -------------------------------------------------------------------------
    // Page 1 – Logo, title, metadata table, detection summary, subject vehicle
    // -------------------------------------------------------------------------

    drawTitleBlock(doc);

    const caseTitle = toSafeString(workspace.title, "—");
    const workspaceCode = toSafeString(workspace.code, "—");
    const workspaceId = toSafeString(workspace.id, "—");
    const workspaceCreatedAt = workspace.created_at
      ? formatDateTimeHuman(workspace.created_at)
      : "—";
    const reportId = toSafeString(reportMeta.id, "—");
    const reportGeneratedAt = reportMeta.generatedAt
      ? formatDateTimeHuman(reportMeta.generatedAt)
      : "—";

    const totalDetections =
      typeof summary?.totalDetections === "number"
        ? summary.totalDetections
        : sortedDetections.length;

    const distinctCameraCount =
      typeof summary?.distinctCameraCount === "number"
        ? summary.distinctCameraCount
        : "";

    const distinctVideoCount =
      typeof summary?.distinctVideoCount === "number"
        ? summary.distinctVideoCount
        : "";

    setHeading(doc, 11);
    doc.text("Case Metadata", { underline: true });
    doc.moveDown(0.5);

    const metadataRows = [
      { label: "Case Title", value: caseTitle },
      { label: "Workspace Code", value: workspaceCode },
      { label: "Workspace ID", value: workspaceId },
      { label: "Workspace Created At", value: workspaceCreatedAt },
      { label: "Report ID", value: reportId },
      { label: "Report Generated On", value: reportGeneratedAt },
    ];

    drawCaseMetadataTable(doc, metadataRows);

    setHeading(doc, 11);
    doc.text("Detection Summary", { underline: true });
    doc.moveDown(0.5);

    setBody(doc, 10);
    doc.text(`Total detections: ${totalDetections || "N/A"}`);
    doc.text(
      `Distinct camera codes: ${
        distinctCameraCount !== "" ? distinctCameraCount : "N/A"
      }`
    );
    doc.text(
      `Distinct videos with detections: ${
        distinctVideoCount !== "" ? distinctVideoCount : "N/A"
      }`
    );
    doc.moveDown(1);

    setHeading(doc, 11);
    doc.text("Subject Vehicle Profile (CVITX-derived)", { underline: true });
    doc.moveDown(0.5);

    const vehicleProfileLabel =
      derived?.vehicle_profile_label ||
      "Subject Vehicle – CVITX Inferred Profile";

    const vehicleProfilePlate = derived?.vehicle_profile_plate || "Unknown";

    const avgConf =
      derived?.avg_type_make_model_conf != null
        ? `${(derived.avg_type_make_model_conf * 100).toFixed(1)}%`
        : "N/A";

    const highConfPct =
      derived?.percent_high_conf_detections != null
        ? `${derived.percent_high_conf_detections.toFixed(1)}%`
        : "0.0%";

    setBody(doc, 10);
    doc.text(vehicleProfileLabel);
    doc.text(`Dominant type: ${toSafeString(derived?.dominant_type, "N/A")}`);
    doc.text(`Dominant make: ${toSafeString(derived?.dominant_make, "N/A")}`);
    doc.text(`Dominant model: ${toSafeString(derived?.dominant_model, "N/A")}`);
    doc.text(`Dominant color: ${toSafeString(derived?.dominant_color, "N/A")}`);
    doc.text(`Most common plate text: ${vehicleProfilePlate}`);
    doc.text(
      `Average Type–Make–Model confidence: ${avgConf} (High-confidence detections: ${highConfPct})`
    );
    doc.moveDown(1);

    setHeading(doc, 11);
    doc.text("System & Evidence Disclaimer", { underline: true });
    doc.moveDown(0.5);

    setBody(doc, 9);
    doc.text(
      "This document contains outputs generated by an automated image analysis system based on visual data (CCTV snapshots). While CVITX applies advanced methods for vehicle recognition and plate reading, it is subject to possible false positives and false negatives, uncertain plate readings, and other context limitations.",
      { align: "justify" }
    );
    doc.moveDown(0.4);
    doc.text(
      "Investigators and authorized officers must always review the original CCTV footage, cross-check these outputs with other forms of evidence, and treat this report as an analytical aid rather than sole proof.",
      { align: "justify" }
    );

    // -------------------------------------------------------------------------
    // Page 2 – Narrative sections I, II, III
    // -------------------------------------------------------------------------

    doc.addPage();

    const timelineTotal = totalDetections || "N/A";

    const caseSummaryParagraph = getSectionText(
      sections,
      ["section_i", "case_summary_paragraph"],
      `This Vehicle Detection Timeline Report pertains to workspace ${workspaceCode}, titled ${caseTitle}. Under this workspace, the CVITX system analyzed selected CCTV footage to help reconstruct the movements and appearances of a vehicle of interest.`
    );

    const vehicleProfileParagraph = getSectionText(
      sections,
      ["section_ii", "vehicle_profile_paragraph"],
      "The subject vehicle is defined using the dominant type, make, model, color, and plate text inferred from repeated detections by the CVITX system. This profile is treated as the primary vehicle of interest throughout this report."
    );

    const derivedSummaryParagraph = getSectionText(
      sections,
      ["section_ii", "derived_summary_paragraph"],
      `Across all detections included in this timeline, CVITX recorded a total of ${timelineTotal} entries. These detections provide the basis for the consolidated subject vehicle profile and the subsequent movement analysis.`
    );

    const videoInventoryIntro = getSectionText(
      sections,
      ["section_iii", "video_inventory_intro"],
      "CVITX ingested multiple CCTV recordings under this workspace. Each recording is associated with a camera identifier, a location label, and a recording period, and it serves as the source for the vehicle detections included in this report."
    );

    setHeading(doc, 12);
    doc.text("I. Case Overview", { underline: true });
    doc.moveDown(0.5);
    setBody(doc, 10);
    doc.text(caseSummaryParagraph, { align: "justify" });
    doc.moveDown(1);

    setHeading(doc, 12);
    doc.text("II. Vehicle of Interest", { underline: true });
    doc.moveDown(0.5);
    setBody(doc, 10);
    doc.text(vehicleProfileParagraph, { align: "justify" });
    doc.moveDown(0.4);
    doc.text(derivedSummaryParagraph, { align: "justify" });
    doc.moveDown(1);

    setHeading(doc, 12);
    doc.text("III. Source Videos and Recordings", { underline: true });
    doc.moveDown(0.5);
    setBody(doc, 10);
    doc.text(videoInventoryIntro, { align: "justify" });

    // -------------------------------------------------------------------------
    // Page 3 – Overview, analytical summary, limitations
    // -------------------------------------------------------------------------

    doc.addPage();

    const timelineOverviewParagraph = getSectionText(
      sections,
      ["section_iv", "timeline_overview_paragraph"],
      `CVITX identified ${timelineTotal} detections across ${
        distinctCameraCount || "N/A"
      } camera codes and ${distinctVideoCount || "N/A"} video recordings within this workspace.`
    );

    const movementPatternSummary = getSectionText(
      sections,
      ["section_v", "movement_pattern_summary"],
      "Taken together, the detections form a suggested pattern of movement that investigators can compare against maps, known routes, and other case information."
    );

    const confidenceReliabilityParagraph = getSectionText(
      sections,
      ["section_v", "confidence_reliability_paragraph"],
      "Across all detections, the model confidences and plate reads provide a guide for prioritizing which snapshots may be more reliable, particularly when cross-checked with the original CCTV footage."
    );

    const limitationsBridgeParagraph = getSectionText(
      sections,
      ["section_vi", "limitations_bridge_paragraph"],
      "These outputs come from an automated image analysis system and reflect the quality and conditions of the underlying CCTV footage. Investigators must confirm key observations by reviewing the original recordings and considering additional evidence."
    );

    setHeading(doc, 12);
    doc.text("IV. Detection Timeline – Overview", {
      underline: true,
    });
    doc.moveDown(0.5);
    setBody(doc, 10);
    doc.text(timelineOverviewParagraph, { align: "justify" });
    doc.moveDown(1);

    setHeading(doc, 12);
    doc.text("V. Analytical Summary", {
      underline: true,
    });
    doc.moveDown(0.5);
    setBody(doc, 10);
    doc.text(movementPatternSummary, { align: "justify" });
    doc.moveDown(0.4);
    doc.text(confidenceReliabilityParagraph, { align: "justify" });
    doc.moveDown(1);

    setHeading(doc, 12);
    doc.text("VI. Limitations and Disclaimers", {
      underline: true,
    });
    doc.moveDown(0.5);
    setBody(doc, 10);
    doc.text(limitationsBridgeParagraph, {
      align: "justify",
    });

    // -------------------------------------------------------------------------
    // Page 4 – Detection timeline (two-column layout) + CSV Annex
    // -------------------------------------------------------------------------

    if (sortedDetections.length > 0) {
      doc.addPage();

      const maxRows = 50;
      const rows = sortedDetections.slice(0, maxRows);

      setHeading(doc, 12);
      doc.text("VII. Detection Timeline (First Detections)", {
        underline: true,
      });
      doc.moveDown(0.5);

      setBody(doc, 10);
      doc.text(
        "This section provides a structured overview of the earliest detections in the timeline. The left column lists key information for each detection, while the right column indicates whether a corresponding snapshot image is available within the CVITX system.",
        { align: "justify" }
      );
      doc.moveDown(0.7);

      drawDetectionTwoColumnTable(doc, rows, videoById);

      const csvSummaryParagraph = getSectionText(
        sections,
        ["annex", "csv_summary_paragraph"],
        "A CSV export, containing one row per detection with timestamps, camera identifiers, classifications, and plate text, is available to support further technical review and data analysis."
      );

      doc.moveDown(1);
      setHeading(doc, 11);
      doc.text("Annex – CSV Summary", { underline: true });
      doc.moveDown(0.5);
      setBody(doc, 10);
      doc.text(csvSummaryParagraph, { align: "justify" });
    }

    // -------------------------------------------------------------------------
    // Page 5 – Bulleted detection narratives (per detection)
// -------------------------------------------------------------------------

    drawDetectionNarratives(doc, sections);

    // Finalize PDF
    doc.end();
    const buffer = await endPromise;

    // eslint-disable-next-line no-console
    console.log(
      "[reportPdf] PDFKIT render succeeded. Bytes:",
      buffer && typeof buffer.length === "number" ? buffer.length : "(unknown)"
    );

    return buffer;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[reportPdf] PDFKIT render FAILED:", err);
    throw err;
  }
}
