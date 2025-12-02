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
    const wid = await getWid(ctx.params);
    const { videoId } = ctx.params;
    const { search } = new URL(req.url);
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}/detections${search || ""}`);
    const headers = await authHeaders();
    const r = await fetch(url, { headers, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-detections] proxy error:", e);
    return new Response("Proxy error (video detections).", { status: 500 });
  }
}
