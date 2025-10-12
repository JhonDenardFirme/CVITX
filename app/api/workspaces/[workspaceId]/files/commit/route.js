import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils"

export async function POST(req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const urlIn = new URL(req.url)
    const url = buildBackendUrl(`/workspaces/${wid}/files/commit?${urlIn.searchParams.toString()}`)
    const h = await authHeaders()
    const r = await fetch(url, { method: "POST", headers: h })
    return passThru(r)
  } catch (e) {
    console.error("[files:commit:POST] proxy error:", e)
    return new Response("Proxy error (commit).", { status: 500 })
  }
}
