// app/api/workspaces/[workspaceId]/videos/[videoId]/enqueue/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

/**
 * EXPLAINS:
 * Thin proxy: Next API -> FastAPI POST /workspaces/{wid}/videos/{vid}/enqueue
 * - Optional JSON body (e.g., { variant: "cmt" }) is forwarded as-is.
 * - On success, backend sets videos.status='queued' and sends SQS message.
 */
export async function POST(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { videoId } = params;
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}/enqueue`);
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();
    const r = await fetch(url, { method: "POST", headers, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-enqueue] proxy error:", e);
    return new Response("Proxy error (video enqueue).", { status: 500 });
  }
}
