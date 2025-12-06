// app/api/workspaces/[workspaceId]/videos/presign/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils";

/**
 * EXPLAINS:
 * Thin proxy: Next API -> FastAPI POST /workspaces/{wid}/videos/presign
 * - Reads raw JSON from the request and forwards as-is.
 * - Uses shared authHeaders() to pass Authorization (and trace headers).
 * - This returns { videoId, presignedUrl, s3KeyRaw, ... } to the browser,
 *   which you then use for a direct S3 PUT (upload step).
 */
export async function POST(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const url = buildBackendUrl(`/workspaces/${wid}/videos/presign`);
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();
    const r = await fetch(url, { method: "POST", headers, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-presign] proxy error:", e);
    return new Response("Proxy error (video presign).", { status: 500 });
  }
}
