// app/api/workspaces/[workspaceId]/detections/route.js
import { authHeaders, buildBackendUrl, getWid, passThru } from "../_utils"

/**
 * EXPLAINS:
 * Thin proxy: Next API -> FastAPI GET /workspaces/{wid}/detections
 * - Preserves ?variant=&runId= and any pagination parameters.
 * - Returns a workspace-wide detections listing that can be consumed by
 *   IndexingRecords for "All videos in this workspace" scope.
 */
export async function GET(req, ctx) {
  try {
    const wid = await getWid(ctx.params)
    const { search } = new URL(req.url)
    const url = buildBackendUrl(`/workspaces/${wid}/detections${search || ""}`)
    const headers = await authHeaders()
    const r = await fetch(url, { headers, cache: "no-store" })
    return passThru(r)
  } catch (e) {
    console.error("[workspace-detections] proxy error:", e)
    return new Response("Proxy error (workspace detections).", { status: 500 })
  }
}
