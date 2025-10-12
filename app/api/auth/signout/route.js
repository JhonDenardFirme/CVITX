// app/api/auth/signout/route.js
import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../_proxy/cookies";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
