// app/api/workspaces/[workspaceId]/videos/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../_utils";

/**
 * GET  -> FastAPI GET  /workspaces/{wid}/videos         (list)
 * POST -> FastAPI POST /workspaces/{wid}/videos         (create row)
 * Pass-through, no shape changes. Frontend expects snake_case fields.
 */
export async function GET(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
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

export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const url = buildBackendUrl(`/workspaces/${wid}/videos`);
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();
    const r = await fetch(url, { method: "POST", headers, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[videos:create] proxy error:", e);
    return new Response("Proxy error (videos create).", { status: 500 });
  }
}
