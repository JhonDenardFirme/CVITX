export async function GET(req) {
  // Resolve base URL (prefer API-key mode if configured)
  const rawBase = process.env.CVX_API_BASE_URL || process.env.BACKEND_BASE_URL || "";
  const base = rawBase.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) {
    console.error("[proxy/detections] invalid base:", rawBase);
    return new Response(JSON.stringify({ error: "CVX_API_BASE_URL/BACKEND_BASE_URL invalid" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const search = req.nextUrl.search || "";
  const hasApiKey = Boolean(process.env.CVX_API_KEY);

  // Build headers
  const headers = {};
  if (hasApiKey) headers["x-api-key"] = process.env.CVX_API_KEY;

  // Always forward inbound cookies (harmless if backend ignores them)
  const incomingCookie = req.headers.get("cookie") || "";
  if (incomingCookie) headers["cookie"] = incomingCookie;

  // Also synthesize Authorization: Bearer <cvx_session> from cookie for JWT-enabled backends
  const m = incomingCookie.match(/(?:^|;\s*)cvx_session=([^;]+)/);
  if (m) {
    let bearer = m[1];
    try { bearer = decodeURIComponent(bearer); } catch {}
    headers["authorization"] = `Bearer ${bearer}`;
  }

  // Choose target path
  const targetApiKey = `${base}/api/detections${search}`;
  const targetCookie = `${base}/detections${search}`;
  const primary = hasApiKey ? targetApiKey : targetCookie;
  const mode = hasApiKey ? "apiKey" : "cookie";

  console.log("[proxy/detections] →", primary, {
    mode,
    hasCookie: Boolean(incomingCookie),
    hasBearer: Boolean(headers["authorization"]),
  });

  // Call backend (no cache)
  try {
    let r = await fetch(primary, { headers, cache: "no-store" });

    // If we tried API key path and it failed with 401/404, fall back to cookie path once
    if (hasApiKey && (r.status === 401 || r.status === 404)) {
      const fallback = targetCookie;
      console.warn("[proxy/detections] primary failed", r.status, "→ fallback:", fallback);
      r = await fetch(fallback, { headers, cache: "no-store" });
      const ct2 = r.headers.get("content-type") || "application/json";
      const txt2 = await r.text();
      console.log("[proxy/detections] fallback status=", r.status, "bytes=", txt2.length);
      return new Response(txt2, {
        status: r.status,
        headers: { "content-type": ct2, "cache-control": "no-store", "x-proxy-auth-mode": "fallback-cookie" },
      });
    }

    const ct = r.headers.get("content-type") || "application/json";
    const text = await r.text();
    console.log("[proxy/detections] status=", r.status, "bytes=", text.length);
    return new Response(text, {
      status: r.status,
      headers: { "content-type": ct, "cache-control": "no-store", "x-proxy-auth-mode": mode },
    });
  } catch (e) {
    console.error("[proxy/detections] fetch failed:", e?.message || e);
    return new Response(JSON.stringify({ error: "backend fetch failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
