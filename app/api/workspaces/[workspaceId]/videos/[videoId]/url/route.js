// app/api/workspaces/[workspaceId]/videos/[videoId]/url/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils";

/**
 * GET -> FastAPI GET /workspaces/{wid}/videos/{vid}/url
 *
 * Combined approach:
 *  - Preserves all incoming query params (e.g., ?presign=1&ttl=...)
 *  - Adds a default ttl=900 if missing, and clamps ttl into [60, 3600]
 *  - Normalizes backend variants to a stable { url, ttl } for the FE
 *    (accepts: url | signed_url | presigned_url | href)
 *  - On non-2xx, passes backend response through unchanged.
 */
export async function GET(req, ctx) {
  try {
    const wid = await getWid(ctx.params);
    const { videoId } = ctx.params;

    // Build query with default/clamped TTL but keep all other params intact
    const inUrl = new URL(req.url);
    const sp = inUrl.searchParams;
    const hasTTL = sp.has("ttl");
    const rawTTL = hasTTL ? parseInt(sp.get("ttl") || "900", 10) : 900;
    const clamped = Number.isFinite(rawTTL)
      ? Math.max(60, Math.min(rawTTL, 3600))
      : 900;
    if (!hasTTL) {
      sp.set("ttl", String(clamped));
    } else if (String(rawTTL) !== String(clamped)) {
      // normalize invalid/out-of-range TTL to clamped value
      sp.set("ttl", String(clamped));
    }

    const qs = sp.toString();
    const url = buildBackendUrl(
      `/workspaces/${wid}/videos/${videoId}/url${qs ? `?${qs}` : ""}`
    );

    const headers = await authHeaders();
    const r = await fetch(url, { method: "GET", headers, cache: "no-store" });

    // On error: preserve backend status/body/headers
    if (!r.ok) return passThru(r);

    // Success: normalize payload to { url, ttl }
    const text = await r.text();
    let j = {};
    try {
      j = JSON.parse(text || "{}");
    } catch {
      // If backend ever returns non-JSON, fail gracefully
      return new Response("preview-url: non-JSON backend response", { status: 502 });
    }

    const href = j.url || j.signed_url || j.presigned_url || j.href || null;
    const ttlOut = Number.isFinite(j.ttl) ? j.ttl : clamped;

    if (!href) {
      return new Response("preview-url missing", { status: 502 });
    }

    return new Response(JSON.stringify({ url: href, ttl: ttlOut }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[video:url] proxy error:", e);
    return new Response("Proxy error (video url).", { status: 500 });
  }
}
