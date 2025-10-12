import { authHeaders, buildBackendUrl, getWid, passThru } from "../../../_utils"

export async function GET(_req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const { videoId } = await ctx.params
    const h = await authHeaders()

    const url = buildBackendUrl(`/workspaces/${wid}/videos/${videoId}/url`)
    const r = await fetch(url, { headers: h, cache: "no-store" })
    return passThru(r)
  } catch (e) {
    console.error("[video:url] proxy error:", e)
    return new Response(JSON.stringify({ error: "Proxy error (preview url)." }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    })
  }
}
