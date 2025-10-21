import { getDetection, patchDetection, deleteDetection } from "@/lib/detections.mock";

export async function GET(_req, { params }) {
  try {
    const data = await getDetection(params.id);
    return Response.json(data);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = await patchDetection(params.id, body);
    return Response.json(data);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await deleteDetection(params.id);
    return Response.json({ ok: true });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}






/*
function buildAuthHeaders(req) {
  const headers = {};
  const apiKey = process.env.CVX_API_KEY || "";
  if (apiKey) headers["x-api-key"] = apiKey;

  const incomingCookie = req.headers.get("cookie") || "";
  if (incomingCookie) headers["cookie"] = incomingCookie;

  // optional Bearer from cvx_session cookie
  const m = incomingCookie.match(/(?:^|;\s*)cvx_session=([^;]+)/);
  if (m) {
    let bearer = m[1];
    try { bearer = decodeURIComponent(bearer); } catch {}
    headers["authorization"] = `Bearer ${bearer}`;
  }

  return headers;
}

function getBase() {
  const raw = process.env.CVX_API_BASE_URL || process.env.BACKEND_BASE_URL || "";
  const base = raw.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) return null;
  return base;
}

export async function GET(req, { params }) {
  try {
    const base = getBase();
    if (!base) return new Response("CVX_API_BASE_URL invalid", { status: 500 });

    const detId = params?.detId;
    if (!detId) return new Response("detId missing", { status: 400 });

    const url = `${base}/api/detections/${detId}`;
    const headers = buildAuthHeaders(req);

    console.log("[proxy:detections:detail] →", url, {
      hasApiKey: Boolean(headers["x-api-key"]),
      hasCookie: Boolean(headers["cookie"]),
      hasBearer: Boolean(headers["authorization"]),
    });

    const r = await fetch(url, { headers, cache: "no-store" });
    const ct = r.headers.get("content-type") || "application/json";
    const text = await r.text();

    return new Response(text, {
      status: r.status,
      headers: { "content-type": ct, "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[proxy:detections:detail] error", e);
    return new Response("Proxy error", { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const base = getBase();
    if (!base) return new Response("CVX_API_BASE_URL invalid", { status: 500 });

    const detId = params?.detId;
    if (!detId) return new Response("detId missing", { status: 400 });

    const url = `${base}/api/detections/${detId}`;
    const headers = { ...buildAuthHeaders(req), "content-type": "application/json" };
    const body = await req.text();

    console.log("[proxy:detections:patch] →", url);

    const r = await fetch(url, { method: "PATCH", headers, body, cache: "no-store" });
    const ct = r.headers.get("content-type") || "application/json";
    const text = await r.text();

    return new Response(text, {
      status: r.status,
      headers: { "content-type": ct, "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[proxy:detections:patch] error", e);
    return new Response("Proxy error", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const base = getBase();
    if (!base) return new Response("CVX_API_BASE_URL invalid", { status: 500 });

    const detId = params?.detId;
    if (!detId) return new Response("detId missing", { status: 400 });

    const url = `${base}/api/detections/${detId}`;
    const headers = buildAuthHeaders(req);

    console.log("[proxy:detections:delete] →", url);

    const r = await fetch(url, { method: "DELETE", headers, cache: "no-store" });

    // keep your previous DELETE behavior: return {} and mirror status
    return new Response(JSON.stringify({}), {
      status: r.status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[proxy:detections:delete] error", e);
    return new Response("Proxy error", { status: 500 });
  }
}
*/