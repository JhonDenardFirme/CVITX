// File: components/modules/ImageAnalysisDetailsDialog.jsx
"use client";

import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Repeat } from "lucide-react";
import { iaShow, iaEnqueue } from "@/lib/imageAnalysis";
import { normalizeVariant } from "@/lib/imageAnalysisNormalize";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Compare } from "@/components/ui/compare";

const FRAME =
  "w-full h-64 md:h-80 rounded-lg overflow-hidden border border-neutral-800 bg-black";
const FRAME_INNER_CENTER = "w-full h-full flex items-center justify-center";
const IMG = "h-full w-full object-contain";
const PLATE_FRAME =
  "w-full h-28 rounded-md overflow-hidden border border-neutral-800 bg-black";
const PLATE_IMG = "h-full w-full object-contain";

const PARTS_CHART_HEIGHT = 600;
const PARTS_LEFT_MARGIN = 120;
const PARTS_MIN_BAR = 8;
const PARTS_MAX_BAR = 18;
const PARTS_MIN_PAIR_GAP = 6;

function Field({ label, children, mono }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      <div className={["text-sm", mono ? "font-mono" : ""].join(" ")}>
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

const pct = (x) =>
  x == null ? "—" : `${(Math.max(0, Math.min(1, +x)) * 100).toFixed(1)}%`;

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
  // latency: keep ms label
  const hasLatency =
    v?.latency_ms != null && !Number.isNaN(Number(v.latency_ms));
  const latencyText = hasLatency ? `${Number(v.latency_ms)} ms` : "—";

  // gflops: show to 4 decimals + unit label
  const hasGflops = v?.gflops != null && !Number.isNaN(Number(v.gflops));
  const gflopsText = hasGflops ? `${Number(v.gflops).toFixed(4)} GFLOPs` : "—";

  // memory: prefer memory_gb (new), fallback to memory_usage (legacy GB)
  const memGBRaw =
    v?.memory_gb != null
      ? v.memory_gb
      : v?.memory_usage != null
        ? v.memory_usage
        : null;
  const hasMem = memGBRaw != null && !Number.isNaN(Number(memGBRaw));
  const memMB = hasMem ? Number(memGBRaw) * 1024 : null;
  const memText = hasMem ? `${memMB.toFixed(0)} MB` : "—";

  return (
    <div className="text-xs opacity-80 flex items-center justify-between gap-3">
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

// ⬇️ Authorized change: replace TypeMakeModelChart with inner-height control
// drop-in replacement
function TypeMakeModelChart({ baseline, cmt }) {
  if (!baseline && !cmt) return null;

  const toPct100 = (x) => {
    if (x == null || Number.isNaN(+x)) return 0;
    const n = Math.max(0, Math.min(1, +x));
    return Math.round(n * 100);
  };

  const data = [
    { metric: "Type", baseline: toPct100(baseline?.type_conf), cmt: toPct100(cmt?.type_conf) },
    { metric: "Make", baseline: toPct100(baseline?.make_conf), cmt: toPct100(cmt?.make_conf) },
    { metric: "Model", baseline: toPct100(baseline?.model_conf), cmt: toPct100(cmt?.model_conf) },
  ];

  const chartConfig = {
    baseline: { label: "Baseline", color: "var(--chart-1)" },
    cmt: { label: "CMT", color: "var(--chart-2)" },
  };

  // ✅ Single source of truth: set height on ChartContainer only
  return (
    <div className="w-full h-full flex flex-col justify-center items-center pt-32">
      <ChartContainer config={chartConfig} className="w-[80%] h-[400px]">
        <BarChart accessibilityLayer data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="metric" tickLine={false} tickMargin={10} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={28} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
          <Tooltip
            cursor={false}
            content={(props) => {
              const d = props?.payload?.[0]?.payload;
              if (!d) return null;
              return (
                <div className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs">
                  <div className="mb-1 font-medium">{d.metric}</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-baseline)" }} />
                    <span>Baseline</span>
                    <span className="ml-auto text-neutral-300">{d.baseline}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-cmt)" }} />
                    <span>CMT</span>
                    <span className="ml-auto text-neutral-300">{d.cmt}%</span>
                  </div>
                </div>
              );
            }}
            wrapperStyle={{ outline: "none" }}
          />
          <Bar dataKey="baseline" name="Baseline" fill="var(--color-baseline)" radius={4} />
          <Bar dataKey="cmt" name="CMT" fill="var(--color-cmt)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}


function PartsConfidenceChart({ baselineParts, cmtParts }) {
  const names = useMemo(
    () =>
      Array.from(
        new Set([
          ...(baselineParts || []).map((p) => (p?.name || "").toString()),
          ...(cmtParts || []).map((p) => (p?.name || "").toString()),
        ])
      ).filter(Boolean),
    [baselineParts, cmtParts]
  );

  if (names.length === 0) {
    return (
      <div className="w-full h-72 rounded-md border border-neutral-800 bg-neutral-950/60 flex items-center justify-center text-xs text-neutral-500">
        No parts detected.
      </div>
    );
  }

  const to01 = (x) =>
    x == null || Number.isNaN(+x) ? 0 : Math.max(0, Math.min(1, +x));
  const mapParts = (arr) => {
    const m = new Map();
    (arr || []).forEach((p) =>
      m.set((p?.name || "").toString(), to01(p?.conf))
    );
    return m;
  };
  const bMap = mapParts(baselineParts);
  const cMap = mapParts(cmtParts);

  const rows = names.map((name) => ({
    name,
    baseline: Math.round((bMap.get(name) ?? 0) * 100),
    cmt: Math.round((cMap.get(name) ?? 0) * 100),
  }));

  const count = rows.length;
  const usable = PARTS_CHART_HEIGHT - 40;
  const estBar = Math.floor(usable / (count * 3.2));
  const barSize = Math.max(PARTS_MIN_BAR, Math.min(PARTS_MAX_BAR, estBar));
  const pairGap = Math.max(PARTS_MIN_PAIR_GAP, Math.floor(barSize * 0.6));
  const catGapPct = Math.max(16, Math.min(36, Math.round(42 - (count - 3) * 3)));
  const catGap = `${catGapPct}%`;

  return (
    <ChartContainer
      config={{
        baseline: { label: "Baseline", color: "var(--chart-1)" },
        cmt: { label: "CMT", color: "var(--chart-2)" },
      }}
      className="w-full"
      style={{ height: PARTS_CHART_HEIGHT }}
    >
      <BarChart
        accessibilityLayer
        data={rows}
        layout="vertical"
        margin={{ left: PARTS_LEFT_MARGIN, right: 12 }}
        barCategoryGap={catGap}
        barGap={pairGap}
      >
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <Tooltip
          cursor={false}
          content={(props) => {
            const p = props?.payload?.[0]?.payload;
            if (!p) return null;
            return (
              <div className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs">
                <div className="mb-1 font-medium">Part: {p.name}</div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ background: "var(--color-baseline)" }}
                  />
                  <span>Baseline</span>
                  <span className="ml-auto text-neutral-300">{p.baseline}%</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ background: "var(--color-cmt)" }}
                  />
                  <span>CMT</span>
                  <span className="ml-auto text-neutral-300">{p.cmt}%</span>
                </div>
              </div>
            );
          }}
          wrapperStyle={{ outline: "none" }}
        />
        <Bar
          dataKey="baseline"
          name="Baseline"
          fill="var(--color-baseline)"
          barSize={barSize}
          radius={5}
        />
        <Bar
          dataKey="cmt"
          name="CMT"
          fill="var(--color-cmt)"
          barSize={barSize}
          radius={5}
        />
      </BarChart>
    </ChartContainer>
  );
}

export default function ImageAnalysisDetailsDialog({
  workspaceId,
  analysisId,
  open,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgErr, setImgErr] = useState({ orig: false, b: false, c: false });
  const [view, setView] = useState("original"); // "original" | "baseline" | "cmt" | "compare"

  const fetchOnce = useCallback(async () => {
    if (!workspaceId || !analysisId) return;
    setLoading(true);
    try {
      const d = await iaShow(workspaceId, analysisId);
      try {
        console.debug("[IA SHOW]", { workspaceId, analysisId, data: d });
      } catch { }
      const normB = normalizeVariant(d?.results?.baseline);
      const normC = normalizeVariant(d?.results?.cmt);
      try {
        console.debug("[IA PARTS]", {
          analysisId,
          baseline: {
            count: Array.isArray(normB?.parts) ? normB.parts.length : 0,
            parts: normB?.parts || [],
          },
          cmt: {
            count: Array.isArray(normC?.parts) ? normC.parts.length : 0,
            parts: normC?.parts || [],
          },
        });
      } catch { }
      setData({ ...d, results: { baseline: normB, cmt: normC } });
    } finally {
      setLoading(false);
    }
  }, [workspaceId, analysisId]);

  useEffect(() => {
    if (!open) return;
    setData(null);
    setImgErr({ orig: false, b: false, c: false });
    setView("original");
    fetchOnce();
  }, [open, fetchOnce]);

  const refresh = () => {
    setImgErr({ orig: false, b: false, c: false });
    fetchOnce();
  };

  const b = data?.results?.baseline || null;
  const c = data?.results?.cmt || null;

  const toggleClass = (active) =>
    active ? "bg-orange-500 text-white hover:bg-orange-500" : "";

  const originalUrl = data?.input_image?.url || null;
  const bUrl = b?.annotated_image?.url || null;
  const cUrl = c?.annotated_image?.url || null;
  const bPlateUrl = b?.plate_image?.url || null;
  const cPlateUrl = c?.plate_image?.url || null;

  return (
    <DialogContent className="sm:max-w-[1080px] max-h-[85vh] overflow-y-auto z-[70]">
      <DialogHeader className="pb-2">
        <DialogTitle className="text-lg">Analysis Details</DialogTitle>
        <DialogDescription>
          Baseline vs CMT side-by-side. Review attributes, annotated images,
          parts, and confidence comparisons.
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className={toggleClass(view === "original")}
                onClick={() => setView("original")}
              >
                Original
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={toggleClass(view === "baseline")}
                onClick={() => setView("baseline")}
              >
                Baseline
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={toggleClass(view === "cmt")}
                onClick={() => setView("cmt")}
              >
                CMT
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={toggleClass(view === "compare")}
                onClick={() => setView("compare")}
              >
                Compare
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => iaEnqueue(workspaceId, analysisId)}
              >
                <Repeat className="mr-2 h-4 w-4" /> Re-run
              </Button>
              <Button variant="secondary" size="sm" onClick={refresh}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          <div className={FRAME}>
            {view === "original" && (
              <div className={FRAME_INNER_CENTER}>
                {originalUrl && !imgErr.orig ? (
                  <img
                    src={originalUrl}
                    alt="Original"
                    className={IMG}
                    loading="eager"
                    onError={() => setImgErr((s) => ({ ...s, orig: true }))}
                  />
                ) : (
                  <div className="text-xs text-neutral-600">Original Image</div>
                )}
              </div>
            )}

            {view === "baseline" && (
              <div className={FRAME_INNER_CENTER}>
                {bUrl && !imgErr.b ? (
                  <img
                    src={bUrl}
                    alt="Baseline annotated"
                    className={IMG}
                    loading="eager"
                    onError={() => setImgErr((s) => ({ ...s, b: true }))}
                  />
                ) : (
                  <div className={`${FRAME_INNER_CENTER} text-xs text-neutral-600`}>
                    Baseline Visualization
                  </div>
                )}
              </div>
            )}

            {view === "cmt" && (
              <div className={FRAME_INNER_CENTER}>
                {cUrl && !imgErr.c ? (
                  <img
                    src={cUrl}
                    alt="CMT annotated"
                    className={IMG}
                    loading="eager"
                    onError={() => setImgErr((s) => ({ ...s, c: true }))}
                  />
                ) : (
                  <div className={`${FRAME_INNER_CENTER} text-xs text-neutral-600`}>
                    CMT Visualization
                  </div>
                )}
              </div>
            )}

            {view === "compare" && (
              <div className="w-full h-full">
                {bUrl && cUrl ? (
                  <Compare
                    firstImage={bUrl}
                    secondImage={cUrl}
                    firstImageClassName="object-contain"
                    secondImageClassname="object-contain"
                    className="w-full h-full"
                    slideMode="hover"
                  />
                ) : (
                  <div className="w-full h-full flex">
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-neutral-600">
                        Baseline Visualization
                      </span>
                    </div>
                    <div className="w-px bg-neutral-800" />
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-neutral-600">
                        CMT Visualization
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Baseline">
              <div className={FRAME}>
                {bUrl && !imgErr.b ? (
                  <img
                    src={bUrl}
                    alt="Baseline annotated"
                    className={IMG}
                    loading="eager"
                    onError={() => setImgErr((s) => ({ ...s, b: true }))}
                  />
                ) : (
                  <div className={`${FRAME_INNER_CENTER} text-xs text-neutral-600`}>
                    Baseline Visualization
                  </div>
                )}
              </div>

              <TmmGrid v={b} />

              <Field label="Plate">
                <div className="flex items-baseline">
                  <span className="">{b?.plate_text || "—"}</span>
                  <span className="text-[11px] text-neutral-500 ml-2">
                    {pct(b?.plate_conf)}
                  </span>
                </div>
                <div className={`${PLATE_FRAME} mt-2`}>
                  {bPlateUrl ? (
                    <img
                      src={bPlateUrl}
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
              </Field>

              <Field label="Vehicle Colors">
                <VehicleColors colors={b?.colors} />
              </Field>

              <Field label="Parts">
                <PartsList parts={b?.parts} />
              </Field>

              <RuntimeMetrics v={b} />

              {b?.status === "error" && b?.error_msg && (
                <div className="text-xs text-red-500">{b.error_msg}</div>
              )}
            </Card>

            <Card title="CMT">
              <div className={FRAME}>
                {cUrl && !imgErr.c ? (
                  <img
                    src={cUrl}
                    alt="CMT annotated"
                    className={IMG}
                    loading="eager"
                    onError={() => setImgErr((s) => ({ ...s, c: true }))}
                  />
                ) : (
                  <div className={`${FRAME_INNER_CENTER} text-xs text-neutral-600`}>
                    CMT Visualization
                  </div>
                )}
              </div>

              <TmmGrid v={c} />

              <Field label="Plate">
                <div className="flex items-baseline">
                  <span className="font-mono">{c?.plate_text || "—"}</span>
                  <span className="text-[11px] text-neutral-500 ml-2">
                    {pct(c?.plate_conf)}
                  </span>
                </div>
                <div className={`${PLATE_FRAME} mt-2`}>
                  {cPlateUrl ? (
                    <img
                      src={cPlateUrl}
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
              </Field>

              <Field label="Vehicle Colors">
                <VehicleColors colors={c?.colors} />
              </Field>

              <Field label="Parts">
                <PartsList parts={c?.parts} />
              </Field>

              <RuntimeMetrics v={c} />

              {c?.status === "error" && c?.error_msg && (
                <div className="text-xs text-red-500">{c.error_msg}</div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Confidence — Type / Make / Model">
              <TypeMakeModelChart baseline={b} cmt={c} />
            </Card>
            <Card title="Parts Confidence — Baseline vs CMT (Side by Side)">
              <PartsConfidenceChart baselineParts={b?.parts} cmtParts={c?.parts} />
            </Card>
          </div>
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
          <span className="text-xs text-[11px] text-neutral-500">
            {pct(p?.conf)}
          </span>
        </li>
      ))}
    </ul>
  );
}
