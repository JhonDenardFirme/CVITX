import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils"

export async function POST(_req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const { videoId } = await ctx.params
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}/enqueue`)
    const h = await authHeaders()
    const r = await fetch(url, { method: "POST", headers: h })
    return passThru(r)
  } catch (e) {
    console.error("[video:enqueue:POST] proxy error:", e)
    return new Response("Proxy error (enqueue).", { status: 500 })
  }
}
