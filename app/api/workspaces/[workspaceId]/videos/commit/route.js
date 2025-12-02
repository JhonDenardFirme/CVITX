// app/api/workspaces/[workspaceId]/videos/commit/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils";

/**
 * EXPLAINS:
 * Thin proxy: Next API -> FastAPI POST /workspaces/{wid}/videos/commit
 * - Validates the S3 object exists (backend does s3.head_object).
 * - Creates/updates the videos row; returns a unified “video” snapshot.
 * - Mirrors your Image Analysis commit proxy pattern.
 */
export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const url = buildBackendUrl(`/workspaces/${wid}/videos/commit`);
    const headers = { ...(await authHeaders()), "content-type": "application/json" };
    const body = await req.text();
    const r = await fetch(url, { method: "POST", headers, body, cache: "no-store" });
    return passThru(r);
  } catch (e) {
    console.error("[video-commit] proxy error:", e);
    return new Response("Proxy error (video commit).", { status: 500 });
  }
}
