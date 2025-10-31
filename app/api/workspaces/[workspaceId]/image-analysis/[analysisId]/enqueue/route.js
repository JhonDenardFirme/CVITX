import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const { analysisId } = ctx.params;

    // Hit the backend's enqueue endpoint (POST), not the show endpoint.
    const url = buildBackendUrl(`/workspaces/${wid}/image-analyses/${analysisId}/enqueue`);
    const headers = await authHeaders();

    const r = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
    });

    return passThru(r);
  } catch (e) {
    console.error("[img-enqueue] proxy error:", e);
    return new Response("Proxy error (image enqueue).", { status: 500 });
  }
}
