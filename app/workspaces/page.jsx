"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EvervaultCard, Icon } from "@/components/ui/evervault-card";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import NavbarLoggedIn from "@/components/NavbarLoggedIn";

const MAX_SLOTS = 3;

/* --- NEW: sorting helpers (ascending by CTX number) --- */
function codeNumber(code) {
  if (!code) return Number.POSITIVE_INFINITY;
  const m = String(code).match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.POSITIVE_INFINITY;
}
function sortByCodeAsc(list) {
  return [...list].sort((a, b) => {
    const na = codeNumber(a.code);
    const nb = codeNumber(b.code);
    if (na !== nb) return na - nb;
    // fallback to string compare if needed
    return String(a.code || "").localeCompare(String(b.code || ""));
  });
}

export default function WorkspacesPage() {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]); // [{id, code, title, description, created_at}]
  const [err, setErr] = useState(null);

  // Load my workspaces
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/workspaces", { cache: "no-store" });
        if (!res.ok) throw new Error(await safeError(res));
        const data = await res.json();
        const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        const normalized = arr.map((x) => ({
          id: x.id,
          code: x.code ?? null, // CTX#### from backend
          title: x.title ?? null,
          description: x.description ?? null,
          created_at: x.created_at ?? null,
        }));
        const sorted = sortByCodeAsc(normalized);
        if (!ignore) setWorkspaces(sorted.slice(0, MAX_SLOTS));
      } catch (e) {
        if (!ignore) setErr(String(e?.message || e || "Failed to load workspaces"));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Always render exactly 3 slots
  const slots = useMemo(() => {
    const base = [...workspaces];
    while (base.length < MAX_SLOTS) base.push(null);
    return base.slice(0, MAX_SLOTS);
  }, [workspaces]);

  // --- Mutations (Next -> Backend via proxy) ---

  // CREATE sends only { title?, description? } — backend generates CTX#### code
  const createWorkspace = async ({ title, description }) => {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) {
      const msg = await safeError(res);
      if (res.status === 409) {
        throw new Error(msg || "You’ve reached the maximum of 3 active workspaces. Delete one to create a new one.");
      }
      throw new Error(msg || "Failed to create workspace");
    }
    const created = await res.json(); // { id, code: "CTX####", title, description, created_at }
    setWorkspaces((w) => sortByCodeAsc([created, ...w]).slice(0, MAX_SLOTS)); // <-- keep sorted
    return created;
  };

  const updateWorkspace = async (id, patch) => {
    const res = await fetch(`/api/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch), // { title?, description? }
    });
    if (!res.ok) {
      const msg = await safeError(res);
      throw new Error(msg || "Failed to update workspace");
    }
    const updated = await res.json();
    setWorkspaces((w) =>
      sortByCodeAsc(w.map((x) => (x.id === id ? { ...x, ...updated } : x))) // <-- keep sorted
    );
    return updated;
  };

  const deleteWorkspace = async (id) => {
    const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const msg = await safeError(res);
      throw new Error(msg || "Failed to delete workspace");
    }
    setWorkspaces((w) => sortByCodeAsc(w.filter((x) => x.id !== id))); // <-- keep sorted
  };

  if (loading) return <div className="p-8">Loading…</div>;
  if (err) return <div className="p-8 text-red-500">{err}</div>;

  return (
    <div className="w-full h-screen px-32 pb-16 flex flex-col justify-between items-center bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/Banner.png')" }}>
      <NavbarLoggedIn />
      <div className="text-center h-auto pb-4">
        <p className="text-6xl font-bold text-white">Workspaces</p>
        <p className="text-sm text-gray-300">
          Create or Choose a Workspace to Work On. Workspaces correspond to individual cases.
        </p>
      </div>

      <div className="w-full h-auto grid grid-cols-3 gap-8">
        {slots.map((ws, idx) =>
          ws ? (
            <WorkspaceCard
              key={ws.id || idx}
              ws={ws}
              onSave={(patch) => updateWorkspace(ws.id, patch)}
              onDelete={() => deleteWorkspace(ws.id)}
            />
          ) : (
            <CreateCard
              key={`empty-${idx}`}
              disabled={workspaces.length >= MAX_SLOTS}
              onCreate={createWorkspace}
            />
          )
        )}
      </div>
    </div>
  );
}

/* ---------- Active workspace card ---------- */
function WorkspaceCard({ ws, onSave, onDelete }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(ws.title || "");
  const [description, setDescription] = useState(ws.description || "");
  const [confirm, setConfirm] = useState("");

  const routeId = ws.id; // UUID path
  const confirmTarget = (ws.code || ws.id || "").trim();
  const canDelete = confirm.trim() === confirmTarget;

  return (
    <div className="border border-black/[0.2] dark:border-white/[0.2] flex flex-col items-start max-w-sm mx-auto p-4 relative h-[30rem]">
      {/* corners */}
      <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

      {/* Card CTA: show CTX code from ws.code */}
      <Link href={`/w/${routeId}/image-analysis`} className="w-full h-full">
        <EvervaultCard text={ws.code || String(ws.id).slice(0, 8).toUpperCase()} />
      </Link>

      {/* Title + Description */}
      <div className="w-full h-auto flex flex-col justify-center items-center">
        <h2 className="dark:text-white text-black mt-4 text-base font-medium text-center">
          {ws.title || "—"}
        </h2>
        <p className="text-xs border font-light dark:border-white/[0.2] border-black/[0.2] rounded-full mt-1 text-black dark:text-white px-3 py-1 text-center">
          {ws.description || "—"}
        </p>
      </div>

      {/* Menu */}
      <div className="absolute top-4 right-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div className="p-1 rounded-sm border-[1px] border-neutral-700 hover:cursor-pointer">
              <EllipsisVertical size={12} />
            </div>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Edit Workspace Details</DialogTitle>
              <DialogDescription>Update title or description. Code is system-generated.</DialogDescription>
            </DialogHeader>

            {/* Edit form */}
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="title">Workspace Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <DialogFooter className="justify-between gap-2 sm:justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={async () => {
                  try {
                    await onSave({ title, description });
                    setOpen(false);
                  } catch (e) {
                    alert(String(e?.message || e || "Failed to save changes"));
                  }
                }}
              >
                Save changes
              </Button>
            </DialogFooter>

            {/* Danger zone */}
            <div className="mt-6 border-t border-neutral-800 pt-4">
              <p className="text-sm font-medium text-red-400 mb-2">Danger Zone</p>
              <p className="text-xs text-neutral-400 mb-3">
                To permanently delete this workspace, type{" "}
                <span className="font-semibold text-neutral-200">{confirmTarget}</span> below.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={`Type ${confirmTarget}`}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <Button
                  variant="destructive"
                  disabled={!canDelete}
                  onClick={async () => {
                    try {
                      await onDelete();
                      setOpen(false);
                    } catch (e) {
                      alert(String(e?.message || e || "Failed to delete workspace"));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

/* ---------- Empty slot / create card ---------- */
function CreateCard({ disabled, onCreate }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="border border-black/[0.2] dark:border-white/[0.2] flex flex-col items-start max-w-sm mx-auto p-4 relative h-[30rem]">
      {/* corners */}
      <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-black" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-black" />

      <Dialog open={open} onOpenChange={(o) => !creating && setOpen(o)}>
        <DialogTrigger asChild>
          <button
            disabled={disabled}
            className={cn("w-full h-full", disabled && "opacity-40 cursor-not-allowed")}
            title={disabled ? "Maximum of 3 workspaces" : "Create workspace"}
          >
            <EvervaultCard text="+" />
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Code will be generated automatically (e.g., <span className="font-mono">CTX1001</span>).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="title-new">Workspace Title</Label>
              <Input
                id="title-new"
                placeholder="Case 206 – …"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="desc-new">Description</Label>
              <Input
                id="desc-new"
                placeholder="Short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="justify-between gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline" disabled={creating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={async () => {
                try {
                  setCreating(true);
                  await onCreate({
                    title: title.trim() || null,
                    description: description.trim() || null,
                  });
                  setTitle("");
                  setDescription("");
                  setOpen(false);
                } catch (e) {
                  alert(String(e?.message || e || "Failed to create workspace"));
                } finally {
                  setCreating(false);
                }
              }}
              disabled={creating || disabled}
            >
              {creating ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Placeholder under card to keep layout consistent */}
      <div className="w-full flex flex-col items-center justify-center">
        <h2 className="dark:text-white text-black mt-4 text-sm font-light">Create a Workspace</h2>
        <p className="text-sm border font-light dark:border-white/[0.2] border-black/[0.2] rounded-full mt-4 text-black dark:text-white px-2 py-0.5">
          -
        </p>
      </div>

      {/* Disabled menu for empty slot (visual parity) */}
      <div className="absolute top-4 right-4">
        <div className="p-1 rounded-sm border-[1px] border-neutral-800 opacity-40 pointer-events-none">
          <EllipsisVertical size={12} />
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
async function safeError(res) {
  try {
    const j = await res.json();
    if (j?.detail) return typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
  } catch { }
  try {
    return await res.text();
  } catch { }
  return "Request failed";
}
