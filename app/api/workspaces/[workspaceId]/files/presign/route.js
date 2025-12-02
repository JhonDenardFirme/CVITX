// app/api/workspaces/[workspaceId]/files/presign/route.js
import { authHeaders, buildBackendUrl, getWid } from "../../_utils";

/**
 * POST -> forwards to FastAPI /workspaces/{wid}/videos/presign
 * Normalizes response to what FE expects:
 *   { video_id, key, url }
 */
export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const backendUrl = buildBackendUrl(`/workspaces/${wid}/videos/presign`);
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();

    const r = await fetch(backendUrl, { method: "POST", headers, body, cache: "no-store" });
    const text = await r.text();
    if (!r.ok) return new Response(text || "Presign failed", { status: r.status });

    let j;
    try { j = JSON.parse(text); } catch { j = {}; }

    const video_id = j.video_id || j.videoId || j.id || null;
    const key      = j.key || j.s3_key_raw || j.s3KeyRaw || j.s3Key || null;
    const url      = j.url || j.presigned_url || j.presignedUrl || j.put_url || null;

    if (!video_id || !key || !url) {
      return new Response("Presign missing required fields", { status: 502 });
    }
    return new Response(JSON.stringify({ video_id, key, url }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  } catch (e) {
    console.error("[files:presign] proxy error:", e);
    return new Response("Proxy error (files presign).", { status: 500 });
  }
}
