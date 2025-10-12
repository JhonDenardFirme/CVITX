// NOTE: Backend endpoint for rendered evidence images is not yet implemented.
// We still call it so the client can handle failures gracefully.
// TODO (backend): provide POST /api/detections/:detId/evidence-image → { image_url: string }

export async function POST(_req, { params }) {
  try {
    const base = (process.env.CVX_API_BASE_URL || '').replace(/\/+$/, '')
    const apiKey = process.env.CVX_API_KEY
    const detId = (await params).detId
    if (!/^https?:\/\//i.test(base)) return new Response('CVX_API_BASE_URL invalid', { status: 500 })
    if (!apiKey) return new Response('CVX_API_KEY missing', { status: 500 })
    if (!detId) return new Response('detId missing', { status: 400 })

    const r = await fetch(`${base}/api/detections/${detId}/evidence-image`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
    })
    const ct = r.headers.get('content-type') || 'application/json'
    // pass-through body; client will handle errors or missing image_url
    return new Response(await r.text(), { status: r.status, headers: { 'content-type': ct, 'cache-control': 'no-store' } })
  } catch (e) {
    console.error('[proxy:detections:evidence] error', e)
    // return a JSON error the client can detect
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  }
}



/*
TODO (to revisit after backend ships evidence rendering)

Backend endpoints needed:

POST /api/detections/:detId/evidence-image

Request: no body needed initially (or { style?: "default" } later)

Auth: x-api-key

Response (200): { image_url: string } — a stable URL to a 640×640 rendered visualization showing the full vehicle and parts boxes/labels.

Errors: 404 if not found; 202 acceptable if rendering is async, ideally also return a polling URL.

(Optional) GET /api/detections/:detId/evidence-image

Use: retrieve URL if previously generated (idempotent).

Client follow-up once backend is ready:

In the Details dialog, replace the fallback “load original image if call fails” with:

Call POST → if 202, show “processing” with a retry/poll; if 200, show image_url.

Remove any temporary fallback that uses the original image when the evidence call fails.

*/