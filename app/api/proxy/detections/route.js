export async function GET(req) {
  try {
    const base = (process.env.CVX_API_BASE_URL || '').replace(/\/+$/, '')
    const apiKey = process.env.CVX_API_KEY
    if (!/^https?:\/\//i.test(base)) return new Response('CVX_API_BASE_URL invalid', { status: 500 })
    if (!apiKey) return new Response('CVX_API_KEY missing', { status: 500 })

    const u = new URL(req.url)                 // keep whatever the client passed (?workspace_id=...&video_id=...&...)
    const target = `${base}/api/detections${u.search}`

    const r = await fetch(target, {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
    })
    const ct = r.headers.get('content-type') || 'application/json'
    return new Response(await r.text(), { status: r.status, headers: { 'content-type': ct, 'cache-control': 'no-store' } })
  } catch (e) {
    console.error('[proxy:detections] error', e)
    return new Response('Proxy error', { status: 500 })
  }
}
