"use client";

import React, { useState, useEffect } from "react";
import { HardDriveUpload, UploadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";

import { iaPresign, iaCommit, iaEnqueue, putToS3WithProgress } from "@/lib/imageAnalysis";
import { useAppStore } from "@/lib/store";
import { useParams } from "next/navigation";

export default function ImageAnalysisUploadCard({ workspaceId: widProp }) {
  const params = useParams();
  const widFromParams = params?.workspaceId;
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const wid = widProp || currentWorkspace?.id || widFromParams || null;

  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [uploading, setUploading] = useState(false);
  const [queue, setQueue] = useState([]); // [{name, step, progress, analysis_no, id, status, error}]

  useEffect(() => {
    if (!open) {
      // reset form when dialog closes
      setFiles([]);
      setTitle("");
      setDescription("");
      setQueue([]);
      setUploading(false);
    }
  }, [open]);

  async function processOne(file, idx) {
    const update = (patch) =>
      setQueue((q) => {
        const copy = [...q];
        copy[idx] = { ...(copy[idx] || {}), ...patch };
        return copy;
      });

    try {
      update({ name: file.name, status: "presigning", step: "Presigning…", progress: 0 });

      const pre = await iaPresign(wid, {
        filename: file.name,
        content_type: file.type || "image/jpeg",
        title: title || null,
        description: description || null,
      });

      update({ status: "uploading", step: "Uploading to S3…", progress: 1 });
      await putToS3WithProgress(pre.url, file, (p) => update({ progress: p }));

      update({ status: "committing", step: "Committing…", progress: 100 });
      const commit = await iaCommit(wid, {
        key: pre.key,
        content_type: file.type || "image/jpeg",
        size_bytes: file.size,
        title: title || null,
        description: description || null,
      });

      update({ status: "enqueuing", step: "Enqueuing Baseline & CMT…" });
      await iaEnqueue(wid, commit.id);

      update({ status: "queued", step: "Queued", id: commit.id, analysis_no: commit.analysis_no });
      toast(`Queued #${commit.analysis_no} — ${file.name}`);
    } catch (e) {
      update({ status: "error", step: "Error", error: e?.message || "Upload failed" });
      toast("Upload failed", { description: String(e?.message || "") });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!wid) return alert("Workspace is not set. Please reload the workspace page.");
    if (!files.length) return alert("Attach at least one image.");

    const bad = files.find(
      (f) => !(f.type?.startsWith("image/")) && !/\.(png|jpe?g|webp)$/i.test(f.name || "")
    );
    if (bad) return alert("Only PNG/JPG/WEBP images are allowed.");

    setUploading(true);
    setQueue(files.map((f) => ({ name: f.name, status: "waiting", step: "Waiting…", progress: 0 })));
    try {
      // SERIAL per workspace (important!)
      for (let i = 0; i < files.length; i++) {
        await processOne(files[i], i);
      }
      setOpen(false);
      toast("All uploads queued");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Evervault-ish header row (same vibe as FootageUpload) */}
      <div className="flex flex-row items-center mb-4 w-full justify-between">
        <div className="flex flex-row gap-4 items-center">
          <HardDriveUpload size={20} />
          <div className="h-6 w-[1px] border-[1px] border-neutral-800" />
          <p className="text-md">Image Analysis</p>
        </div>

        {/* Upload dialog trigger (same button) */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="text-sm px-4 py-2 gap-2 bg-orange-500 text-white rounded-md hover:bg-orange-400 flex flex-row items-center justify-center">
              <UploadIcon size={14} />
              Upload Images
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[720px] h-[80%] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Upload Images for Analysis</DialogTitle>
                <DialogDescription>
                  You can attach multiple images. They’ll be uploaded and enqueued **one by one** per workspace.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ia-title">Title (optional)</Label>
                  <Input
                    id="ia-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. West Gate vehicle set"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ia-desc">Description (optional)</Label>
                  <Input
                    id="ia-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description"
                  />
                </div>
              </div>

              {/* File Upload (multiple) */}
              <div className="grid gap-2">
                <Label>Images</Label>
                <div className="w-full min-h-40 border border-dashed bg-white/0 dark:bg-black border-neutral-700 rounded-lg">
                  <FileUpload
                    accept="image/png,image/jpeg,image/webp"
                    multiple={true}
                    maxFiles={20}
                    onChange={(incoming) => {
                      const arr = Array.isArray(incoming)
                        ? incoming
                        : incoming
                        ? [incoming]
                        : [];
                      const onlyImages = arr.filter(
                        (f) =>
                          f?.type?.startsWith("image/") ||
                          /\.(png|jpe?g|webp)$/i.test(f?.name || "")
                      );
                      setFiles(onlyImages);
                    }}
                  />
                </div>
                <p className="text-xs text-neutral-400">
                  PNG / JPG / WEBP. Files will be sent one-by-one and enqueued for Baseline & CMT.
                </p>
              </div>

              {/* Per-file progress list */}
              {queue.length > 0 && (
                <div className="rounded border border-neutral-800">
                  <div className="px-3 py-2 text-sm font-medium">Uploads</div>
                  <div className="divide-y divide-neutral-800">
                    {queue.map((q, i) => (
                      <div key={i} className="p-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm">{q.name}</div>
                          <div className="text-xs opacity-70">{q.step}</div>
                          {typeof q.progress === "number" && (
                            <div className="h-2 mt-1 bg-neutral-800 rounded overflow-hidden">
                              <div
                                className="h-full bg-orange-500"
                                style={{ width: `${Math.max(0, Math.min(q.progress, 100))}%` }}
                              />
                            </div>
                          )}
                          {q.error && <div className="text-xs text-red-500 mt-1">{q.error}</div>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs px-2 py-0.5 rounded bg-neutral-800">
                            {q.status}
                          </span>
                          {q.analysis_no && (
                            <span className="text-xs text-neutral-400">#{q.analysis_no}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button" disabled={uploading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={!wid || !files.length || uploading}>
                  {uploading ? "Uploading…" : "Save & Upload"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
