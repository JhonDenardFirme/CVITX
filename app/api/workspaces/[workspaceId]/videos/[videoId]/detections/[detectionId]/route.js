// app/api/workspaces/[workspaceId]/videos/[videoId]/detections/[detectionId]/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../../_utils";

/**
 * EXPLAINS:
 * - GET: Next API -> FastAPI GET /workspaces/{wid}/videos/{vid}/detections/{detId}
 *         Accepts ?presign=1&ttl=900 to attach signed URLs for images.
 * - PATCH: Manual corrections (type/make/model/plate/colors).
 *         Backend zeros *_conf when labels are overridden.
 */
export async function GET(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const { videoId, detectionId } = ctx.params;

    // Guard against bogus IDs (string "undefined", "null", empty, etc.)
    if (
      !videoId ||
      videoId === "undefined" ||
      videoId === "null" ||
      !detectionId ||
      detectionId === "undefined" ||
      detectionId === "null"
    ) {
      console.error("[video-detection-show] invalid route params:", {
        videoId,
        detectionId,
      });
      return new Response("Invalid detection route params", {
        status: 400,
      });
    }

    const { search } = new URL(req.url);
    const url = buildBackendUrl(
      `/workspaces/${wid}/videos/${videoId}/detections/${detectionId}${search || ""}`
    );
    const headers = await authHeaders();
    const r = await fetch(url, { headers, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-detection-show] proxy error:", e);
    return new Response("Proxy error (video detection show).", { status: 500 });
  }
}

export async function PATCH(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const { videoId, detectionId } = ctx.params;

    // Guard against bogus IDs (string "undefined", "null", empty, etc.)
    if (
      !videoId ||
      videoId === "undefined" ||
      videoId === "null" ||
      !detectionId ||
      detectionId === "undefined" ||
      detectionId === "null"
    ) {
      console.error("[video-detection-update] invalid route params:", {
        videoId,
        detectionId,
      });
      return new Response("Invalid detection route params", {
        status: 400,
      });
    }

    const url = buildBackendUrl(
      `/workspaces/${wid}/videos/${videoId}/detections/${detectionId}`
    );
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();
    const r = await fetch(url, { method: "PATCH", headers, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-detection-update] proxy error:", e);
    return new Response("Proxy error (video detection update).", { status: 500 });
  }
}
