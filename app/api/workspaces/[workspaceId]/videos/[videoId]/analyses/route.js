// app/api/workspaces/[workspaceId]/videos/[videoId]/analyses/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

/**
 * EXPLAINS:
 * Thin proxy: Next API -> FastAPI GET /workspaces/{wid}/videos/{vid}/analyses
 * - Lists run containers (usually 1 per variant).
 * - Useful for run history / Baseline vs CMT tabs.
 */
export async function GET(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { videoId } = params;
    const { search } = new URL(req.url);
    const url = buildBackendUrl(
      `/workspaces/${wid}/videos/${videoId}/analyses${search || ""}`
    );
    const headers = await authHeaders();
    const r = await fetch(url, { headers, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-runs] proxy error:", e);
    return new Response("Proxy error (video runs).", { status: 500 });
  }
}
