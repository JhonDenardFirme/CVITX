// components/modules/ImageAnalysisTable.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Loader2, Eye, Download } from "lucide-react";

import {
  vehicleTypes,
  vehicleColors,
  allVehicleMakes,
  allVehicleModels,
} from "@/lib/constants";

import { iaList, iaShow } from "@/lib/imageAnalysis";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import ImageAnalysisDetailsDialog from "./ImageAnalysisDetailsDialog";

/* ───────────────────────────────────────────────────────────────
   Options for filters (vocabulary sources)
   NOTE: Each list is modernized and ends with "-" which represents NULL.
   ─────────────────────────────────────────────────────────────── */
const options = {
  type: vehicleTypes,
  color: vehicleColors,
  make: allVehicleMakes,
  model: allVehicleModels, // model-only strings (no MAKE_ prefix) plus "-" for NULL
};

/* ───────────────────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────────────────── */
const p = (x) => (typeof x === "number" ? `${Math.round(x * 100)}%` : "—");
const toLower = (v) => String(v ?? "").toLowerCase();

const isNullish = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

const hasNullOption = (arr) => Array.isArray(arr) && arr.some((x) => x === "-");

// exact (case-insensitive) match or NULL if "-" is selected
function matchesNullableExact(selected, value) {
  if (!selected?.length) return true;

  const wantsNull = hasNullOption(selected);
  const wantsValues = selected.filter((x) => x !== "-");

  if (wantsNull && isNullish(value)) return true;
  if (!wantsValues.length) return false;

  return wantsValues.some((n) => toLower(n) === toLower(value));
}

// array-overlap for colors with NULL support if "-" is selected
function matchesNullableColors(selected, values) {
  if (!selected?.length) return true;

  const wantsNull = hasNullOption(selected);
  const wantsValues = selected.filter((x) => x !== "-");

  const hasColors = Array.isArray(values) && values.length > 0;
  if (wantsNull && !hasColors) return true;
  if (!wantsValues.length) return false;

  const set = new Set((values || []).map(toLower));
  return wantsValues.some((n) => set.has(toLower(n)));
}

// trim MAKE_ prefix from "MAKE_MODEL" for display
function trimModelName(model) {
  if (!model) return "";
  const s = String(model);
  const idx = s.indexOf("_");
  return idx === -1 ? s : s.slice(idx + 1);
}

// model filter: support "-" (NULL), otherwise contains or trimmed equality against MAKE_MODEL
function matchesNullableModel(selectedModels, storedModel) {
  if (!selectedModels?.length) return true;

  const wantsNull = hasNullOption(selectedModels);
  if (wantsNull && isNullish(storedModel)) return true;

  const nonNullSelections = selectedModels.filter((x) => x !== "-");
  if (!nonNullSelections.length) return false;

  const raw = String(storedModel || "");
  const rawL = raw.toLowerCase();
  const trimmedL = trimModelName(raw).toLowerCase();

  return nonNullSelections.some((sel) => {
    const s = toLower(sel);
    return rawL.includes(s) || trimmedL === s;
  });
}

// render "label (conf)" with rules:
// - if value is null or empty: print "-" and do not print conf
// - if conf < 0.5: gray out both label and conf
function renderLabelWithConf(label, conf) {
  const hasLabel = !isNullish(label);
  if (!hasLabel) return <span>-</span>;

  const low = typeof conf === "number" && conf < 0.5;

  return (
    <span className={low ? "text-neutral-700" : undefined}>
      {label}{" "}
      {typeof conf === "number" ? (
        <span className={`text-[10px] ${low ? "text-neutral-600" : "text-neutral-400"}`}>
          ({p(conf)})
        </span>
      ) : null}
    </span>
  );
}

// derive a list row summary from a full show payload
function summarize(d) {
  const b = d?.results?.baseline || null;
  const c = d?.results?.cmt || null;

  const bAnn = b?.assets?.annotated_url || b?.annotated_image?.url || null;
  const cAnn = c?.assets?.annotated_url || c?.annotated_image?.url || null;
  const snapshot = bAnn || cAnn || d?.input_image?.url || null;

  const type = b?.type || c?.type || null;
  const make = b?.make || c?.make || null;
  const model = b?.model || c?.model || null;

  const rawColors = (b?.colors?.length ? b.colors : (c?.colors || [])) || [];
  const colors = rawColors
    .map((col) => (typeof col === "string" ? col : col?.base))
    .filter(Boolean);

  const status = d?.status || "uploaded";

  return {
    snapshot,
    status,
    type,
    make,
    model,
    colors,
    b,
    c,
  };
}

/* ───────────────────────────────────────────────────────────────
   Main component
   ─────────────────────────────────────────────────────────────── */
export default function ImageAnalysisTable({ workspaceId: wid }) {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);

  // filters (auto-apply)
  const [selected, setSelected] = useState({
    type: [],
    color: [],
    make: [],
    model: [],
    plate: "",
  });

  const [all, setAll] = useState([]); // list endpoint result (parents only)
  const [enriched, setEnriched] = useState({}); // id -> summary from iaShow
  const [loading, setLoading] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);

  // paging (client-side over the fetched list)
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // details dialog
  const [openId, setOpenId] = useState(null);

  // fetch a larger list so client-side paging works
  const LIST_LIMIT = 500;

  // Single refetch function (mount and custom events)
  const refetch = useCallback(
    async () => {
      if (!wid) return;
      setLoading(true);
      try {
        const list = await iaList(wid, { limit: LIST_LIMIT, offset: 0 });
        const rows = Array.isArray(list) ? list : list?.items || [];
        setAll(rows);

        const start = (page - 1) * itemsPerPage;
        const chunk = rows.slice(start, start + Math.max(itemsPerPage, 30));
        for (const r of chunk) {
          if (enriched[r.id]) continue;
          try {
            const d = await iaShow(wid, r.id);
            setEnriched((m) => ({ ...m, [r.id]: summarize(d) }));
          } catch {
            // ignore enrich errors per row
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [wid, page, itemsPerPage, enriched]
  );

  // Initial load
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for uploads finishing (from the upload dialog) and re-fetch
  useEffect(() => {
    if (!wid) return;

    const onRefresh = (e) => {
      const targetWid = e?.detail?.wid;
      if (targetWid && targetWid !== wid) return;
      refetch();
    };

    window.addEventListener("ia:refresh", onRefresh);
    return () => window.removeEventListener("ia:refresh", onRefresh);
  }, [wid, refetch]);

  // lazy enrich on page change
  useEffect(() => {
    let cancel = false;

    (async () => {
      const start = (page - 1) * itemsPerPage;
      const chunk = all.slice(start, start + itemsPerPage);
      for (const r of chunk) {
        if (cancel) break;
        if (enriched[r.id]) continue;
        try {
          const d = await iaShow(wid, r.id);
          if (!cancel) {
            setEnriched((m) => ({ ...m, [r.id]: summarize(d) }));
          }
        } catch {
          // ignore per-row failure
        }
      }
    })();

    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, all, wid]);

  // reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [selected.type, selected.color, selected.make, selected.model, selected.plate]);

  // filtered rows (auto-applies as you toggle)
  const filtered = useMemo(() => {
    return all.filter((row) => {
      const s = enriched[row.id] || {};

      if (!matchesNullableExact(selected.type, s.type)) return false;
      if (!matchesNullableExact(selected.make, s.make)) return false;
      if (!matchesNullableModel(selected.model, s.model)) return false;
      if (!matchesNullableColors(selected.color, s.colors)) return false;

      const plate = s?.b?.plate_text || s?.c?.plate_text || "";
      if (selected.plate && !toLower(plate).includes(toLower(selected.plate))) return false;

      return true;
    });
  }, [all, enriched, selected]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  const pageItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page, itemsPerPage]);

  // Filter dropdown renderer
  const renderSelect = (label, key) => (
    <Popover key={key}>
      <PopoverTrigger asChild>
        <button
          className="w-full h-12 p-2 px-4 rounded-md border border-neutral-700 bg-neutral-900 flex items-center justify-between text-sm text-white hover:bg-neutral-800"
          type="button"
        >
          {selected[key].length > 0 ? (
            <span>
              {selected[key].slice(0, 2).join(", ")}
              {selected[key].length > 2 && ` +${selected[key].length - 2}`}
            </span>
          ) : (
            <span>Select {label}</span>
          )}
          <ChevronDown size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-neutral-900 border border-neutral-700">
        <Command>
          <CommandInput placeholder={`Search ${label}`} className="text-white" />
          <CommandList>
            {(options[key] || []).map((opt) => (
              <CommandItem
                key={opt}
                onSelect={() =>
                  setSelected((prev) => {
                    const hit = prev[key].includes(opt);
                    return {
                      ...prev,
                      [key]: hit ? prev[key].filter((x) => x !== opt) : [...prev[key], opt],
                    };
                  })
                }
                className="text-sm cursor-pointer"
              >
                {opt}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  // Clear all filters
  const clearFilters = () => {
    setSelected({ type: [], color: [], make: [], model: [], plate: "" });
    setPage(1);
  };

  // CSV export handler using filtered rows and Baseline plus CMT summaries
  const handleDownloadCsv = useCallback(
    async () => {
      if (csvExporting) return;

      if (!filtered.length) {
        toast("No records to export", {
          description: "Adjust filters or refresh data, then try again.",
        });
        return;
      }

      try {
        setCsvExporting(true);

        // ensure we have full summaries for all filtered rows
        const summaryById = { ...enriched };

        const missingIds =
          wid && filtered.length
            ? filtered
                .filter((row) => !summaryById[row.id])
                .map((row) => row.id)
            : [];

        if (wid && missingIds.length) {
          await Promise.all(
            missingIds.map(async (id) => {
              try {
                const d = await iaShow(wid, id);
                summaryById[id] = summarize(d);
              } catch (err) {
                console.warn("[ImageAnalysisTable] CSV enrich failed for analysis", id, err);
              }
            })
          );
          setEnriched(summaryById);
        }

        const headers = [
          "id",
          "analysis_no",
          "created_at",
          "analysis_status",

          "baseline_type",
          "baseline_type_conf",
          "baseline_make",
          "baseline_make_conf",
          "baseline_model",
          "baseline_model_conf",
          "baseline_colors",
          "baseline_plate_text",
          "baseline_plate_conf",
          "baseline_latency_ms",
          "baseline_memory_gb",
          "baseline_gflops",
          "baseline_status",
          "baseline_parts",

          "cmt_type",
          "cmt_type_conf",
          "cmt_make",
          "cmt_make_conf",
          "cmt_model",
          "cmt_model_conf",
          "cmt_colors",
          "cmt_plate_text",
          "cmt_plate_conf",
          "cmt_latency_ms",
          "cmt_memory_gb",
          "cmt_gflops",
          "cmt_status",
          "cmt_parts",
        ];

        const escapeCsv = (value) => {
          if (value === null || value === undefined) return "";
          const s =
            typeof value === "string"
              ? value
              : value instanceof Date
              ? value.toISOString()
              : String(value);
          const escaped = s.replace(/"/g, '""');
          return `"${escaped}"`;
        };

        const rows = filtered.map((row) => {
          const s = summaryById[row.id] || {};
          const b = s.b || {};
          const c = s.c || {};

          const baselineColors = Array.isArray(b.colors) ? b.colors : [];
          const cmtColors = Array.isArray(c.colors) ? c.colors : [];

          const baselineParts = Array.isArray(b.parts) ? b.parts : [];
          const cmtParts = Array.isArray(c.parts) ? c.parts : [];

          const data = [
            row.id,
            row.analysis_no,
            row.created_at || row.createdAt || null,
            row.status || s.status || null,

            b.type || null,
            b.type_conf ?? null,
            b.make || null,
            b.make_conf ?? null,
            b.model || null,
            b.model_conf ?? null,
            baselineColors.length ? JSON.stringify(baselineColors) : "[]",
            b.plate_text || null,
            b.plate_conf ?? null,
            b.latency_ms ?? null,
            b.memory_gb ?? null,
            b.gflops ?? null,
            b.status || null,
            baselineParts.length ? JSON.stringify(baselineParts) : "[]",

            c.type || null,
            c.type_conf ?? null,
            c.make || null,
            c.make_conf ?? null,
            c.model || null,
            c.model_conf ?? null,
            cmtColors.length ? JSON.stringify(cmtColors) : "[]",
            c.plate_text || null,
            c.plate_conf ?? null,
            c.latency_ms ?? null,
            c.memory_gb ?? null,
            c.gflops ?? null,
            c.status || null,
            cmtParts.length ? JSON.stringify(cmtParts) : "[]",
          ];

          return data.map(escapeCsv).join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\r\n");

        if (typeof window === "undefined") {
          console.warn("[ImageAnalysisTable] CSV download invoked on server; aborting.");
          return;
        }

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);

        const workspaceCodeRaw =
          (currentWorkspace &&
            (currentWorkspace.code ||
              currentWorkspace.workspaceCode ||
              currentWorkspace.slug ||
              currentWorkspace.name)) ||
          wid;

        const workspaceCodeSafe = String(workspaceCodeRaw || "WORKSPACE")
          .toUpperCase()
          .replace(/[^A-Z0-9_-]/g, "");

        const timestamp = new Date()
          .toISOString()
          .replace(/:/g, "-")
          .replace(/\.\d+Z$/, "Z");

        const filename = `CVITX_${workspaceCodeSafe}_ImageAnalysis_${timestamp}.csv`;

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast("CSV ready", {
          description: `Exported ${filtered.length} analysis record(s).`,
        });
      } catch (err) {
        console.error("ImageAnalysisTable CSV export error:", err);
        toast("Failed to export CSV", {
          description:
            err && typeof err.message === "string"
              ? err.message
              : "An unexpected error occurred while preparing the CSV.",
        });
      } finally {
        setCsvExporting(false);
      }
    },
    [csvExporting, filtered, wid, enriched, currentWorkspace]
  );

  return (
    <div className="w-full">
      {/* Filters row: 5 inputs + Clear + CSV */}
      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_auto_auto] gap-4 w-full mb-6 items-stretch">
        {renderSelect("Vehicle Type", "type")}
        {renderSelect("Color", "color")}
        {renderSelect("Make", "make")}
        {renderSelect("Model", "model")}
        <Input
          type="text"
          placeholder="Plate Number"
          className="w-full h-12 text-sm text-white bg-neutral-900 border border-neutral-700 placeholder:text-neutral-400"
          value={selected.plate}
          onChange={(e) => setSelected((prev) => ({ ...prev, plate: e.target.value }))}
        />
        <Button
          variant="outline"
          className="h-12 px-4 text-sm rounded-md border-neutral-700 whitespace-nowrap"
          onClick={clearFilters}
          title="Clear all filters"
          type="button"
        >
          Clear
        </Button>
        <Button
          type="button"
          onClick={handleDownloadCsv}
          disabled={csvExporting || !filtered.length}
          className={[
            "h-12 px-4 text-sm gap-2 bg-neutral-950 border-[1px] border-neutral-700 text-white rounded-md flex flex-row items-center justify-center whitespace-nowrap",
            csvExporting || !filtered.length ? "opacity-70 cursor-not-allowed" : "hover:bg-orange-500",
          ].join(" ")}
        >
          {csvExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download size={14} />
          )}
          CSV
        </Button>
      </div>

      {/* Table */}
      <div className="w-full border border-neutral-800 rounded-lg overflow-hidden">
        <Table className="border-spacing-x-4 border-spacing-y-0 [&_th]:px-2 [&_td]:px-2">
          <TableHeader className="bg-neutral-900 border-b border-neutral-800">
            <TableRow>
              <TableHead className="text-white">ID</TableHead>
              <TableHead className="text-white">Snapshot</TableHead>
              <TableHead className="text-white">Color</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Make</TableHead>
              <TableHead className="text-white">Model</TableHead>
              <TableHead className="text-white">Plate</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-center text-white">View</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && all.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-xs text-neutral-400 py-8 text-center">
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Loading analysis
                </TableCell>
              </TableRow>
            )}

            {!loading && total === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-xs text-neutral-400 py-8 text-center">
                  No matching analysis.
                </TableCell>
              </TableRow>
            )}

            {pageItems.map((row) => {
              const s = enriched[row.id] || {};
              const plate = s?.b?.plate_text || s?.c?.plate_text || "-";
              const colorBase = (s.colors && s.colors.length > 0 ? s.colors[0] : "-") || "-";

              const typeConf = s?.b?.type_conf ?? s?.c?.type_conf;
              const makeConf = s?.b?.make_conf ?? s?.c?.make_conf;
              const modelConf = s?.b?.model_conf ?? s?.c?.model_conf;

              const modelDisplay = s.model ? trimModelName(s.model) : null;

              return (
                <TableRow key={row.id} className="hover:bg-neutral-800 relative">
                  {/* ID */}
                  <TableCell className="text-xs font-mono">#{row.analysis_no}</TableCell>

                  {/* Snapshot triggers details dialog */}
                  <TableCell>
                    <Dialog
                      open={openId === row.id}
                      onOpenChange={(o) => setOpenId(o ? row.id : null)}
                    >
                      <DialogTrigger asChild>
                        <div
                          className="h-16 w-24 border border-neutral-800 rounded-sm overflow-hidden cursor-pointer"
                          title="View analysis details"
                        >
                          {s.snapshot ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="h-full w-full object-cover" src={s.snapshot} alt="" />
                          ) : (
                            <div className="h-full w-full bg-neutral-900" />
                          )}
                        </div>
                      </DialogTrigger>

                      <ImageAnalysisDetailsDialog
                        workspaceId={wid}
                        analysisId={row.id}
                        open={openId === row.id}
                        onClose={() => setOpenId(null)}
                      />
                    </Dialog>
                  </TableCell>

                  {/* Color */}
                  <TableCell className="text-xs">
                    {String(colorBase || "-").toUpperCase()}
                  </TableCell>

                  {/* Type and Make with conf styling */}
                  <TableCell className="text-xs">
                    {renderLabelWithConf(s.type, typeConf)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {renderLabelWithConf(s.make, makeConf)}
                  </TableCell>

                  {/* Model with trimmed display and conf rules */}
                  <TableCell className="text-xs">
                    {renderLabelWithConf(modelDisplay, modelConf)}
                  </TableCell>

                  {/* Plate */}
                  <TableCell className="text-xs">{plate}</TableCell>

                  {/* Status */}
                  <TableCell className="text-xs">
                    <Badge variant="secondary">{row.status || s.status || "-"}</Badge>
                  </TableCell>

                  {/* View icon */}
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md hover:bg-neutral-700"
                      title="View details"
                      type="button"
                      onClick={() => setOpenId(row.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-end p-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="text-white"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                />
              </PaginationItem>
              <PaginationItem>
                <div className="text-sm text-neutral-400 px-2 pt-1">
                  Page {page} of {totalPages}
                </div>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  className="text-white"
                  onClick={() =>
                    setPage((prev) => (prev < totalPages ? prev + 1 : prev))
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
