"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkle, FileText, Loader2, RefreshCw, Download, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

/* -------------------------------- helpers -------------------------------- */

function toCamDisplayId(value) {
  const s = String(value ?? "");
  const m = s.match(/(CAM[A-Za-z0-9-]+)/);
  return m ? m[1] : s;
}

// Build a friendly payload to send to backend
function buildReportPayload(workspace, items) {
  return {
    workspace: {
      id: workspace?.id || null,
      code: workspace?.code || "-",
      title: workspace?.title || "Workspace",
      plan: workspace?.plan || "—",
    },
    // Keep your normalized detection shape intact so the backend can narrate
    detections: items.map((it, i) => ({
      idx: i + 1,
      id: it.id,
      display_id: toCamDisplayId(it.display_id || it.id),
      snapshot_url: it.snapshot_url || null,
      plate_url: it.plate_url || null,
      plate_text: it.plate_text || "",
      colors: Array.isArray(it.colors) ? it.colors : [],
      type: it.type || "",
      type_conf: it.type_conf ?? null,
      make: it.make || "",
      make_conf: it.make_conf ?? null,
      model: it.model || "",
      model_conf: it.model_conf ?? null,
      recorded_at: it.recorded_at || null,
      detected_at: it.detected_at || null,
      detected_in_ms: Number.isFinite(it.detected_in_ms) ? it.detected_in_ms : null,
      video_title: it.video_title || "",
      camera_code: it.camera_code || "",
      camera_label: it.camera_label || "",
    })),
  };
}

// Prefer pdf.js hosted viewer so you get zoom/download UI for free
function viewerUrlFor(pdfUrl) {
  const base = "https://mozilla.github.io/pdf.js/web/viewer.html";
  return `${base}?file=${encodeURIComponent(pdfUrl)}`;
}

/* ---------------------------- API (placeholder) --------------------------- */
/**
 * Attempts to request report generation. Expects backend to respond with:
 *   { pdf_url: "https://s3/your-report.pdf" }
 *
 * If backend isn’t ready, we fall back to a public PDF so the UI still works.
 */
async function requestTechnicalReport(wid, payload) {
  try {
    // TODO: change to your real API path and auth headers as needed
    const res = await fetch(`/api/reports/technical?workspace_id=${encodeURIComponent(wid)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      if (j?.pdf_url) return j.pdf_url;
    }
    // Non-OK – fall through to demo
    throw new Error(`backend returned ${res.status}`);
  } catch {
    // DEMO fallback – public PDF with CORS open (arXiv)
    return "https://arxiv.org/pdf/1706.03762.pdf"; // "Attention Is All You Need"
  }
}

/* =========================== Module: AI Report ============================ */

export default function AITechnicalWriterReport() {
  const { workspaceId } = useParams() || {};
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const wid = currentWorkspace?.id || (workspaceId ? String(workspaceId) : "default");

  // get current timeline
  const timeline = useAppStore((s) => s.timeline);
  const items = useMemo(() => timeline?.[wid] || [], [timeline, wid]);

  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);       // the S3 (or demo) PDF
  const [viewerSrc, setViewerSrc] = useState(null); // the pdf.js viewer URL (derived)
  const [refreshKey, setRefreshKey] = useState(0);  // allow forcing iframe reload

  const count = items.length;

  const generate = useCallback(async () => {
    if (!count) {
      toast("Timeline is empty", { description: "Add detections to generate a report." });
      return;
    }
    setLoading(true);
    setPdfUrl(null);
    setViewerSrc(null);

    // Build payload the backend will expect
    const payload = buildReportPayload(currentWorkspace, items);

    try {
      toast("Generating report…", { description: "Sending timeline to AI backend." });
      const url = await requestTechnicalReport(wid, payload);
      setPdfUrl(url);
      setViewerSrc(viewerUrlFor(url));
      toast("Report ready", { description: "Scroll and zoom the PDF below." });
    } catch (e) {
      toast("Generation failed", { description: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }, [count, currentWorkspace, items, wid]);

  const regenerate = useCallback(async () => {
    // Useful if timeline changed and you want a new report
    await generate();
    setRefreshKey((k) => k + 1); // force iframe reload even if same URL
  }, [generate]);

  const neutralBtn =
    "inline-flex items-center gap-2 h-8 px-3 text-xs rounded-md " +
    "border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 " +
    "disabled:opacity-60 disabled:pointer-events-none"

  return (
    // same width rules as timeline panels; no overflow beyond content slot
    <div className="w-full min-w-0 rounded-xl bg-neutral-900 border border-neutral-800 p-4 lg:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles size={18} />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800" />
          <div className="text-sm font-medium truncate">AI Technical Writer</div>
        </div>


      </div>

      <div className="h-px w-full bg-neutral-800 my-4" />

      {/* Idle state: centered CTA */}
      {!pdfUrl && !loading && (
        <div className="w-full min-h-[240px] grid place-items-center">
          <Button
            onClick={generate}
            className="gap-2 px-5 py-6 text-sm bg-transparent border-[1px] border-neutral-800 hover:border-orange-400 transition-all duration-300 ease-in-out"
          >
            <FileText className="h-4 w-4" />
            Generate AI Technical Report
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="w-full min-h-[240px] grid place-items-center">
          <div className="flex items-center gap-3 text-sm text-neutral-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Technical Report… This can take a moment.
          </div>
        </div>
      )}

      {/* Viewer state */}
      {pdfUrl && viewerSrc && !loading && (
        <div className="flex flex-col gap-3">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              Report for <span className="font-mono">{currentWorkspace?.code || "-"}</span> ·{" "}
              <span className="font-medium">{currentWorkspace?.title || "Workspace"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild className={neutralBtn} title="Download PDF">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                // add `download` if you want forced download instead of viewer:
                // download
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </Button>

              {/* Regenerate (same style) */}
              <Button
                className={neutralBtn}
                onClick={regenerate}
                title="Regenerate with current timeline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>
          </div>

          {/* PDF.js viewer (zoom, download, thumbnails built-in) */}
          <div className="w-full min-w-0 h-[72vh] rounded-lg overflow-hidden border border-neutral-800 bg-neutral-800">
            <iframe
              key={refreshKey}
              src={viewerSrc}
              className="w-full h-full"
              // sandbox keeps it safe but still allows forms/scripts needed by viewer
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              // avoid layout jump if viewer is heavy
              loading="lazy"
              title="AI Technical Report PDF"
            />
          </div>
        </div>
      )}

      {/* ---- Developer Notes (safe to keep or remove) ----
        - The "Generate" button posts: POST /api/reports/technical?workspace_id={wid}
          Body: buildReportPayload(workspace, timelineItems)
          Expected response: { pdf_url: "https://s3/path/report.pdf" }
        - Replace requestTechnicalReport() with your real API.
        - If your S3 bucket requires signed URLs, return them here.
        - We use Mozilla’s hosted PDF.js viewer for a full UI (zoom/download).
          If you want to self-host, copy pdf.js into /public/pdfjs and point `viewerUrlFor()`
          to /pdfjs/web/viewer.html?file=...
      ---------------------------------------------------- */}
    </div>
  );
}
