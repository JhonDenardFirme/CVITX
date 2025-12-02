// app/api/workspaces/[workspaceId]/videos/[videoId]/url/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

/**
 * GET -> FastAPI GET /workspaces/{wid}/videos/{vid}/url
 * Combined approach:
 *   - Preserves your query-string forwarding (?presign=1&ttl=...)
 *   - Normalizes backend variants to a stable { url } for the FE
 *     (accepts: url | signed_url | presigned_url | href)
 *   - On non-2xx, passes backend response through unchanged.
 */
export async function GET(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const { videoId } = ctx.params;
    const { search } = new URL(req.url);
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}/url${search || ""}`);
    const headers = await authHeaders();

    const r = await fetch(url, { method: "GET", headers, cache: "no-store" });
    if (!r.ok) {
      // Preserve backend status/body/headers for errors
      return passThru(r);
    }

    // Success: normalize payload to { url }
    const text = await r.text();
    let j = {};
    try { j = JSON.parse(text || "{}"); } catch { /* non-JSON fallback */ }

    const href = j.url || j.signed_url || j.presigned_url || j.href || null;
    if (!href) {
      return new Response("preview-url missing", { status: 502 });
    }

    return new Response(JSON.stringify({ url: href }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[video:url] proxy error:", e);
    return new Response("Proxy error (video url).", { status: 500 });
  }
}
