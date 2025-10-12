// NOTE: Backend endpoint for rendered evidence images may return 200 (ready) or 202 (processing).
// We pass the backend response through verbatim so the client can decide what to do.

function getBase() {
  const raw = process.env.CVX_API_BASE_URL || process.env.BACKEND_BASE_URL || "";
  const base = raw.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) return null;
  return base;
}

function buildAuthHeaders(req) {
  const headers = {};
  const apiKey = process.env.CVX_API_KEY || "";
  if (apiKey) headers["x-api-key"] = apiKey;

  // Forward inbound cookies so the backend can read sessions if it wants.
  const incomingCookie = req.headers.get("cookie") || "";
  if (incomingCookie) headers["cookie"] = incomingCookie;

  // Also synthesize Authorization: Bearer <cvx_session> from the cookie (harmless if backend ignores it).
  const m = incomingCookie.match(/(?:^|;\s*)cvx_session=([^;]+)/);
  if (m) {
    let bearer = m[1];
    try { bearer = decodeURIComponent(bearer); } catch {}
    headers["authorization"] = `Bearer ${bearer}`;
  }

  return headers;
}

export async function POST(req, { params }) {
  try {
    const base = getBase();
    if (!base) return new Response("CVX_API_BASE_URL invalid", { status: 500 });

    const detId = params?.detId;
    if (!detId) return new Response("detId missing", { status: 400 });

    const url = `${base}/api/detections/${detId}/evidence-image`;
    const headers = buildAuthHeaders(req);

    console.log("[proxy:detections:evidence] →", url, {
      hasApiKey: Boolean(headers["x-api-key"]),
      hasCookie: Boolean(headers["cookie"]),
      hasBearer: Boolean(headers["authorization"]),
    });

    // Pass-through POST (no body needed today). Keep no-store.
    const r = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
    });

    const ct = r.headers.get("content-type") || "application/json";
    const text = await r.text();
    console.log("[proxy:detections:evidence] status=", r.status, "bytes=", text.length);

    // Mirror backend body/status; client handles 200/202/4xx cases.
    return new Response(text, {
      status: r.status,
      headers: { "content-type": ct, "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[proxy:detections:evidence] error", e);
    // Return JSON the client can safely parse.
    return new Response(JSON.stringify({ error: "Proxy error" }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
}

/*
Backend endpoints expected:

POST /api/detections/:detId/evidence-image
Auth: x-api-key and/or cookie/JWT (we send both)
Response:
  200 { image_url: string }  // ready
  202 { status: "processing" } (optional)
  404 … if det not found

(Optional later) GET /api/detections/:detId/evidence-image
*/
