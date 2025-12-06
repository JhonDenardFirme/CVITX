// app/api/workspaces/[workspaceId]/image-analysis/presign/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils";

export async function POST(req, ctx) {
  try {
    // Next 15/16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const url = buildBackendUrl(`/workspaces/${wid}/image-analyses/presign`);
    const h = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();
    const r = await fetch(url, { method: "POST", headers: h, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[img-presign] proxy error:", e);
    return new Response("Proxy error (image presign).", { status: 500 });
  }
}
