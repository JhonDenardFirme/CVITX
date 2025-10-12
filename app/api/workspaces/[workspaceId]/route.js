// app/api/workspaces/[workspaceId]/route.js
import { NextResponse } from "next/server";
import { apiFetch } from "../../_proxy/client";
import { cookies } from "next/headers";

const BASE = process.env.CVX_API_BASE_URL;
const API_KEY = process.env.CVX_API_KEY || "";
const SESSION_COOKIE = process.env.CVX_SESSION_COOKIE || "cvx_session";

// GET /api/workspaces/:workspaceId -> backend GET /workspaces/:id
export async function GET(_req, context) {
  const { workspaceId } = await context.params; // Next 15: must await
  const out = await apiFetch(`/workspaces/${workspaceId}`);
  return NextResponse.json(out);
}

// PATCH /api/workspaces/:workspaceId -> backend PATCH /workspaces/:id
export async function PATCH(req, context) {
  const { workspaceId } = await context.params;
  const body = await req.json(); // { title?, description? }
  try {
    const out = await apiFetch(`/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
    return NextResponse.json(out);
  } catch (e) {
    if (e instanceof Response) {
      const text = await e.text();
      return new NextResponse(text || "Upstream error", { status: e.status });
    }
    throw e;
  }
}

// DELETE /api/workspaces/:workspaceId -> backend DELETE /workspaces/:id
export async function DELETE(_req, context) {
  const { workspaceId } = await context.params;

  // Preserve upstream 204 exactly
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  const res = await fetch(`${BASE}/workspaces/${workspaceId}`, {
    method: "DELETE",
    headers: {
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const text = await res.text();
  return new NextResponse(text || "Upstream error", { status: res.status });
}
