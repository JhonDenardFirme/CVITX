"use client";
import { Skeleton } from "@/components/ui/skeleton";

function pct(x) { return x == null ? "—" : `${(x * 100).toFixed(1)}%`; }

export default function VariantCard({ title, data, imgKey, onImgError }) {
  if (!data) {
    return (
      <div className="border rounded p-3">
        <div className="mb-2 font-semibold">{title}</div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  return (
    <div className="border rounded p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <div className="text-xs px-2 py-0.5 rounded bg-muted">{data.status}</div>
      </div>
      {data.annotated_image?.url ? (
        <img
          key={imgKey}
          src={data.annotated_image.url}
          alt={`${title} annotated`}
          className="rounded w-full h-auto"
          loading="lazy"
          onError={onImgError}
        />
      ) : (
        <div className="text-xs opacity-70">Annotated image not ready.</div>
      )}
      <div className="text-sm">
        <div><b>Type:</b> {data.type || "—"} <span className="opacity-70">({pct(data.type_conf)})</span></div>
        <div><b>Make:</b> {data.make || "—"} <span className="opacity-70">({pct(data.make_conf)})</span></div>
        <div><b>Model:</b> {data.model || "—"} <span className="opacity-70">({pct(data.model_conf)})</span></div>
      </div>
      <div className="text-xs opacity-80 space-x-3">
        <span><b>Latency:</b> {data.latency_ms ?? "—"} ms</span>
        <span><b>GFLOPs:</b> {data.gflops ?? "—"}</span>
      </div>
      {data.plate_text && <div className="text-sm"><b>Plate:</b> {data.plate_text}</div>}
      {Array.isArray(data.colors) && data.colors.length > 0 && (
        <div className="text-sm"><b>Colors:</b> {data.colors.join(", ")}</div>
      )}
      {Array.isArray(data.parts) && data.parts.length > 0 && (
        <div className="text-sm">
          <b>Parts:</b> {data.parts.map((p) => `${p.name} (${pct(p.conf)})`).join(", ")}
        </div>
      )}
      {data.error_msg && <div className="text-xs text-red-600">{data.error_msg}</div>}
    </div>
  );
}
