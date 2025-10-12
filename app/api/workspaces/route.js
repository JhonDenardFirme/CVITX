// app/api/workspaces/route.js
import { NextResponse } from "next/server";
import { apiFetch } from "../_proxy/client";

function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.items)) return x.items;
  return [];
}

// LIST: GET /api/workspaces -> backend /users/me/workspaces (fallback /workspaces)
export async function GET() {
  try {
    const a = await apiFetch("/users/me/workspaces");
    return NextResponse.json(asArray(a));
  } catch (e) {
    if (e instanceof Response && e.status === 404) {
      try {
        const b = await apiFetch("/workspaces");
        return NextResponse.json(asArray(b));
      } catch (e2) {
        if (e2 instanceof Response) return e2;
        console.error("[workspaces][GET] unexpected error:", e2);
        return new NextResponse("Upstream error", { status: 502 });
      }
    }
    if (e instanceof Response) return e;
    console.error("[workspaces][GET] unexpected error:", e);
    return new NextResponse("Upstream error", { status: 502 });
  }
}

// CREATE: POST /api/workspaces -> backend POST /workspaces
export async function POST(req) {
  const { title = null, description = null } = await req.json(); // no 'code'
  try {
    const out = await apiFetch("/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { title, description },
    });
    return NextResponse.json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[workspaces][POST] unexpected error:", e);
    return new NextResponse("Upstream error", { status: 502 });
  }
}
