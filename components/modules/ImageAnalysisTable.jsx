"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";

import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationPrevious, PaginationNext,
} from "@/components/ui/pagination";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import {
  Command, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Loader2, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  vehicleTypes, vehicleColors, allVehicleMakes, allVehicleModels,
} from "@/lib/constants";

import {
  iaList, iaShow, iaEnqueue,
} from "@/lib/imageAnalysis";

import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import ImageAnalysisDetailsDialog from "./ImageAnalysisDetailsDialog";

const options = {
  type: vehicleTypes,
  color: vehicleColors,
  make: allVehicleMakes,
  model: allVehicleModels,
};

// percentage helper
const p = (x) => (typeof x === "number" ? `${Math.round(x * 100)}%` : "—");

// derive a list row summary from a full show payload
function summarize(d) {
  const b = d?.results?.baseline || null;
  const c = d?.results?.cmt || null;

  // prefer Baseline snapshot if annotated exists, else CMT, else original
  const snapshot =
    b?.annotated_image?.url ||
    c?.annotated_image?.url ||
    d?.input_image?.url ||
    null;

  // choose single-line identity for table from either variant
  const type = b?.type || c?.type || null;
  const make = b?.make || c?.make || null;
  const model = b?.model || c?.model || null;

  // COLORS → keep only the "base" string; if absent, drop
  // Accepts arrays of either primitives or { finish, base, lightness, conf }
  const rawColors = (b?.colors?.length ? b.colors : (c?.colors || [])) || [];
  const colors = rawColors
    .map((col) => (typeof col === "string" ? col : col?.base))
    .filter(Boolean);

  // a status hint (done/error/processing/etc)
  const status = d?.status || "uploaded";

  return {
    snapshot,
    status,
    type, make, model, colors,
    b, c,
  };
}

export default function ImageAnalysisTable({ workspaceId: wid }) {
  // filters like IndexingRecords
  const [selected, setSelected] = useState({
    type: [], color: [], make: [], model: [], plate: "",
  });

  const [all, setAll] = useState([]);          // list endpoint result (parents only)
  const [enriched, setEnriched] = useState({}); // id -> summary from iaShow
  const [loading, setLoading] = useState(false);

  // paging
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // details dialog
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!wid) return;
      setLoading(true);
      try {
        const list = await iaList(wid);
        const rows = Array.isArray(list) ? list : (list?.items || []);
        if (!ignore) setAll(rows);

        // lazily enrich visible chunk for badges & snapshot
        const first = rows.slice(0, 30);
        for (const r of first) {
          try {
            const d = await iaShow(wid, r.id);
            if (!ignore) setEnriched((m) => ({ ...m, [r.id]: summarize(d) }));
          } catch {}
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [wid]);

  // re-enrich when moving pages (lazy)
  useEffect(() => {
    let ignore = false;
    (async () => {
      const start = (page - 1) * itemsPerPage;
      const chunk = all.slice(start, start + itemsPerPage);
      for (const r of chunk) {
        if (enriched[r.id]) continue;
        try {
          const d = await iaShow(wid, r.id);
          if (!ignore) setEnriched((m) => ({ ...m, [r.id]: summarize(d) }));
        } catch {}
      }
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, all, wid]);

  // filters
  const toLower = (v) => String(v || "").toLowerCase();
  const anyIn = (arr, val) => !arr.length || arr.some((n) => toLower(n) === toLower(val));
  const anyOverlap = (arr, vals) => {
    if (!arr.length) return true;
    const set = new Set((vals || []).map(toLower));
    return arr.some((n) => set.has(toLower(n)));
  };

  useEffect(() => { setPage(1); }, [selected.type, selected.color, selected.make, selected.model, selected.plate]);

  const filtered = useMemo(() => {
    return all.filter((row) => {
      const s = enriched[row.id] || {};
      if (!anyIn(selected.type, s.type)) return false;
      if (!anyIn(selected.make, s.make)) return false;
      if (!anyIn(selected.model, s.model)) return false;
      if (!anyOverlap(selected.color, s.colors)) return false;

      // plate filter (if present in either variant)
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
  }, [filtered, page]);

  const renderSelect = (label, key) => (
    <Popover key={key}>
      <PopoverTrigger asChild>
        <button className="w-full h-12 p-2 px-4 rounded-md border border-neutral-700 bg-neutral-900 flex items-center justify-between text-sm text-white hover:bg-neutral-800">
          {selected[key].length > 0 ? (
            <span>
              {selected[key].slice(0, 2).join(", ")}
              {selected[key].length > 2 && ` +${selected[key].length - 2}`}
            </span>
          ) : <span>Select {label}</span>}
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
                    return { ...prev, [key]: hit ? prev[key].filter((x) => x !== opt) : [...prev[key], opt] };
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

  return (
    <div className="w-full">
      {/* Filters row (matches IndexingRecords layout) */}
      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_auto] gap-4 w-full mb-6">
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
        <Button className="bg-orange-500 h-12 hover:bg-orange-400 text-white px-6 py-2 text-sm rounded-md" onClick={() => setPage(1)}>
          Submit
        </Button>
      </div>

      {/* Table */}
      <div className="w-full mt-8 border border-neutral-800 rounded-lg overflow-hidden">
        <Table className="border-spacing-x-4 border-spacing-y-0 [&_th]:px-2 [&_td]:px-2">
          <TableHeader className="bg-neutral-900 border-b border-neutral-800">
            <TableRow>
              <TableHead className="text-white">ID</TableHead>
              <TableHead className="text-white">Snapshot</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Color</TableHead>
              <TableHead className="text-white">Make</TableHead>
              <TableHead className="text-white">Model</TableHead>
              <TableHead className="text-white">Plate</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-center text-white ml-2">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && all.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-xs text-neutral-400 py-8 text-center">
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Loading analysis…
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
              // base-only color (first item) or "-"
              const colorBase = (s.colors && s.colors.length > 0 ? s.colors[0] : "-") || "-";
              const plate = s?.b?.plate_text || s?.c?.plate_text || "-";

              return (
                <TableRow key={row.id} className="hover:bg-neutral-800 relative">
                  <TableCell className="text-xs font-mono">#{row.analysis_no}</TableCell>

                  {/* Snapshot triggers details dialog */}
                  <TableCell>
                    <Dialog open={openId === row.id} onOpenChange={(o) => setOpenId(o ? row.id : null)}>
                      <DialogTrigger asChild>
                        <div
                          className="h-16 w-24 border border-neutral-800 rounded-sm overflow-hidden cursor-pointer"
                          title="View analysis details"
                        >
                          {s.snapshot ? (
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

                  <TableCell className="text-xs">
                    {s.type || "-"} {s.b?.type_conf || s.c?.type_conf ? <span className="text-[10px] text-neutral-400">({p(s.b?.type_conf ?? s.c?.type_conf)})</span> : null}
                  </TableCell>
                  <TableCell className="text-xs">{String(colorBase).toUpperCase()}</TableCell>
                  <TableCell className="text-xs">
                    {s.make || "-"} {s.b?.make_conf || s.c?.make_conf ? <span className="text-[10px] text-neutral-400">({p(s.b?.make_conf ?? s.c?.make_conf)})</span> : null}
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.model || "-"} {s.b?.model_conf || s.c?.model_conf ? <span className="text-[10px] text-neutral-400">({p(s.b?.model_conf ?? s.c?.model_conf)})</span> : null}
                  </TableCell>

                  <TableCell className="text-xs">{plate}</TableCell>

                  <TableCell className="text-xs">
                    <Badge variant="secondary">{row.status || s.status || "-"}</Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md hover:bg-neutral-700"
                      title="Re-run analysis"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await iaEnqueue(wid, row.id);
                          // Optimistic status flip
                          setAll((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: "queued" } : x)));
                        } catch {}
                      }}
                    >
                      <Repeat className="h-4 w-4" />
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
                <PaginationPrevious className="text-white" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} />
              </PaginationItem>
              <PaginationItem>
                <div className="text-sm text-neutral-400 px-2 pt-1">Page {page} of {totalPages}</div>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext className="text-white" onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
