// components/modules/DetectionTimeline.jsx
"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { VectorSquare, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ============================================================================
   Helpers
   ============================================================================ */

/** CTX1004-CAM1-0002 -> CAM1-0002 */
function toCamDisplayId(value) {
  const s = String(value ?? "");
  const m = s.match(/(CAM[A-Za-z0-9-]+)/);
  return m ? m[1] : s;
}

function fmtConf(v) {
  if (v == null) return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return "—";

  const clamped = Math.max(0, n);
  const pct =
    clamped <= 1
      ? Math.round(clamped * 100)
      : Math.round(clamped);

  return `${pct}%`;
}

/** hh:mm:ss for time of day (localized, client-only) */
function fmtHMS(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Short date + time, reusing the same time normalization pattern */
function fmtDateTimeLocal(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  const date = d.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const time = fmtHMS(dateStr);
  return `${date} • ${time}`;
}

/** Mounted-flag hook (avoid hydration mismatch on client-only formatting) */
function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/** Small helper to surgically update a workspace's timeline list */
function setTimelineForWid(wid, updater) {
  useAppStore.setState((prev) => {
    const current = prev.timeline?.[wid] || [];
    const next = updater(current);
    return { timeline: { ...prev.timeline, [wid]: next } };
  });
}

/* ============================================================================
   DetectionTimeline (global, workspace-scoped)
   ============================================================================ */

export default function DetectionTimeline() {
  const { workspaceId } = useParams() || {};
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const wid =
    currentWorkspace?.id || (workspaceId ? String(workspaceId) : "default");

  const { timeline, removeFromTimeline } = useAppStore();

  // Always read from the workspace-scoped bucket and sort by detected time.
  const items = useMemo(() => {
    const raw = timeline?.[wid] || [];
    if (!Array.isArray(raw) || raw.length === 0) return [];

    // Sort chronologically by detected_at/detectedAt (earliest → latest).
    return [...raw].sort((a, b) => {
      const aRaw = a.detected_at || a.detectedAt || "";
      const bRaw = b.detected_at || b.detectedAt || "";

      const aTs = Date.parse(aRaw);
      const bTs = Date.parse(bRaw);

      const aVal = Number.isNaN(aTs) ? Number.POSITIVE_INFINITY : aTs;
      const bVal = Number.isNaN(bTs) ? Number.POSITIVE_INFINITY : bTs;

      if (aVal === bVal) return 0;
      return aVal - bVal;
    });
  }, [timeline, wid]);

  const count = items.length;

  const handleRemove = useCallback(
    (item) => {
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx < 0) return;

      removeFromTimeline(wid, item.id);

      toast(`Removed ${toCamDisplayId(item.display_id || item.id)}`, {
        description: "Item removed from the timeline.",
        action: {
          label: "Undo",
          onClick: () => {
            setTimelineForWid(wid, (cur) => {
              if (cur.some((x) => x.id === item.id)) return cur;
              const next = [...cur];
              const clamped = Math.min(Math.max(idx, 0), next.length);
              next.splice(clamped, 0, item);
              return next;
            });
          },
        },
      });
    },
    [items, removeFromTimeline, wid]
  );

  return (
    // allow this flex child to shrink, and clip any accidental overflow
    <div className="w-full h-full flex flex-col gap-6 p-6 lg:p-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-row items-center w-full justify-between">
        <div className="flex flex-row gap-4 items-center min-w-0">
          <VectorSquare size={18} />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800" />
          <p className="text-sm truncate">Detection Timeline</p>
        </div>

        <div className="flex items-center">
          <div className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs">
              <span className="font-medium">{count}</span> Detection
              {count === 1 ? "" : "s"} in Timeline
            </span>
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full border-[1px] border-neutral-800" />

      {/* Horizontal scroller — active detections from timeline */}
      <div className="w-full min-w-0">
        <div className="text-sm text-neutral-400 mb-4">Active Detections</div>

        {/* the scroller itself is not allowed to exceed the slot width */}
        <div
          className={[
            "relative w-full max-w-full min-w-0 overflow-x-auto",
            "flex gap-6 pb-2 pr-1",
            "scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent",
          ].join(" ")}
        >
          {items.length === 0 ? (
            <div className="text-xs text-neutral-500 py-8">
              No items yet in Timeline — Add from Indexing Records or Vehicle
              Detection.
            </div>
          ) : (
            items.map((it) => (
              <DetectionCard key={it.id} item={it} onRemove={handleRemove} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   DetectionCard (per timeline item)
   ============================================================================ */

function DetectionCard({ item, onRemove }) {
  const camId = toCamDisplayId(item.display_id || item.id);
  const isMounted = useIsMounted();

  const classParts = useMemo(() => {
    const parts = [];

    const typeText =
      item?.type || item?.typeLabel || item?.yoloType || null;
    const makeText =
      item?.make || item?.makeLabel || null;
    const modelText =
      item?.model || item?.modelLabel || null;

    const typeConfRaw = item?.type_conf ?? item?.typeConf ?? null;
    const makeConfRaw = item?.make_conf ?? item?.makeConf ?? null;
    const modelConfRaw = item?.model_conf ?? item?.modelConf ?? null;

    const toNumeric = (value) => {
      if (value == null) return null;
      const n =
        typeof value === "string" ? parseFloat(value) : value;
      return Number.isFinite(n) ? n : null;
    };

    if (typeText) {
      parts.push({
        key: "Type",
        text: typeText,
        conf: toNumeric(typeConfRaw),
      });
    }
    if (makeText) {
      parts.push({
        key: "Make",
        text: makeText,
        conf: toNumeric(makeConfRaw),
      });
    }
    if (modelText) {
      parts.push({
        key: "Model",
        text: modelText,
        conf: toNumeric(modelConfRaw),
      });
    }
    return parts;
  }, [item]);

  const classValue =
    classParts.length === 0 ? (
      "-"
    ) : (
      <span className="inline-flex flex-wrap gap-x-1 gap-y-0.5 justify-end">
        {classParts.map((p, i) => (
          <Tooltip key={`${p.key}-${i}`}>
            <TooltipTrigger asChild>
              <span className="cursor-default hover:text-orange-500 transition-colors">
                {p.text}
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-neutral-800 text-neutral-100 border border-neutral-700">
              <p>{fmtConf(p.conf)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </span>
    );

  const cameraValue = item?.camera_code ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default hover:text-orange-500 transition-colors">
          {item.camera_code}
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-neutral-800 text-neutral-100 border border-neutral-700">
        <p>{item.camera_label || "—"}</p>
      </TooltipContent>
    </Tooltip>
  ) : (
    "—"
  );

  const detectedRaw = item.detected_at || item.detectedAt || null;
  const detectedNode = detectedRaw ? (
    <span suppressHydrationWarning>
      {isMounted ? fmtDateTimeLocal(detectedRaw) : ""}
    </span>
  ) : (
    "—"
  );

  return (
    <div
      className={[
        "shrink-0 w-[18rem]",
        "rounded-lg border border-neutral-800 bg-neutral-900",
        "p-3 flex flex-col gap-2 relative",
      ].join(" ")}
      title={camId}
    >
      <button
        aria-label="Remove"
        title="Remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item);
        }}
        className={[
          "absolute top-2 right-2 h-7 w-7 rounded-md",
          "grid place-items-center text-neutral-400",
          "hover:text-white hover:bg-red-500/20 transition",
        ].join(" ")}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="h-36 w-full rounded-md border border-neutral-800 overflow-hidden bg-black/40">
        {item.snapshot_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.snapshot_url}
            alt="Vehicle"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-[11px] text-neutral-500">
            NO IMAGE
          </div>
        )}
      </div>

      {/* Keep a separator under the image (Display ID row removed per request) */}
      <div className="h-px w-full bg-neutral-800" />

      <Row label="Class" value={classValue} />
      <Row label="Plate" value={item.plate_text || "-"} />
      <Row label="Camera" value={cameraValue} />
      <Row label="Detected" value={detectedNode} />

      <div className="h-14 w-full rounded-md border border-neutral-800 overflow-hidden bg-black/30 mt-1">
        {item.plate_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.plate_url}
            alt="Plate"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-[10px] text-neutral-500">
            NO PLATE IMAGE
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="text-xs text-neutral-400">{label}</div>
        <div className="text-xs text-white truncate max-w-[60%] text-right">
          {value}
        </div>
      </div>
      <div className="h-px w-full bg-neutral-800" />
    </>
  );
}
