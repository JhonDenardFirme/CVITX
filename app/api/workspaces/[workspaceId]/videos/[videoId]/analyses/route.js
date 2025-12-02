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
    const wid = await getWid(ctx.params);
    const { videoId } = ctx.params;
    const { search } = new URL(req.url);
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}/analyses${search || ""}`);
    const headers = await authHeaders();
    const r = await fetch(url, { headers, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-runs] proxy error:", e);
    return new Response("Proxy error (video runs).", { status: 500 });
  }
}
