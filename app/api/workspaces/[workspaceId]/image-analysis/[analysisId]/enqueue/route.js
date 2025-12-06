// app/api/workspaces/[workspaceId]/image-analysis/[analysisId]/enqueue/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

export async function POST(req, ctx) {
  try {
    // Next 15/16: ctx.params can be a Promise; unwrap it once.
    const params = await ctx.params;
    const wid = await getWid(params);
    const { analysisId } = params;

    // Prefer the singular alias (always mounted on your backend)
    const url = buildBackendUrl(`/workspaces/${wid}/image-analysis/${analysisId}/enqueue`);
    const headers = await authHeaders();

    let r = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
    });

    // Fallback: if this backend only mounted the plural router
    if (r.status === 404) {
      const fallbackUrl = buildBackendUrl(
        `/workspaces/${wid}/image-analyses/${analysisId}/enqueue`
      );
      r = await fetch(fallbackUrl, {
        method: "POST",
        headers,
        cache: "no-store",
      });
    }

    return passThru(r);
  } catch (e) {
    console.error("[img-enqueue] proxy error:", e);
    return new Response("Proxy error (image enqueue).", { status: 500 });
  }
}
