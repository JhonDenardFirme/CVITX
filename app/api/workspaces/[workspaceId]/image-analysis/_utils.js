// app/api/workspaces/[workspaceId]/image-analysis/_utils.js
import { headers } from "next/headers";

export function buildBackendUrl(path = "") {
  const base =
    process.env.API_BASE?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "");
  if (!base) throw new Error("API base URL not configured (set API_BASE).");
  if (!path.startsWith("/")) path = `/${path}`;
  return `${base}${path}`;
}

export async function authHeaders() {
  const incoming = headers();
  const h = new Headers();
  const auth = incoming.get("authorization") || incoming.get("Authorization");
  if (auth) h.set("authorization", auth);
  // Optional trace header pass-through
  const xreq = incoming.get("x-request-id");
  if (xreq) h.set("x-request-id", xreq);
  return h;
}

export async function getWid(params) {
  // Normalize workspaceId param (string)
  const wid = params?.workspaceId || params?.wid;
  if (!wid) throw new Error("workspaceId is required.");
  return wid;
}

export function passThru(r) {
  // Transparent pass-through with a safe header subset
  const out = new Response(r.body, {
    status: r.status,
    statusText: r.statusText,
  });
  for (const [k, v] of r.headers) {
    const key = k.toLowerCase();
    if (
      key === "content-type" ||
      key === "cache-control" ||
      key.startsWith("x-")
    ) {
      out.headers.set(k, v);
    }
  }
  return out;
}
