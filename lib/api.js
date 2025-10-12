// lib/api.js — browser → Next API (not the backend directly)

async function api(path, init) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

/* ---------- Workspaces ---------- */

export async function listWorkspaces() {
  return api("/api/workspaces");
}

export async function createWorkspace({ code, title, description }) {
  return api("/api/workspaces", {
    method: "POST",
    body: JSON.stringify({ code, title, description }),
  });
}

export async function getWorkspace(workspaceId) {
  return api(`/api/workspaces/${workspaceId}`);
}

export async function updateWorkspace(workspaceId, patch) {
  // patch: { title?, description? }
  return api(`/api/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteWorkspace(workspaceId) {
  return api(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
}

/* ---------- Workspace files ---------- */

export async function presignWorkspaceFile(workspaceId, { filename, content_type }) {
  return api(`/api/workspaces/${workspaceId}/files/presign`, {
    method: "POST",
    body: JSON.stringify({ filename, content_type }),
  });
}

// Put directly to S3 with the returned presigned URL
export async function putToS3(presignedUrl, file, contentType) {
  const r = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
  if (!r.ok) throw new Error(`S3 PUT failed: ${r.status}`);
}

export async function commitWorkspaceFile(workspaceId, { key, content_type, size_bytes }) {
  const qs = new URLSearchParams({
    key,
    ...(content_type ? { content_type } : {}),
    ...(size_bytes ? { size_bytes: String(size_bytes) } : {}),
  }).toString();
  return api(`/api/workspaces/${workspaceId}/files/commit?${qs}`, { method: "POST" });
}

export async function listWorkspaceFiles(workspaceId) {
  return api(`/api/workspaces/${workspaceId}/files`);
}

export async function getWorkspaceFileUrl(workspaceId, fileId, download = false) {
  const url = `/api/workspaces/${workspaceId}/files/${fileId}/url${download ? "?download=1" : ""}`;
  return api(url);
}

export async function deleteWorkspaceFile(workspaceId, fileId) {
  return api(`/api/workspaces/${workspaceId}/files/${fileId}`, { method: "DELETE" });
}
