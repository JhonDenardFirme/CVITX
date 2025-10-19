import { authHeaders, buildBackendUrl, getWid, passThru } from "../_utils";

export async function GET(_req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const url = buildBackendUrl(`/workspaces/${wid}/image-analysis`);
    const h = await authHeaders();
    const r = await fetch(url, { headers: h, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[img-list] proxy error:", e);
    return new Response("Proxy error (image analysis list).", { status: 500 });
  }
}
