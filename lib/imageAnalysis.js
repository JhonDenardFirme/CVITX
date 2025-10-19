// Revert this line later to go back to real API calls.
//export * from "./detections.mock";



// lib/imageAnalysis.js
const BASE = "/api";



async function j(res) { const t = await res.text(); try { return JSON.parse(t); } catch { return t; } }
async function req(path, init = {}) {
  const r = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  if (!r.ok) throw new Error(await r.text());
  return j(r);
}

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

export async function iaShow(wid, analysisId) {
  return req(`/workspaces/${wid}/image-analysis/${analysisId}`);
}

export async function iaList(wid) {
  return req(`/workspaces/${wid}/image-analysis`);
}

export async function putToS3(url, file) {
  const r = await fetch(url, { method: "PUT", headers: { "content-type": file.type }, body: file });
  if (!r.ok) throw new Error(`S3 PUT failed: ${r.status}`);
}


// lib/imageAnalysis.js (ensure this exists)
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
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 PUT failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("S3 PUT network error"));
    xhr.send(file);
  });
}


