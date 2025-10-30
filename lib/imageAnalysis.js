// lib/imageAnalysis.js

// ─────────────────────────────────────────────────────────────────────────────
// Toggle: mock ↔ live
// To use MOCK data, uncomment the next line and comment out the live section.
// export * from "./detections.mock";
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "/api"; // uses your Next route proxies

async function parse(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function req(path, init = {}) {
  const r = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  if (!r.ok) throw new Error(await r.text());
  return parse(r);
}

// NOTE: backend route is plural: image-analyses (proxy maps this correctly)
// Always request presigned assets to avoid 401/403 image fetches after expiry.

export async function iaPresign(wid, { filename, content_type, title, description }) {
  return req(`/workspaces/${wid}/image-analysis/presign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename, content_type, title, description }),
  });
}

export async function iaCommit(wid, { key, content_type, size_bytes, title, description }) {
  return req(`/workspaces/${wid}/image-analysis/commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, content_type, size_bytes, title, description }),
  });
}

export async function iaEnqueue(wid, analysisId) {
  return req(`/workspaces/${wid}/image-analysis/${analysisId}/enqueue`, { method: "POST" });
}

// Uses wid-agnostic proxy pass-through with presign TTL for image artifacts
export async function iaShow(_wid, analysisId, { ttl = 900 } = {}) {
  // Proxy ignores wid param here; _ is intentional.
  return req(`/workspaces/_/image-analysis/${analysisId}?presign=1&ttl=${ttl}`);
}

export async function iaList(wid, { limit = 20, offset = 0 } = {}) {
  return req(`/workspaces/${wid}/image-analysis?limit=${limit}&offset=${offset}`);
}

export async function putToS3(url, file) {
  const r = await fetch(url, { method: "PUT", headers: { "content-type": file.type }, body: file });
  if (!r.ok) throw new Error(`S3 PUT failed: ${r.status}`);
}

// Progress-enabled S3 PUT (XHR to track upload percentage)
export function putToS3WithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
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
