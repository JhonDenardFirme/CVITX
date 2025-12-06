// app/api/workspaces/[workspaceId]/videos/[videoId]/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils";

/**
 * EXPLAINS:
 * - GET: Next API -> FastAPI GET /workspaces/{wid}/videos/{vid}
 *         Returns { video, latestRun } for your Video Detail page.
 * - PATCH: Update video metadata (cameraLabel, recordedAt).
 * - DELETE: Danger-zone deletion (requires confirmCameraCode JSON body).
 * All methods reuse authHeaders and passThru for transparent proxying.
 */
export async function GET(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { videoId } = params;
    const { search } = new URL(req.url);
    const url = buildBackendUrl(
      `/workspaces/${wid}/videos/${videoId}${search || ""}`
    );
    const headers = await authHeaders();
    const r = await fetch(url, { headers, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-show] proxy error:", e);
    return new Response("Proxy error (video show).", { status: 500 });
  }
}

export async function PATCH(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { videoId } = params;
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}`);
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();
    const r = await fetch(url, { method: "PATCH", headers, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-update] proxy error:", e);
    return new Response("Proxy error (video update).", { status: 500 });
  }
}

export async function DELETE(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { videoId } = params;
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}`);
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text(); // expect { confirmCameraCode: "..." }
    const r = await fetch(url, { method: "DELETE", headers, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-delete] proxy error:", e);
    return new Response("Proxy error (video delete).", { status: 500 });
  }
}
