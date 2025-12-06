// app/api/workspaces/[workspaceId]/videos/[videoId]/progress/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

/**
 * EXPLAINS:
 * Thin proxy: Next API -> FastAPI GET /workspaces/{wid}/videos/{vid}/progress
 * - Accepts ?variant=cmt|baseline and returns {status, counts, percent}.
 * - Ideal for polling every 2–5s in UI until done/error.
 */
export async function GET(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { videoId } = params;
    const { search } = new URL(req.url); // preserve ?variant=
    const url = buildBackendUrl(
      `/workspaces/${wid}/videos/${videoId}/progress${search || ""}`
    );
    const headers = await authHeaders();
    const r = await fetch(url, { headers, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-progress] proxy error:", e);
    return new Response("Proxy error (video progress).", { status: 500 });
  }
}
