// app/api/workspaces/[workspaceId]/files/commit/route.js
import { authHeaders, buildBackendUrl, getWid } from "../../_utils";

/**
 * POST (with query params) -> forwards to FastAPI /workspaces/{wid}/videos/commit
 * Translates ?key=&content_type=&size_bytes= into a JSON body.
 */
export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const u = new URL(req.url);
    const key = u.searchParams.get("key");
    const content_type = u.searchParams.get("content_type");
    const size_bytes = u.searchParams.get("size_bytes");

    if (!key || !content_type || !size_bytes) {
      return new Response("Missing key/content_type/size_bytes", { status: 400 });
    }

    const backendUrl = buildBackendUrl(`/workspaces/${wid}/videos/commit`);
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = JSON.stringify({ key, content_type, size_bytes: Number(size_bytes) });

    const r = await fetch(backendUrl, { method: "POST", headers, body, cache: "no-store" });
    const text = await r.text();
    return new Response(text, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "text/plain" } });
  } catch (e) {
    console.error("[files:commit] proxy error:", e);
    return new Response("Proxy error (files commit).", { status: 500 });
  }
}
