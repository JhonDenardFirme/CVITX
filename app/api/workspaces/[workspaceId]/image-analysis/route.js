// app/api/workspaces/[workspaceId]/image-analysis/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../_utils";

export async function GET(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const { search } = new URL(req.url); // preserve ?limit=&offset= (and future filters)
    const url = buildBackendUrl(`/workspaces/${wid}/image-analyses${search || ""}`);
    const h = await authHeaders();
    const r = await fetch(url, { headers: h, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[img-list] proxy error:", e);
    return new Response("Proxy error (image analysis list).", { status: 500 });
  }
}
