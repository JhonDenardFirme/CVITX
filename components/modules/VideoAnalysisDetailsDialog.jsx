// File: components/modules/VideoAnalysisDetailsDialog.jsx
"use client";

import { useEffect, useState, Fragment } from "react";
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
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import VideoConfidenceBar from "./VideoConfidenceBar";

const FRAME =
  "w-full h-64 md:h-72 rounded-lg overflow-hidden border border-neutral-800 bg-black";
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
          else if (typeof col === "string" || typeof col === "number")
            chips.push(String(col));
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
  const memMB = hasMem ? Number(memGBRaw) * 1024 : null;
  const memText = hasMem ? `${memMB.toFixed(0)} MB` : "—";

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

function PartsList({ parts }) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return <div className="text-xs text-neutral-500">No parts.</div>;
  }
  return (
    <ul className="text-sm grid grid-cols-1 gap-1">
      {parts.map((p, i) => (
        <li
          key={`${p?.name || "part"}-${i}`}
          className="flex items-center justify-between border-b border-neutral-800 py-1"
        >
          <span>{p?.name || "Part"}</span>
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

export default function VideoAnalysisDetailsDialog({ id, open }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [vizUrl, setVizUrl] = useState(null);
  const [vizLoading, setVizLoading] = useState(false);

  useEffect(() => {
    if (!open || !id) return;
    setData(null);
    setVizUrl(null);
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(`/api/proxy/detections/${id}`, { cache: "no-store" });
        if (!r.ok) throw new Error("Failed to load detection");
        const j = await r.json();
        setData(j);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, id]);

  const requestVisualization = async () => {
    if (!id) return;
    setVizLoading(true);
    try {
      const r = await fetch(`/api/proxy/detections/${id}/evidence`, {
        method: "POST",
      });
      const j = await r.json().catch(() => ({}));
      setVizUrl(j?.image_url || data?.snapshot_url || null);
    } catch {
      setVizUrl(data?.snapshot_url || null);
    } finally {
      setVizLoading(false);
    }
  };

  const snapshotUrl = data?.snapshot_url || data?.image || null;
  const plateUrl = data?.plate_url || data?.plate_image || null;

  return (
    <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto z-[70]">
      <DialogHeader className="pb-2">
        <DialogTitle className="text-lg">Detection Details</DialogTitle>
        <DialogDescription>
          Review CMT video analysis attributes, annotated evidence, and parts.
        </DialogDescription>
      </DialogHeader>

      {!data ? (
        <div className="py-16 flex items-center justify-center text-sm text-neutral-400">
          {loading ? (
            <Fragment>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </Fragment>
          ) : (
            "No data"
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* TOP: Snapshot + evidence + basic attrs */}
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4">
            <Card title="Vehicle Snapshot & AI Detection Report">
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

              <div className="mt-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestVisualization}
                  disabled={vizLoading}
                  className="h-8 w-fit px-3 border-dashed border-neutral-700 hover:bg-neutral-900"
                >
                  {vizLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {vizLoading ? "Processing…" : "Request AI Detection Report"}
                </Button>

                <div
                  className={cn(
                    "w-full border border-dashed border-neutral-700 rounded-lg bg-neutral-950 flex items-center justify-center overflow-hidden transition-all",
                    vizUrl ? "h-auto p-2 mt-2" : "h-24 mt-1"
                  )}
                >
                  {vizUrl ? (
                    <div className="max-w-full">
                      <img
                        src={vizUrl}
                        alt="Detection Evidence"
                        className="mx-auto"
                        style={{
                          width: "min(720px, 100%)",
                          height: "auto",
                          aspectRatio: "1 / 1",
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-500">
                      Will expand to show AI detection visualization when ready.
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Card title="Type / Make / Model">
                <TmmGrid v={data} />
              </Card>

              <Card title="Confidence — Type / Make / Model">
                <VideoConfidenceBar variant={data} />
              </Card>

              <Card title="Status & Runtime">
                <Field label="Status">
                  <Badge variant="secondary">
                    {data.status || "processed"}
                  </Badge>
                </Field>
                <RuntimeMetrics v={data} />
              </Card>
            </div>
          </div>

          {/* MIDDLE: Plate + Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="License Plate">
              <Field label="Plate Text" mono>
                <div className="flex items-baseline">
                  <span>{data.plate_text || "—"}</span>
                  <span className="text-[11px] text-neutral-500 ml-2">
                    {pct(data.plate_conf)}
                  </span>
                </div>
              </Field>
              <div className={`${PLATE_FRAME} mt-2`}>
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
            </Card>

            <Card title="Vehicle Colors">
              <VehicleColors colors={data.colors} />
            </Card>
          </div>

          {/* TIMING */}
          <Card title="Timing">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Recorded At">
                <span suppressHydrationWarning>{fmtDateTime(data.recorded_at)}</span>
              </Field>
              <Field label="Detected At">
                <span suppressHydrationWarning>{fmtDateTime(data.detected_at)}</span>
              </Field>
              <Field label="Detected In (ms)" mono>
                {data.detected_in_ms != null ? data.detected_in_ms : "—"}
              </Field>
            </div>
          </Card>

          {/* PARTS */}
          <Card title="Detected Parts">
            <PartsList parts={data.parts} />
          </Card>

          {data.error_msg && (
            <div className="text-xs text-red-500">{data.error_msg}</div>
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
