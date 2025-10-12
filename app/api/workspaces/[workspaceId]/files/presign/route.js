import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils"

export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params) // await on Next 15
    const url = buildBackendUrl(`/workspaces/${wid}/files/presign`)
    const h = { ...(await authHeaders()), "Content-Type": "application/json" }
    const body = await req.text()
    const r = await fetch(url, { method: "POST", headers: h, body })
    return passThru(r)
  } catch (e) {
    console.error("[files:presign:POST] proxy error:", e)
    return new Response("Proxy error (presign).", { status: 500 })
  }
}
