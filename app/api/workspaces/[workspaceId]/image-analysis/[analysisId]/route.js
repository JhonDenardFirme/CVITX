// app/api/workspaces/[workspaceId]/image-analysis/[analysisId]/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils";

export async function GET(req, ctx) {
  try {
    // Next 16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const analysisId = params.analysisId;
    const { search } = new URL(req.url);      // preserve ?presign=&ttl= (and future params)
    const url = buildBackendUrl(
      `/workspaces/${wid}/image-analysis/${analysisId}${search || ""}`
    );
    const h = await authHeaders();
    const r = await fetch(url, { headers: h, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[img-show] proxy error:", e);
    return new Response("Proxy error (image show).", { status: 500 });
  }
}
