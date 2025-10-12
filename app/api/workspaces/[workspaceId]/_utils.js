import { cookies as nextCookies, headers as nextHeaders } from "next/headers"

/* Resolve backend origin from any of these envs (first non-empty wins) */
function envPick() {
  return (
    process.env.CVX_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    ""
  )
}

export const API_BASE = envPick()

/** Build absolute backend URL or throw a helpful error */
export function buildBackendUrl(path) {
  if (!API_BASE || !/^https?:\/\//i.test(API_BASE)) {
    throw new Error(
      "BACKEND_URL / NEXT_PUBLIC_API_BASE[_URL] / CVX_API_BASE_URL is missing or invalid (must start with http/https)."
    )
  }
  const base = API_BASE.replace(/\/+$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

/** Next 15: headers() & cookies() must be awaited */
export async function authHeaders() {
  const hdrs = await nextHeaders()

  // 1) Authorization header forwarded from the client (preferred)
  const incomingAuth = hdrs.get("authorization")
  if (incomingAuth) return { Authorization: incomingAuth }

  // 2) Cookie-based session → get cookie name from env or default
  const ck = await nextCookies()
  const cookieName = process.env.CVX_SESSION_COOKIE || "access_token"

  // Try CVX cookie first, then a common "access_token" fallback
  const tokenFromCvx = ck.get(cookieName)?.value
  const tokenFromDefault = ck.get("access_token")?.value
  const token = tokenFromCvx || tokenFromDefault

  if (token) return { Authorization: `Bearer ${token}` }

  // 3) No auth → backend may return 401. We pass it through verbatim.
  return {}
}

/** Next 15: params must be awaited */
export async function getWid(params) {
  const p = await params
  return p.workspaceId
}

/** Pass backend response through with same status + content-type + no-store */
export function passThru(backendRes) {
  const ct = backendRes.headers.get("content-type") ?? "application/json"
  const hdrs = new Headers({ "content-type": ct, "cache-control": "no-store" })
  // Copy a couple of useful headers if present (not strictly required for JSON)
  const vary = backendRes.headers.get("vary")
  if (vary) hdrs.set("vary", vary)
  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: hdrs,
  })
}
