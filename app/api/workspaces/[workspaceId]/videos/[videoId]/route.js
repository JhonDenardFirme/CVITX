import { authHeaders, buildBackendUrl, getWid, passThru } from "../../_utils"

export async function GET(_req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const { videoId } = await ctx.params
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}`)
    const h = await authHeaders()
    const r = await fetch(url, { headers: h, cache: "no-store" })
    return passThru(r)
  } catch (e) {
    console.error("[video:GET] proxy error:", e)
    return new Response("Proxy error (get video).", { status: 500 })
  }
}

export async function PATCH(req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const { videoId } = await ctx.params
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}`)
    const h = { ...(await authHeaders()), "Content-Type": "application/json" }
    const body = await req.text()
    const r = await fetch(url, { method: "PATCH", headers: h, body })
    return passThru(r)
  } catch (e) {
    console.error("[video:PATCH] proxy error:", e)
    return new Response("Proxy error (patch video).", { status: 500 })
  }
}

export async function DELETE(_req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const { videoId } = await ctx.params
    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}`)
    const h = await authHeaders()
    const r = await fetch(url, { method: "DELETE", headers: h })
    return passThru(r)
  } catch (e) {
    console.error("[video:DELETE] proxy error:", e)
    return new Response("Proxy error (delete video).", { status: 500 })
  }
}
