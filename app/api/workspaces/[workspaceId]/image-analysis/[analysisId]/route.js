import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils";

export async function GET(_req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const { analysisId } = await ctx.params;
    const url = buildBackendUrl(`/workspaces/${wid}/image-analysis/${analysisId}`);
    const h = await authHeaders();
    const r = await fetch(url, { headers: h, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[img-show] proxy error:", e);
    return new Response("Proxy error (image show).", { status: 500 });
  }
}
