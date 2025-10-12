import { authHeaders, buildBackendUrl, getWid, passThru } from "../_utils"

export async function GET(_req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const url = buildBackendUrl(`/workspaces/${wid}/videos`)
    const h = await authHeaders()
    const r = await fetch(url, { headers: h, cache: "no-store" })
    return passThru(r)
  } catch (e) {
    console.error("[videos:GET] proxy error:", e)
    return new Response("Proxy error (videos list). Check API base URL and auth.", { status: 500 })
  }
}

export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const url = buildBackendUrl(`/workspaces/${wid}/videos`)
    const h = { ...(await authHeaders()), "Content-Type": "application/json" }
    const body = await req.text()
    const r = await fetch(url, { method: "POST", headers: h, body })
    return passThru(r)
  } catch (e) {
    console.error("[videos:POST] proxy error:", e)
    return new Response("Proxy error (create video).", { status: 500 })
  }
}
