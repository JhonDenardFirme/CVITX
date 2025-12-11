"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2, Download, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

/* -------------------------------- helpers -------------------------------- */

function toCamDisplayId(value) {
  const s = String(value ?? "");
  const m = s.match(/(CAM[A-Za-z0-9-]+)/);
  return m ? m[1] : s;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeNumber(value) {
  if (value == null) return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

function asPathFromUrlOrKey(value) {
  if (!value || typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return value.replace(/^\/+/, "");
  }
}

// Option A: derive videoId from the snapshot S3 key / URL path.
// Expects layouts like:
//   demo_user/<workspace_id>/<video_id>/snapshots/...
//   <workspace_id>/<video_id>/snapshots/...
function deriveVideoIdFromItem(item) {
  if (!item || typeof item !== "object") return null;

  // Prefer explicit fields if present
  if (item.videoId && typeof item.videoId === "string" && UUID_RE.test(item.videoId)) {
    return item.videoId;
  }
  if (item.video_id && typeof item.video_id === "string" && UUID_RE.test(item.video_id)) {
    return item.video_id;
  }

  const keyish =
    item.snapshot_s3_key ||
    item.snapshotS3Key ||
    item.snapshot_s3_uri ||
    item.snapshot_url ||
    item.snapshotUrl ||
    null;

  const path = asPathFromUrlOrKey(keyish);
  if (!path) return null;

  const parts = path.split("/").filter(Boolean);
  const idx = parts.indexOf("snapshots");
  if (idx <= 0) return null;

  const candidate = parts[idx - 1];
  if (!candidate || !UUID_RE.test(candidate)) return null;

  return candidate;
}

// Normalize a single detection item into the report/staging shape,
// joining with video metadata if available.
function normalizeDetectionForStaging(item, idx, videosById) {
  const videoId = deriveVideoIdFromItem(item);
  const video = videoId ? videosById[videoId] || null : null;

  const recorded_at =
    item.recorded_at ||
    item.recordedAt ||
    video?.recorded_at ||
    video?.recordedAt ||
    null;

  const detected_at = item.detected_at || item.detectedAt || null;

  const camera_code =
    item.camera_code ||
    item.cameraCode ||
    video?.camera_code ||
    video?.cameraCode ||
    null;

  const camera_label =
    item.camera_label ||
    item.cameraLabel ||
    video?.camera_label ||
    video?.cameraLabel ||
    null;

  const colors = Array.isArray(item.colors) ? item.colors : [];
  const primary = colors.length > 0 ? colors[0] : null;
  const primary_color =
    typeof primary === "string"
      ? primary
      : typeof primary?.base === "string"
      ? primary.base
      : null;

  const typeText = item.type || item.typeLabel || item.yoloType || "";
  const makeText = item.make || item.makeLabel || "";
  const modelText = item.model || item.modelLabel || "";

  return {
    idx: idx + 1,
    id: item.id,
    detectionId: item.detectionId || item.detection_id || item.id,
    trackId: item.trackId || item.track_id || null,
    videoId,
    video,
    display_id: toCamDisplayId(item.display_id || item.displayId || item.id),
    snapshot_url: item.snapshot_url || item.snapshotUrl || null,
    plate_url: item.plate_url || item.plateUrl || null,
    plate_text: item.plate_text || item.plateText || "",
    colors,
    primary_color,
    type: typeText,
    type_conf: safeNumber(item.type_conf ?? item.typeConf),
    make: makeText,
    make_conf: safeNumber(item.make_conf ?? item.makeConf),
    model: modelText,
    model_conf: safeNumber(item.model_conf ?? item.modelConf),
    recorded_at,
    detected_at,
    detected_in_ms: safeNumber(item.detected_in_ms ?? item.detectedInMs),
    camera_code,
    camera_label,
  };
}

// Build a fully joined staging payload: workspace + videos + detections.
function buildTimelineStaging(workspace, rawItems, videosForWid) {
  const byId = {};
  (Array.isArray(videosForWid) ? videosForWid : []).forEach((v) => {
    if (v?.id) {
      byId[v.id] = v;
    }
  });

  const detections = (Array.isArray(rawItems) ? rawItems : []).map((it, i) =>
    normalizeDetectionForStaging(it, i, byId)
  );

  const byVideoId = {};
  const unassigned = [];
  const cameraSet = new Set();

  detections.forEach((d) => {
    if (d.camera_code) cameraSet.add(d.camera_code);
    if (d.videoId && byId[d.videoId]) {
      if (!byVideoId[d.videoId]) byVideoId[d.videoId] = [];
      byVideoId[d.videoId].push(d);
    } else {
      unassigned.push(d);
    }
  });

  const sorted = [...detections].sort((a, b) => {
    const aTs = Date.parse(a.detected_at || "");
    const bTs = Date.parse(b.detected_at || "");
    const aVal = Number.isNaN(aTs) ? Number.POSITIVE_INFINITY : aTs;
    const bVal = Number.isNaN(bTs) ? Number.POSITIVE_INFINITY : bTs;
    return aVal - bVal;
  });

  const first = sorted[0] || null;
  const last = sorted[sorted.length - 1] || null;

  return {
    workspace: {
      id: workspace?.id || null,
      code: workspace?.code || "-",
      title: workspace?.title || "Workspace",
      description: workspace?.description || "",
      created_at: workspace?.created_at || workspace?.createdAt || null,
      plan: workspace?.plan || "—",
    },
    videos: {
      items: Object.values(byId),
      byId,
      coveredVideoIds: Object.keys(byVideoId),
    },
    detections: {
      items: detections,
      byVideoId,
      unassigned,
    },
    summary: {
      totalDetections: detections.length,
      distinctVideoCount: Object.keys(byVideoId).length,
      distinctCameraCount: cameraSet.size,
      firstDetectionAt: first?.detected_at || null,
      lastDetectionAt: last?.detected_at || null,
    },
  };
}

// Build a friendly payload to send to backend based on staging
function buildReportPayload(staging) {
  return {
    workspace: staging.workspace,
    videos: staging.videos,
    // flat list of detections
    detections: staging.detections.items,
    // grouped detections (videoId -> Detection[])
    groupedByVideo: staging.detections.byVideoId,
    summary: staging.summary,
  };
}

/* ---------------------------- API download helper ------------------------ */

/**
 * Calls the technical report API and triggers a browser download
 * of the returned PDF buffer.
 */
async function downloadTechnicalReport(wid, payload, workspaceCode) {
  const res = await fetch(
    `/api/reports/technical?workspace_id=${encodeURIComponent(wid)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const msg =
      (await res.text().catch(() => "")) ||
      `Failed to generate PDF (${res.status})`;
    throw new Error(msg);
  }

  const blob = await res.blob();
  if (!blob || blob.size === 0) {
    throw new Error("Empty PDF response from backend.");
  }

  const url = URL.createObjectURL(blob);

  // Trigger a download via a temporary <a> element.
  const a = document.createElement("a");
  a.href = url;
  a.download = `CVITX_${workspaceCode || wid}_technical_report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------------- List videos (same as playback) ------------------- */

// Backend shape: { workspaceId, items: VideoRowOut[] } or a plain array.
async function listWorkspaceVideos(wid) {
  const r = await fetch(`/api/workspaces/${wid}/videos`, {
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error(
      await r.text().catch(() => `Failed to list videos (${r.status})`)
    );
  }

  const j = await r.json();

  if (j && Array.isArray(j.items)) {
    return j.items.map((v) => {
      const cameraCode = v.cameraCode ?? v.camera_code ?? null;
      const fileName = v.fileName ?? v.file_name ?? null;
      return { ...v, camera_code: cameraCode, file_name: fileName };
    });
  }

  if (Array.isArray(j)) return j;

  return [];
}

/* =========================== Module: AI Report ============================ */

export default function AITechnicalWriterReport() {
  const { workspaceId } = useParams() || {};
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const wid =
    currentWorkspace?.id || (workspaceId ? String(workspaceId) : "default");

  // get current timeline and video catalog
  const timeline = useAppStore((s) => s.timeline);
  const videoCatalog = useAppStore((s) => s.videoCatalog);
  const publishVideos = useAppStore((s) => s.publishVideos);
  const setTimelineStaging = useAppStore((s) => s.setTimelineStaging);

  const items = useMemo(() => timeline?.[wid] || [], [timeline, wid]);

  const videosForWid = useMemo(() => {
    const byId = videoCatalog?.[wid] || {};
    return Object.values(byId);
  }, [videoCatalog, wid]);

  // Ensure video metadata is available even when user opens Technical Writer directly.
  useEffect(() => {
    if (!wid || wid === "default") return;
    const existing = videoCatalog?.[wid];
    const hasAny = existing && Object.keys(existing).length > 0;
    if (hasAny) return;

    (async () => {
      try {
        const videos = await listWorkspaceVideos(wid);
        if (Array.isArray(videos) && videos.length > 0) {
          publishVideos(wid, videos);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          "[AITechnicalWriter] failed to preload videos for workspace",
          wid,
          e?.message || e
        );
      }
    })();
  }, [wid, videoCatalog, publishVideos]);

  const [loading, setLoading] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState(null);

  const count = items.length;

  const generateAndDownload = useCallback(async () => {
    if (!count) {
      toast("Timeline is empty", {
        description: "Add detections to generate a report.",
      });
      return;
    }

    setLoading(true);

    // Build staging payload: workspace + videos + detections (joined & grouped)
    const staging = buildTimelineStaging(currentWorkspace, items, videosForWid);

    // Store in global staging slice for future CSV/PDF pipelines
    try {
      setTimelineStaging?.(wid, staging);
    } catch {
      // non-fatal; keeps compatibility if setter is missing
    }

    // Dev console log for debugging on the staging platform
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[CVITX] Timeline staging payload", {
        workspaceId: wid,
        staging,
      });
    }

    // Build API payload from staging
    const payload = buildReportPayload(staging);

    try {
      toast("Generating report…", {
        description: "Sending timeline to AI backend.",
      });

      await downloadTechnicalReport(
        wid,
        payload,
        currentWorkspace?.code || null
      );

      const ts = new Date().toISOString();
      setLastGeneratedAt(ts);

      toast("Report downloaded", {
        description:
          "Check your browser’s Downloads list for the latest PDF report.",
      });
    } catch (e) {
      toast("Generation failed", { description: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, [count, currentWorkspace, items, videosForWid, wid, setTimelineStaging]);

  const neutralBtn =
    "inline-flex items-center gap-2 h-8 px-3 text-xs rounded-md " +
    "border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 " +
    "disabled:opacity-60 disabled:pointer-events-none";

  return (
    <div className="w-full min-w-0 rounded-xl bg-neutral-900 border border-neutral-800 p-4 lg:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles size={18} />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800" />
          <div className="text-sm font-medium truncate">
            AI Technical Writer
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-neutral-800 my-4" />

      {/* Main state */}
      <div className="flex flex-col gap-4">
        {/* CTA / Loading */}
        {!loading && (
          <div className="w-full min-h-[200px] grid place-items-center">
            <Button
              onClick={generateAndDownload}
              className="gap-2 px-5 py-6 text-sm bg-transparent border-[1px] border-neutral-800 hover:border-orange-400 transition-all duration-300 ease-in-out"
            >
              <FileText className="h-4 w-4" />
              Generate &amp; Download AI Technical Report (PDF)
            </Button>
          </div>
        )}

        {loading && (
          <div className="w-full min-h-[200px] grid place-items-center">
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Technical Report… This can take a moment.
            </div>
          </div>
        )}

        {/* Download info / small status footer */}
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <div>
            Workspace{" "}
            <span className="font-mono">
              {currentWorkspace?.code || "-"}
            </span>{" "}
            ·{" "}
            <span className="font-medium">
              {currentWorkspace?.title || "Workspace"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastGeneratedAt && (
              <span className="opacity-80">
                Last generated:{" "}
                <span className="font-mono">
                  {lastGeneratedAt}
                </span>
              </span>
            )}
            <Button
              type="button"
              className={neutralBtn}
              onClick={generateAndDownload}
              disabled={loading || !count}
              title={
                count
                  ? "Generate a fresh PDF report and download it"
                  : "Timeline is empty; add detections first"
              }
            >
              <Download className="h-3.5 w-3.5" />
              {loading ? "Generating…" : "Generate again"}
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Developer Notes ----
        - The main button triggers:
            POST /api/reports/technical?workspace_id={wid}
          Body: buildReportPayload(staging)
          Response: raw PDF buffer (Content-Type: application/pdf).
        - On success, we read the response as a Blob and programmatically
          start a download using a temporary <a> element.
        - This avoids data: URLs, iframes, and popups that Chrome may block.
        - Timeline staging is still written into the global store for other
          pipelines (CSV export, future report variants, etc.).
      ---------------------------------------------------- */}
    </div>
  );
}
