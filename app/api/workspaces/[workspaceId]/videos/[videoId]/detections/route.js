// app/api/workspaces/[workspaceId]/videos/[videoId]/detections/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

/**
 * EXPLAINS:
 * Thin proxy: Next API -> FastAPI GET /workspaces/{wid}/videos/{vid}/detections
 * - Preserves ?variant=&runId=.
 * - Bulk list returns S3 *keys* only; use the single detection endpoint
 *   with ?presign=1 to fetch time-limited URLs for images.
 */
export async function GET(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { videoId } = params;

    // Guard against bogus IDs (string "undefined", "null", empty, etc.)
    if (!videoId || videoId === "undefined" || videoId === "null") {
      console.error("[video-detections] invalid videoId from route params:", videoId);
      return new Response("Invalid videoId", {
        status: 400,
      });
    }

    const { search } = new URL(req.url);
    const url = buildBackendUrl(
      `/workspaces/${wid}/videos/${videoId}/detections${search || ""}`
    );
    const headers = await authHeaders();
    const r = await fetch(url, { headers, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-detections] proxy error:", e);
    return new Response("Proxy error (video detections).", { status: 500 });
  }
}
