// File: components/modules/VideoAnalysisDetailsDialog.jsx
"use client";

import { useEffect, useState, Fragment } from "react";
import { useParams } from "next/navigation";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import VideoConfidenceBar from "./VideoConfidenceBar";

const FRAME =
  "w-full h-72 md:h-80 rounded-lg overflow-hidden border border-neutral-800 bg-black";
const FRAME_INNER_CENTER = "w-full h-full flex items-center justify-center";
const IMG = "h-full w-full object-contain";
const PLATE_FRAME =
  "w-full h-24 rounded-md overflow-hidden border border-neutral-800 bg-black";
const PLATE_IMG = "h-full w-full object-contain";

function pct(x) {
  if (x == null || Number.isNaN(+x)) return "—";
  const n = Math.max(0, Math.min(1, +x));
  return `${(n * 100).toFixed(1)}%`;
}

function Field({ label, children, mono }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      <div className={cn("text-sm", mono && "font-mono")}>
        {children ?? "—"}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
      <div className="text-xs text-neutral-300 mb-2">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/**
 * VehicleColors
 * - Designed to work well with ColorFBL[] from DetectionOut:
 *   { base, finish?, lightness?, conf }
 * - Still gracefully handles legacy/other shapes.
 */
function VehicleColors({ colors }) {
  const list = Array.isArray(colors)
    ? colors
    : colors && typeof colors === "object"
      ? Object.values(colors)
      : [];

  if (!list || list.length === 0) {
    return <div className="text-xs text-neutral-500">—</div>;
  }

  const textify = (v) => {
    if (v == null) return null;
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (Array.isArray(v)) {
      const parts = v.map(textify).filter(Boolean);
      return parts.length ? parts.join(" / ") : null;
    }
    if (typeof v === "object") {
      for (const k of ["label", "name", "value", "text", "code", "id"]) {
        if (v[k] != null) return String(v[k]);
      }
      if (v.hex) return String(v.hex);
      try {
        const s = JSON.stringify(v);
        return s && s.length <= 40 ? s : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const rows = list.slice(0, 3);

  return (
    <div className="space-y-1">
      {rows.map((col, i) => {
        const finish = textify(col?.finish);
        const base = textify(col?.base);
        const lightness = textify(col?.lightness);
        const hex = textify(col?.hex);

        const chips = [finish, base, lightness].filter(Boolean);
        if (chips.length === 0) {
          if (hex) chips.push(hex);
          else if (typeof col === "string" || typeof col === "number") {
            chips.push(String(col));
          }
        }

        const conf = col?.conf ?? col?.p ?? col?.confidence ?? null;

        return (
          <div
            key={i}
            className="flex items-center justify-between border-b border-neutral-800 py-1"
          >
            <div className="flex flex-wrap gap-1">
              {chips.map((t, j) => (
                <span
                  key={`${i}-${j}-${t}`}
                  className="text-[11px] px-2 py-0.5 rounded bg-neutral-800"
                >
                  {t.toString().toUpperCase()}
                </span>
              ))}
            </div>
            <div className="text-xs text-neutral-400 ml-4 whitespace-nowrap">
              {pct(conf)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * RuntimeMetrics
 * - Expects normalized keys (latency_ms, gflops, memory_gb).
 * - Shows memory in GB, aligned with DetectionOut (memoryGb in GB).
 */
function RuntimeMetrics({ v }) {
  if (!v) {
    return (
      <div className="text-xs text-neutral-500">
        No runtime metrics recorded.
      </div>
    );
  }

  const hasLatency =
    v.latency_ms != null && !Number.isNaN(Number(v.latency_ms));
  const latencyText = hasLatency ? `${Number(v.latency_ms)} ms` : "—";

  const hasGflops = v.gflops != null && !Number.isNaN(Number(v.gflops));
  const gflopsText = hasGflops ? `${Number(v.gflops).toFixed(4)} GFLOPs` : "—";

  const memGBRaw =
    v.memory_gb != null
      ? v.memory_gb
      : v.memory_usage != null
        ? v.memory_usage
        : null;
  const hasMem = memGBRaw != null && !Number.isNaN(Number(memGBRaw));
  const memText = hasMem ? `${Number(memGBRaw).toFixed(2)} GB` : "—";

  return (
    <div className="text-xs opacity-80 flex flex-wrap items-center justify-between gap-3">
      <div>
        <b>Latency:</b> {latencyText}
      </div>
      <div>
        <b>GFLOPs:</b> {gflopsText}
      </div>
      <div>
        <b>Memory:</b> {memText}
      </div>
    </div>
  );
}

/**
 * TmmGrid
 * - Uses normalized type/make/model + *_conf fields.
 */
function TmmGrid({ v }) {
  return (
    <div className="text-sm">
      <div className="grid grid-cols-3 gap-3 text-[11px] uppercase tracking-wider text-neutral-400">
        <div>Type</div>
        <div>Make</div>
        <div>Model</div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-1">
        <div className="flex items-baseline">
          <span>{v?.type || "—"}</span>
          <span className="text-[11px] text-neutral-500 ml-2">
            {pct(v?.type_conf)}
          </span>
        </div>
        <div className="flex items-baseline">
          <span>{v?.make || "—"}</span>
          <span className="text-[11px] text-neutral-500 ml-2">
            {pct(v?.make_conf)}
          </span>
        </div>
        <div className="flex items-baseline">
          <span>{v?.model || "—"}</span>
          <span className="text-[11px] text-neutral-500 ml-2">
            {pct(v?.model_conf)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * PartsList
 * - Renders part-level evidence: { name, conf }[].
 */
function PartsList({ parts }) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return <div className="text-xs text-neutral-500">No parts.</div>;
  }

  return (
    <ul className="grid grid-cols-1 gap-1">
      {parts.map((p, i) => (
        <li
          key={`${p?.name || "part"}-${i}`}
          className="flex items-center justify-between border-b border-neutral-800 py-1"
        >
          <span className="text-sm">{p?.name || "Part"}</span>
          <span className="text-xs text-neutral-500">{pct(p?.conf)}</span>
        </li>
      ))}
    </ul>
  );
}

function fmtDateTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

/**
 * normalizeDetectionView
 *
 * Normalizes DetectionOut into a stable view shape for the dialog.
 * Supports:
 * - New video-analysis DetectionOut (typeLabel, typeConf, plateText, colors: FBL[], assets.*)
 * - Legacy image-analysis detections (type, type_conf, plate_text, snapshot_url, etc.)
 *
 * The goal is to provide a unified "view" object:
 *   type, type_conf, make, make_conf, model, model_conf,
 *   plate_text, plate_conf, colors, parts,
 *   recorded_at, detected_at, detected_in_ms,
 *   latency_ms, gflops, memory_gb,
 *   snapshotUrl, plateUrl,
 *   status, error_msg
 */
function normalizeDetectionView(raw) {
  if (!raw) return null;

  const type =
    raw.typeLabel != null
      ? raw.typeLabel
      : raw.type != null
        ? raw.type
        : raw.type_label != null
          ? raw.type_label
          : "";
  const typeConf =
    raw.typeConf != null
      ? raw.typeConf
      : raw.type_conf != null
        ? raw.type_conf
        : null;

  const make =
    raw.makeLabel != null
      ? raw.makeLabel
      : raw.make != null
        ? raw.make
        : raw.make_label != null
          ? raw.make_label
          : "";
  const makeConf =
    raw.makeConf != null
      ? raw.makeConf
      : raw.make_conf != null
        ? raw.make_conf
        : null;

  const model =
    raw.modelLabel != null
      ? raw.modelLabel
      : raw.model != null
        ? raw.model
        : raw.model_label != null
          ? raw.model_label
          : "";
  const modelConf =
    raw.modelConf != null
      ? raw.modelConf
      : raw.model_conf != null
        ? raw.model_conf
        : null;

  const plateText =
    raw.plateText != null
      ? raw.plateText
      : raw.plate_text != null
        ? raw.plate_text
        : "";
  const plateConf =
    raw.plateConf != null
      ? raw.plateConf
      : raw.plate_conf != null
        ? raw.plate_conf
        : null;

  const colors = Array.isArray(raw.colors) ? raw.colors : [];
  const parts = Array.isArray(raw.parts) ? raw.parts : [];

  const recordedAt =
    raw.recordedAt != null ? raw.recordedAt : raw.recorded_at ?? null;
  const detectedAt =
    raw.detectedAt != null ? raw.detectedAt : raw.detected_at ?? null;
  const detectedInMs =
    raw.detectedInMs != null ? raw.detectedInMs : raw.detected_in_ms ?? null;

  const latencyMs =
    raw.latencyMs != null ? raw.latencyMs : raw.latency_ms ?? null;
  const gflops = raw.gflops != null ? raw.gflops : null;
  const memoryGb =
    raw.memoryGb != null
      ? raw.memoryGb
      : raw.memory_gb != null
        ? raw.memory_gb
        : null;

  const assets = raw.assets || {};

  const snapshotUrl =
    assets.annotatedUrl ||
    assets.annotated_url ||
    assets.vehicleUrl ||
    assets.vehicle_url ||
    raw.snapshotUrl ||
    raw.snapshot_url ||
    raw.image ||
    raw.snapshot ||
    null;

  const plateUrl =
    assets.plateUrl ||
    assets.plate_url ||
    raw.plateUrl ||
    raw.plate_url ||
    raw.plate_image ||
    null;

  const status = raw.status != null ? raw.status : "processed";
  const errorMsg =
    raw.error_msg != null
      ? raw.error_msg
      : raw.errorMsg != null
        ? raw.errorMsg
        : null;

  return {
    ...raw,
    type,
    type_conf: typeConf,
    make,
    make_conf: makeConf,
    model,
    model_conf: modelConf,
    plate_text: plateText,
    plate_conf: plateConf,
    colors,
    parts,
    recorded_at: recordedAt,
    detected_at: detectedAt,
    detected_in_ms: detectedInMs,
    latency_ms: latencyMs,
    gflops,
    memory_gb: memoryGb,
    // keep memory_usage as-is for legacy; metrics helper prefers memory_gb if present
    memory_usage: raw.memory_usage != null ? raw.memory_usage : null,
    snapshotUrl,
    plateUrl,
    status,
    error_msg: errorMsg,
  };
}

export default function VideoAnalysisDetailsDialog({
  id,
  videoId,
  workspaceId,
  open,
}) {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !id) return;

    setData(null);
    setError(null);
    setLoading(true);

    let cancelled = false;

    (async () => {
      try {
        const routeWid =
          workspaceId && typeof workspaceId === "string"
            ? workspaceId
            : params && typeof params.workspaceId === "string"
              ? params.workspaceId
              : null;

        let url;
        // Preferred path for video-analysis detections
        if (routeWid && videoId) {
          url = `/api/workspaces/${routeWid}/videos/${videoId}/detections/${id}?presign=1&ttl=900`;
        } else {
          // Backwards-compatible fallback for legacy image-analysis
          url = `/api/proxy/detections/${id}`;
        }

        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) {
          throw new Error("Failed to load detection details");
        }
        const j = await r.json();
        if (!cancelled) {
          setData(j);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e && e.message
              ? e.message
              : "Failed to load detection details."
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, id, videoId, workspaceId, params]);

  const view = data ? normalizeDetectionView(data) : null;
  const snapshotUrl = view?.snapshotUrl || null;
  const plateUrl = view?.plateUrl || null;

  return (
    <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto z-[70]">
      <DialogHeader className="pb-2">
        <DialogTitle className="text-lg">Detection Details</DialogTitle>
        <DialogDescription>
          Review video analysis attributes, plate details, colors, runtime
          metrics, and parts.
        </DialogDescription>
      </DialogHeader>

      {!view ? (
        <div className="py-16 flex items-center justify-center text-sm text-neutral-400">
          {loading ? (
            <Fragment>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </Fragment>
          ) : error ? (
            <span>{error}</span>
          ) : (
            "No data"
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* TOP: Snapshot + plate + basic attrs */}
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
            <Card title="Vehicle Snapshot & Plate Details">
              <div className={FRAME}>
                {snapshotUrl ? (
                  <img
                    src={snapshotUrl}
                    alt="Snapshot"
                    className={IMG}
                    loading="eager"
                  />
                ) : (
                  <div className={FRAME_INNER_CENTER}>
                    <span className="text-xs text-neutral-600">
                      No snapshot available.
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-3">
                <div>
                  <Field label="Plate Text" mono>
                    <div className="flex items-baseline">
                      <span>{view.plate_text || "—"}</span>
                      <span className="text-[11px] text-neutral-500 ml-2">
                        {pct(view.plate_conf)}
                      </span>
                    </div>
                  </Field>
                </div>
                <div className={PLATE_FRAME}>
                  {plateUrl ? (
                    <img
                      src={plateUrl}
                      alt="Plate crop"
                      className={PLATE_IMG}
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
                      No plate crop
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Card title="Type / Make / Model">
                <TmmGrid v={view} />
              </Card>

              <Card title="Confidence — Type / Make / Model">
                <VideoConfidenceBar variant={view} />
              </Card>

              <Card title="Status & Runtime">
                <Field label="Status">
                  <Badge variant="secondary">
                    {view.status || "processed"}
                  </Badge>
                </Field>
                <RuntimeMetrics v={view} />
              </Card>
            </div>
          </div>

          {/* MIDDLE: Colors */}
          <div className="grid grid-cols-1 gap-4">
            <Card title="Vehicle Colors">
              <VehicleColors colors={view.colors} />
            </Card>
          </div>

          {/* TIMING */}
          <Card title="Timing">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Recorded At">
                <span suppressHydrationWarning>
                  {fmtDateTime(view.recorded_at)}
                </span>
              </Field>
              <Field label="Detected At">
                <span suppressHydrationWarning>
                  {fmtDateTime(view.detected_at)}
                </span>
              </Field>
              <Field label="Detected In (ms)" mono>
                {view.detected_in_ms != null ? view.detected_in_ms : "—"}
              </Field>
            </div>
          </Card>

          {/* PARTS */}
          <Card title="Detected Parts">
            <PartsList parts={view.parts} />
          </Card>

          {view.error_msg && (
            <div className="text-xs text-red-500">{view.error_msg}</div>
          )}
        </div>
      )}

      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
