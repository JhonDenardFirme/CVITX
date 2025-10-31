import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils";

export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const url = buildBackendUrl(`/workspaces/${wid}/image-analyse5s/presign`);
    const h = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();
    const r = await fetch(url, { method: "POST", headers: h, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[img-presign] proxy error:", e);
    return new Response("Proxy error (image presign).", { status: 500 });
  }
}
