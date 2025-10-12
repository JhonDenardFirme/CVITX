export async function GET(req) {
  try {
    // --- base URL (keep your current env) ---
    const baseRaw =
      process.env.CVX_API_BASE_URL ||
      process.env.BACKEND_BASE_URL || // optional fallback if you ever rename
      "";
    const base = baseRaw.replace(/\/+$/, "");
    const apiKey = process.env.CVX_API_KEY || "";

    if (!/^https?:\/\//i.test(base)) {
      console.error("[proxy:detections] invalid base:", baseRaw);
      return new Response("CVX_API_BASE_URL invalid", { status: 500 });
    }

    // --- build target: preserve original query ---
    const u = new URL(req.url);
    const target = `${base}/api/detections${u.search}`;

    // --- forward cookies + synthesize Bearer from cvx_session cookie ---
    const incomingCookie = req.headers.get("cookie") || "";
    let bearer = null;
    const m = incomingCookie.match(/(?:^|;\s*)cvx_session=([^;]+)/);
    if (m) {
      try {
        bearer = decodeURIComponent(m[1]);
      } catch {
        bearer = m[1];
      }
    }

    // --- outbound headers ---
    const headers = {};
    if (apiKey) headers["x-api-key"] = apiKey;           // keep your API key path
    if (incomingCookie) headers["cookie"] = incomingCookie; // forward cookies
    if (bearer) headers["authorization"] = `Bearer ${bearer}`; // add Bearer for JWT backends

    console.log("[proxy:detections] →", target, {
      hasApiKey: Boolean(apiKey),
      hasCookie: Boolean(incomingCookie),
      hasBearer: Boolean(bearer),
    });

    // --- call backend (no-store) ---
    const r = await fetch(target, { method: "GET", headers, cache: "no-store" });

    const ct = r.headers.get("content-type") || "application/json";
    const text = await r.text();
    console.log("[proxy:detections] status=", r.status, "bytes=", text.length);

    return new Response(text, {
      status: r.status,
      headers: { "content-type": ct, "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[proxy:detections] error", e);
    return new Response("Proxy error", { status: 500 });
  }
}
