import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

export async function POST(_req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const { analysisId } = await ctx.params;
    const url = buildBackendUrl(`/workspaces/${wid}/image-analysis/${analysisId}/enqueue`);
    const h = await authHeaders();
    const r = await fetch(url, { method: "POST", headers: h, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[img-enqueue] proxy error:", e);
    return new Response("Proxy error (image enqueue).", { status: 500 });
  }
}
