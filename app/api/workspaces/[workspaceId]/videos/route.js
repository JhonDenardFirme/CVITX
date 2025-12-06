// app/api/workspaces/[workspaceId]/videos/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../_utils";

/**
 * GET  -> FastAPI GET  /workspaces/{wid}/videos         (list only)
 *
 * Creation and upload of videos are handled through:
 *   POST /workspaces/{wid}/videos/presign
 *   POST /workspaces/{wid}/videos/commit
 *
 * There is no POST /workspaces/{wid}/videos endpoint in the backend.
 * This proxy performs a pass-through with no shape changes.
 * The frontend expects snake_case fields from the backend response.
 */
export async function GET(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { search } = new URL(req.url);
    const url = buildBackendUrl(`/workspaces/${wid}/videos${search || ""}`);
    const headers = await authHeaders();
    const r = await fetch(url, { headers, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[videos:list] proxy error:", e);
    return new Response("Proxy error (videos list).", { status: 500 });
  }
}
