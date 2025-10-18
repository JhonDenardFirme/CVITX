import { NextResponse } from "next/server";
import { apiFetch } from "../../_proxy/client";
import { cookies } from "next/headers";

const SESSION_COOKIE = process.env.CVX_SESSION_COOKIE || "cvx_session";

export async function GET() {
  // 1) Preferred: modern backend
  try {
    const me = await apiFetch("/users/me");
    return NextResponse.json(me);
  } catch (e) {
    // 2) Legacy alias
    if (e instanceof Response && e.status === 404) {
      try {
        const legacy = await apiFetch("/auth/me");
        return NextResponse.json(legacy);
      } catch (e2) {
        // 3) Best-effort: decode JWT from cookie to avoid breaking clients
        if (e2 instanceof Response && e2.status === 404) {
          try {
            const jar = cookies(); // sync
            const token = jar.get(SESSION_COOKIE)?.value;
            if (!token) return NextResponse.json(null); // 200 with null JSON
            const payloadB64 = token.split(".")[1];
            if (!payloadB64) return NextResponse.json(null);
            const json = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
            // Return minimal shape; callers already handle null-ish fields.
            return NextResponse.json({
              id: json.sub ?? null,
              email: json.email ?? null,
              role: json.role ?? null,
            });
          } catch {
            return NextResponse.json(null);
          }
        }
        if (e2 instanceof Response) return e2; // bubble backend status/message
        return new NextResponse("Unable to load current user", { status: 500 });
      }
    }
    if (e instanceof Response) return e; // bubble backend status/message
    return new NextResponse("Unable to load current user", { status: 500 });
  }
}
