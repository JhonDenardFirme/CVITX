"use client";

import React, { useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkle, VectorSquare, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function toCamDisplayId(value) {
  const s = String(value ?? "");
  const m = s.match(/(CAM[A-Za-z0-9-]+)/);
  return m ? m[1] : s;
}
function fmtConf(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  const pct = v <= 1 ? Math.round(v * 100) : Math.round(v);
  return `${pct}%`;
}
function setTimelineForWid(wid, updater) {
  useAppStore.setState((prev) => {
    const current = prev.timeline?.[wid] || [];
    const next = updater(current);
    return { timeline: { ...prev.timeline, [wid]: next } };
  });
}

export default function DetectionTimeline() {
  const { workspaceId } = useParams() || {};
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const wid = currentWorkspace?.id || (workspaceId ? String(workspaceId) : "default");

  const { timeline, removeFromTimeline } = useAppStore();
  const items = useMemo(() => (timeline?.[wid] || []), [timeline, wid]);
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
    // ✅ allow this flex child to shrink, and clip any accidental overflow
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
              <span className="font-medium">{count}</span> Detection{count === 1 ? "" : "s"} in Timeline
            </span>
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full border-[1px] border-neutral-800" />

      {/* Horizontal scroller — active detections from timeline */}
      <div className="w-full min-w-0">
        <div className="text-sm text-neutral-400 mb-4">Active Detections</div>

        {/* ✅ the scroller itself is not allowed to exceed the slot width */}
        <div
          className={[
            "relative w-full max-w-full min-w-0 overflow-x-auto",
            "flex gap-6 pb-2 pr-1",
            "scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent",
          ].join(" ")}
        >
          {items.length === 0 ? (
            <div className="text-xs text-neutral-500 py-8">
              No items yet in Timeline — Add from Indexing Records or Vehicle Detection.
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

function DetectionCard({ item, onRemove }) {
  const camId = toCamDisplayId(item.display_id || item.id);

  const classParts = React.useMemo(() => {
    const parts = [];
    if (item?.type) parts.push({ key: "Type", text: item.type, conf: item.type_conf });
    if (item?.make) parts.push({ key: "Make", text: item.make, conf: item.make_conf });
    if (item?.model) parts.push({ key: "Model", text: item.model, conf: item.model_conf });
    return parts;
  }, [item?.type, item?.make, item?.model, item?.type_conf, item?.make_conf, item?.model_conf]);

  const classValue = classParts.length === 0 ? (
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

      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-400">Display ID</div>
        <div className="text-xs font-mono">{camId || "—"}</div>
      </div>
      <div className="h-px w-full bg-neutral-800" />

      <Row label="Class" value={classValue} />
      <Row label="Plate" value={item.plate_text || "-"} />
      <Row label="Camera" value={cameraValue} />
      <Row
        label="Detected"
        value={item.detected_at ? new Date(item.detected_at).toLocaleString() : "—"}
      />

      <div className="h-14 w-full rounded-md border border-neutral-800 overflow-hidden bg-black/30 mt-1">
        {item.plate_url ? (
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
        <div className="text-xs text-white truncate max-w-[60%] text-right">{value}</div>
      </div>
      <div className="h-px w-full bg-neutral-800" />
    </>
  );
}
