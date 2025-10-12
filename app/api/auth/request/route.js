import { NextResponse } from "next/server";
import { apiFetch } from "../../_proxy/client";

export async function POST(req) {
  try {
    const body = await req.json(); // { email, name, org, ... }
    const out = await apiFetch("/auth/request-access", { method: "POST", body });
    return NextResponse.json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    return new NextResponse("Request failed", { status: 500 });
  }
}
