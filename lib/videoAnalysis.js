// lib/videoAnalysis.js
// Browser → Next.js API routes (not directly to FastAPI).
// Mirrors the style of lib/imageAnalysis.js and keeps everything on the /api side.

const BASE = "/api"

/**
 * Parse a response body text into JSON when possible, otherwise return the raw text.
 */
function parseBody(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Low-level request helper:
 * - Prefixes all requests with /api so we always go through Next routes.
 * - Disables caching (cache: "no-store") for fresh status, progress, and detections.
 * - On non-OK, attempts to parse a structured error and throws an Error(message).
 * - On OK, returns parsed JSON (or plain text) via parseBody.
 */
async function req(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    ...init,
  })

  const text = await response.text()
  const data = text
    ? (() => {
        try {
          return JSON.parse(text)
        } catch {
          return null
        }
      })()
    : null

  if (!response.ok) {
    // Unified error decoding:
    // Prefer structured envelopes: { error: { message } } / { message } / { detail }
    let message = "Request failed"

    if (data && typeof data === "object") {
      message =
        (data.error && data.error.message) ||
        data.message ||
        data.detail ||
        text ||
        message
    } else if (text) {
      message = text
    }

    throw new Error(message)
  }

  return parseBody(text)
}

/**
 * Presign a new video upload.
 *
 * Body typically includes:
 * {
 *   filename: string,
 *   content_type: string,
 *   file_size_bytes?: number,
 *   camera_code: string,
 *   camera_label?: string,
 *   frame_stride?: number,
 *   recorded_at?: string,
 *   workspace_code?: string
 * }
 *
 * Next API route:
 *   POST /api/workspaces/{wid}/videos/presign
 *   -> FastAPI POST /workspaces/{wid}/videos/presign
 */
export async function vaPresign(wid, body) {
  return req(`/workspaces/${wid}/videos/presign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

/**
 * Commit the uploaded S3 object into the DB videos row.
 *
 * Body should minimally include:
 * {
 *   key: string,
 *   filename: string,
 *   content_type: string,
 *   file_size_bytes?: number,
 *   camera_code: string,
 *   camera_label?: string,
 *   frame_stride?: number,
 *   recorded_at?: string
 * }
 *
 * Next API route:
 *   POST /api/workspaces/{wid}/videos/commit
 *   -> FastAPI POST /workspaces/{wid}/videos/commit
 *
 * Backend:
 *   - Validates the S3 object via s3.head_object.
 *   - Creates or updates the videos row.
 *   - Returns a unified snapshot of the video record.
 */
export async function vaCommit(wid, body) {
  return req(`/workspaces/${wid}/videos/commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

/**
 * List videos for a workspace.
 *
 * This is the primary source for:
 * - IndexingRecords table rows.
 * - Feeding publishVideos(wid, videos) into the global store videoCatalog.
 *
 * Query example:
 *   {
 *     status: "uploaded" | "queued" | "processing" | "done" | "error",
 *     camera_code: "CAM01",
 *     date_from: "2025-01-01",
 *     date_to: "2025-01-31",
 *     page: 1,
 *     page_size: 25
 *   }
 *
 * Next API route:
 *   GET /api/workspaces/{wid}/videos
 *   -> FastAPI GET /workspaces/{wid}/videos
 *
 * Backend canonical response (VideosListOut):
 *   {
 *     workspaceId: string,
 *     items: VideoRowOut[],
 *     ...pagination and metadata
 *   }
 *
 * This helper returns the raw backend envelope. For a normalized, flat array
 * suitable for the store videoCatalog, use vaListVideosNormalized(wid, query).
 */
export async function vaListVideos(wid, query = {}) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return
    params.set(key, String(value))
  })
  const suffix = params.toString() ? `?${params.toString()}` : ""
  return req(`/workspaces/${wid}/videos${suffix}`)
}

/**
 * Convenience helper that unwraps VideosListOut and normalizes fields for the
 * video catalog and table components.
 *
 * Returns:
 *   {
 *     workspaceId: string | null,
 *     items: Array<{
 *       id: string,
 *       recorded_at: string | null,
 *       camera_code: string | null,
 *       camera_label: string | null,
 *       file_name: string | null,
 *       title: string | null,
 *       durationSec?: number,
 *       status?: string,
 *       other raw fields from backend
 *     }>,
 *     raw: any
 *   }
 */
export async function vaListVideosNormalized(wid, query = {}) {
  const raw = await vaListVideos(wid, query)

  const normalizeOne = (v = {}) => {
    const camera_code = v.camera_code ?? v.cameraCode ?? null
    const camera_label = v.camera_label ?? v.cameraLabel ?? null
    const file_name = v.file_name ?? v.fileName ?? null
    const recorded_at = v.recorded_at ?? v.recordedAt ?? null
    const title = v.title ?? file_name ?? null
    const durationSec =
      typeof v.durationSec === "number"
        ? v.durationSec
        : typeof v.duration_sec === "number"
        ? v.duration_sec
        : undefined

    return {
      ...v,
      camera_code,
      camera_label,
      file_name,
      recorded_at,
      title,
      durationSec,
    }
  }

  // Canonical shape: { workspaceId, items, ... }
  if (raw && Array.isArray(raw.items)) {
    return {
      workspaceId:
        raw.workspaceId ??
        raw.workspace_id ??
        wid ??
        null,
      items: raw.items.map(normalizeOne),
      raw,
    }
  }

  // Legacy shape: plain array
  if (Array.isArray(raw)) {
    return {
      workspaceId: wid ?? null,
      items: raw.map(normalizeOne),
      raw,
    }
  }

  // Unknown shape: safe default
  return {
    workspaceId: wid ?? null,
    items: [],
    raw,
  }
}

/**
 * Enqueue processing for a video.
 *
 * Default body is { variant: "cmt" } to keep future flexibility for multiple variants,
 * even though video analysis currently produces a single result set.
 *
 * Body shape:
 *   { variant?: string }
 *
 * Next API route:
 *   POST /api/workspaces/{wid}/videos/{videoId}/enqueue
 *   -> FastAPI POST /workspaces/{wid}/videos/{videoId}/enqueue
 */
export async function vaEnqueue(wid, videoId, body = { variant: "cmt" }) {
  return req(`/workspaces/${wid}/videos/${videoId}/enqueue`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

/**
 * Get high-level video detail and latest run summary.
 *
 * Expected response:
 *   {
 *     video: {
 *       id,
 *       workspace_id,
 *       workspace_code,
 *       camera_code,
 *       camera_label,
 *       file_name,
 *       recorded_at,
 *       status,
 *       frame_stride,
 *       other columns from videos table
 *     },
 *     latestRun?: {
 *       id,
 *       variant,
 *       status,
 *       created_at,
 *       updated_at,
 *       other columns from video_analyses table
 *     }
 *   }
 *
 * Next API route:
 *   GET /api/workspaces/{wid}/videos/{videoId}
 *   -> FastAPI GET /workspaces/{wid}/videos/{videoId}
 */
export async function vaShow(wid, videoId) {
  return req(`/workspaces/${wid}/videos/${videoId}`)
}

/**
 * Update video metadata.
 *
 * Patch should use snake_case to stay aligned with backend and DB schema:
 *   {
 *     camera_label?: string,
 *     recorded_at?: string,
 *     frame_stride?: number
 *   }
 *
 * Next API route:
 *   PATCH /api/workspaces/{wid}/videos/{videoId}
 *   -> FastAPI PATCH /workspaces/{wid}/videos/{videoId}
 */
export async function vaUpdate(wid, videoId, patch) {
  return req(`/workspaces/${wid}/videos/${videoId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  })
}

/**
 * Delete a video.
 *
 * Requires confirmation body, typically:
 *   { confirmCameraCode: string }
 *
 * Next API route:
 *   DELETE /api/workspaces/{wid}/videos/{videoId}
 *   -> FastAPI DELETE /workspaces/{wid}/videos/{videoId}
 */
export async function vaDelete(wid, videoId, body) {
  return req(`/workspaces/${wid}/videos/${videoId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

/**
 * List run containers (video_analyses rows) for a video.
 *
 * Useful for:
 * - Run history panel.
 * - Future Baseline versus CMT tabs if we add variants to video analysis.
 *
 * Next API route:
 *   GET /api/workspaces/{wid}/videos/{videoId}/analyses
 *   -> FastAPI GET /workspaces/{wid}/videos/{videoId}/analyses
 */
export async function vaRuns(wid, videoId) {
  return req(`/workspaces/${wid}/videos/${videoId}/analyses`)
}

/**
 * Poll run progress for a video.
 *
 * Params:
 *   { variant?: string, runId?: string }
 *
 * Next API route:
 *   GET /api/workspaces/{wid}/videos/{videoId}/progress?variant=&run_id=
 *   -> FastAPI GET /workspaces/{wid}/videos/{videoId}/progress
 *
 * Backend may map this internally to a consolidated status endpoint.
 */
export async function vaProgress(
  wid,
  videoId,
  { variant, runId } = {}
) {
  const params = new URLSearchParams()
  if (variant) params.set("variant", String(variant))
  if (runId) params.set("run_id", String(runId))
  const suffix = params.toString() ? `?${params.toString()}` : ""
  return req(`/workspaces/${wid}/videos/${videoId}/progress${suffix}`)
}

/**
 * List detections for a video and optionally a specific run or variant.
 *
 * Params:
 *   {
 *     variant?: string,
 *     runId?: string
 *   }
 *
 * Next API route:
 *   GET /api/workspaces/{wid}/videos/{videoId}/detections?variant=&run_id=
 *   -> FastAPI GET /workspaces/{wid}/videos/{videoId}/detections
 *
 * Bulk list is expected to return metadata and S3 keys, not presigned URLs.
 * Response shape is DetectionListOut:
 *   {
 *     videoId: string,
 *     variant: string,
 *     runId: string | null,
 *     items: DetectionRowOut[]
 *   }
 */
export async function vaDetections(
  wid,
  videoId,
  { variant, runId } = {}
) {
  const params = new URLSearchParams()
  if (variant) params.set("variant", String(variant))
  if (runId) params.set("run_id", String(runId))
  const suffix = params.toString() ? `?${params.toString()}` : ""
  return req(`/workspaces/${wid}/videos/${videoId}/detections${suffix}`)
}

/**
 * Fetch one detection row, with optional presigned URLs for images.
 *
 * Params:
 *   {
 *     presign?: number,
 *     ttl?: number
 *   }
 *
 * Next API route:
 *   GET /api/workspaces/{wid}/videos/{videoId}/detections/{detectionId}?presign=&ttl=
 *   -> FastAPI GET /workspaces/{wid}/videos/{videoId}/detections/{detectionId}
 *
 * Backend:
 *   - Returns detection details.
 *   - Attaches signed URLs for vehicle_image, annotated_image, and plate_image when presign=1.
 */
export async function vaDetection(
  wid,
  videoId,
  detectionId,
  { presign = 1, ttl = 900 } = {}
) {
  const params = new URLSearchParams({
    presign: String(presign),
    ttl: String(ttl),
  }).toString()
  return req(
    `/workspaces/${wid}/videos/${videoId}/detections/${detectionId}?${params}`
  )
}

/**
 * Patch a detection with manual corrections.
 *
 * Patch can include (camelCase or snake_case; backend model uses aliases):
 *   {
 *     typeLabel?: string,   // or type_label
 *     makeLabel?: string,   // or make_label
 *     modelLabel?: string,  // or model_label
 *     plateText?: string,   // or plate_text
 *     colors?: any          // e.g., ColorFBL[]
 *   }
 *
 * Backend will:
 *   - Apply corrections.
 *   - Zero out associated confidence fields when labels are overridden.
 *
 * Next API route:
 *   PATCH /api/workspaces/{wid}/videos/{videoId}/detections/{detectionId}
 *   -> FastAPI PATCH /workspaces/{wid}/videos/{videoId}/detections/{detectionId}
 */
export async function vaDetectionUpdate(
  wid,
  videoId,
  detectionId,
  patch
) {
  return req(`/workspaces/${wid}/videos/${videoId}/detections/${detectionId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  })
}

/**
 * Fan-out helper: list detections for all videos in a workspace.
 *
 * Typically used when the UI is in All mode and wants to aggregate detections
 * across multiple videos for a workspace.
 *
 * Params:
 *   wid: string
 *   videos: Array<{ id: string }>
 *   opts: { variant?: string, runId?: string }
 *
 * Returns:
 *   Array<DetectionListOut> (one per successfully loaded video).
 */
export async function vaDetectionsAll(
  wid,
  videos,
  { variant, runId } = {}
) {
  const list = Array.isArray(videos) ? videos : []
  const out = []

  for (const v of list) {
    if (!v || !v.id) continue
    try {
      const one = await vaDetections(wid, v.id, { variant, runId })
      out.push(one)
    } catch (e) {
      // Partial failure is allowed; caller can inspect the length of out.
      console.warn(
        "[videoAnalysis] vaDetectionsAll failed for video",
        v.id,
        e
      )
    }
  }

  return out
}

/**
 * Fetch a time-limited preview URL for a video.
 *
 * Params:
 *   {
 *     presign?: number,
 *     ttl?: number
 *   }
 *
 * Next API route:
 *   GET /api/workspaces/{wid}/videos/{videoId}/url?presign=&ttl=
 *   -> FastAPI GET /workspaces/{wid}/videos/{videoId}/url
 *
 * The Next proxy normalizes backend responses into:
 *   { url: string, ttl: number }
 */
export async function vaVideoUrl(
  wid,
  videoId,
  { presign = 1, ttl = 900 } = {}
) {
  const params = new URLSearchParams()
  if (presign !== undefined && presign !== null) {
    params.set("presign", String(presign))
  }
  if (ttl !== undefined && ttl !== null) {
    params.set("ttl", String(ttl))
  }
  const suffix = params.toString() ? `?${params.toString()}` : ""
  return req(`/workspaces/${wid}/videos/${videoId}/url${suffix}`)
}

/**
 * S3 PUT helper without progress reporting.
 *
 * Used for:
 *   - Direct upload of the video file to the presigned S3 URL from vaPresign.
 */
export async function putToS3(url, file, contentType) {
  const r = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": contentType || file.type || "application/octet-stream",
    },
    body: file,
  })
  if (!r.ok) {
    throw new Error(`S3 PUT failed: ${r.status}`)
  }
}

/**
 * S3 PUT helper with upload progress reporting.
 *
 * onProgress receives an integer percent from 0 to 100.
 */
export function putToS3WithProgress(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "video/mp4"
    )

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onProgress === "function") {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`S3 PUT failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error("S3 PUT network error"))
    }

    xhr.send(file)
  })
}
