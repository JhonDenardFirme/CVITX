import { NextResponse } from "next/server";
import { setSessionCookie } from "../../_proxy/cookies";

const BASE = process.env.CVX_API_BASE_URL;
const API_KEY = process.env.CVX_API_KEY || "";

export async function POST(req) {
  try {
    if (!BASE) {
      console.error("[signin] CVX_API_BASE_URL is not set");
      return new NextResponse("Server misconfigured", { status: 500 });
    }

    const body = await req.json(); // { email, password }
    console.log("[signin] incoming email:", body?.email);

    const tryLogin = async (path) => {
      return fetch(`${BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
        },
        body: JSON.stringify(body),
      });
    };

    // First try the canonical route; if not found, fall back.
    let res = await tryLogin("/auth/login");
    if (res.status === 404) {
      res = await tryLogin("/login");
    }

    const text = await res.text();

    if (!res.ok) {
      console.error("[signin] backend error", res.status, text);
      return new NextResponse(text || "Login failed", { status: res.status });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[signin] JSON parse error. body:", text);
      return new NextResponse("Bad login response", { status: 502 });
    }

    const token = data.access_token || data.token;
    if (!token) {
      console.error("[signin] missing access_token in response", data);
      return new NextResponse("Missing access token", { status: 502 });
    }

    await setSessionCookie(token);
    return NextResponse.json(data.user || null);
  } catch (err) {
    console.error("[signin] crashed:", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
