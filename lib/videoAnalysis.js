// lib/videoAnalysis.js
// Browser → Next routes (NOT directly to FastAPI). Mirrors your lib/imageAnalysis.js style.

const BASE = "/api";

async function parse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}
async function req(path, init = {}) {
  const r = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  if (!r.ok) throw new Error(await r.text());
  return parse(r);
}

/**
 * Presign a new video upload.
 * Body expects:
 * {
 *   filename, content_type, file_size_bytes,
 *   camera_code, camera_label?, frame_stride?, recorded_at?, workspace_code?
 * }
 */
export async function vaPresign(wid, body) {
  return req(`/workspaces/${wid}/videos/presign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Commit the uploaded S3 object into the DB's `videos` row. */
export async function vaCommit(wid, body) {
  return req(`/workspaces/${wid}/videos/commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Enqueue processing for a video (optional { variant: "cmt" }). */
export async function vaEnqueue(wid, videoId, body = { variant: "cmt" }) {
  return req(`/workspaces/${wid}/videos/${videoId}/enqueue`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Get high-level video detail + latest run summary. */
export async function vaShow(wid, videoId) {
  return req(`/workspaces/${wid}/videos/${videoId}`);
}

/** Update video metadata (e.g., { cameraLabel, recordedAt }). */
export async function vaUpdate(wid, videoId, patch) {
  return req(`/workspaces/${wid}/videos/${videoId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

/** Delete a video (requires { confirmCameraCode }). */
export async function vaDelete(wid, videoId, body) {
  return req(`/workspaces/${wid}/videos/${videoId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** List run containers for a video (usually one per variant). */
export async function vaRuns(wid, videoId) {
  return req(`/workspaces/${wid}/videos/${videoId}/analyses`);
}

/** Poll run progress; pass variant if needed (default backend = "cmt"). */
export async function vaProgress(wid, videoId, { variant } = {}) {
  const q = new URLSearchParams(variant ? { variant } : {}).toString();
  const suffix = q ? `?${q}` : "";
  return req(`/workspaces/${wid}/videos/${videoId}/progress${suffix}`);
}

/** List detections for the current run; supports { variant, runId }. */
export async function vaDetections(wid, videoId, { variant, runId } = {}) {
  const q = new URLSearchParams({
    ...(variant ? { variant } : {}),
    ...(runId ? { runId } : {}),
  }).toString();
  const suffix = q ? `?${q}` : "";
  return req(`/workspaces/${wid}/videos/${videoId}/detections${suffix}`);
}

/** Fetch one detection; set presign=1 to get signed image URLs. */
export async function vaDetection(wid, videoId, detectionId, { presign = 1, ttl = 900 } = {}) {
  const q = new URLSearchParams({ presign: String(presign), ttl: String(ttl) }).toString();
  return req(`/workspaces/${wid}/videos/${videoId}/detections/${detectionId}?${q}`);
}

/** Patch a detection with manual corrections (type/make/model/plate/colors). */
export async function vaDetectionUpdate(wid, videoId, detectionId, patch) {
  return req(`/workspaces/${wid}/videos/${videoId}/detections/${detectionId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

/** S3 PUT helpers (with and without progress), same pattern as imageAnalysis.js. */
export async function putToS3(url, file, contentType) {
  const r = await fetch(url, { method: "PUT", headers: { "content-type": contentType || file.type }, body: file });
  if (!r.ok) throw new Error(`S3 PUT failed: ${r.status}`);
}

export function putToS3WithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
      ? resolve()
      : reject(new Error(`S3 PUT failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("S3 PUT network error"));
    xhr.send(file);
  });
}
