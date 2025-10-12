export async function GET(_req, { params }) {
  try {
    const base = (process.env.CVX_API_BASE_URL || '').replace(/\/+$/, '')
    const apiKey = process.env.CVX_API_KEY
    const detId = (await params).detId
    if (!/^https?:\/\//i.test(base)) return new Response('CVX_API_BASE_URL invalid', { status: 500 })
    if (!apiKey) return new Response('CVX_API_KEY missing', { status: 500 })
    if (!detId) return new Response('detId missing', { status: 400 })

    const r = await fetch(`${base}/api/detections/${detId}`, {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
    })
    const ct = r.headers.get('content-type') || 'application/json'
    return new Response(await r.text(), { status: r.status, headers: { 'content-type': ct, 'cache-control': 'no-store' } })
  } catch (e) {
    console.error('[proxy:detections:detail] error', e)
    return new Response('Proxy error', { status: 500 })
  }
}

export async function PATCH(req, { params }) {
  try {
    const base = (process.env.CVX_API_BASE_URL || '').replace(/\/+$/, '')
    const apiKey = process.env.CVX_API_KEY
    const detId = (await params).detId
    if (!/^https?:\/\//i.test(base)) return new Response('CVX_API_BASE_URL invalid', { status: 500 })
    if (!apiKey) return new Response('CVX_API_KEY missing', { status: 500 })
    if (!detId) return new Response('detId missing', { status: 400 })

    const body = await req.text() // pass through JSON as-is
    const r = await fetch(`${base}/api/detections/${detId}`, {
      method: 'PATCH',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
      body,
      cache: 'no-store',
    })
    const ct = r.headers.get('content-type') || 'application/json'
    return new Response(await r.text(), { status: r.status, headers: { 'content-type': ct, 'cache-control': 'no-store' } })
  } catch (e) {
    console.error('[proxy:detections:patch] error', e)
    return new Response('Proxy error', { status: 500 })
  }
}

export async function DELETE(_req, { params }) {
  try {
    const base = (process.env.CVX_API_BASE_URL || '').replace(/\/+$/, '')
    const apiKey = process.env.CVX_API_KEY
    const detId = (await params).detId
    if (!/^https?:\/\//i.test(base)) return new Response('CVX_API_BASE_URL invalid', { status: 500 })
    if (!apiKey) return new Response('CVX_API_KEY missing', { status: 500 })
    if (!detId) return new Response('detId missing', { status: 400 })

    const r = await fetch(`${base}/api/detections/${detId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
    })
    // DELETE may return empty body; mirror status and provide empty json
    return new Response(JSON.stringify({}), { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
  } catch (e) {
    console.error('[proxy:detections:delete] error', e)
    return new Response('Proxy error', { status: 500 })
  }
}
