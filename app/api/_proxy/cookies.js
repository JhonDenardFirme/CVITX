// app/api/_proxy/cookies.js
import { cookies } from "next/headers";

const NAME = process.env.CVX_SESSION_COOKIE || "cvx_session";
const DOMAIN = process.env.CVX_COOKIE_DOMAIN || "";
const SECURE = String(process.env.CVX_COOKIE_SECURE) === "true";

export async function setSessionCookie(token, maxAgeSec = 60 * 60 * 24 * 7 * 2) {
  const jar = await cookies();
  const attrs = {
    httpOnly: true,
    sameSite: "lax",
    secure: SECURE,
    maxAge: maxAgeSec,
    path: "/",
  };
  // Avoid setting Domain=localhost (can break in dev)
  if (DOMAIN && DOMAIN !== "localhost") attrs.domain = DOMAIN;
  jar.set(NAME, token, attrs);
}

export async function clearSessionCookie() {
  const jar = await cookies();
  const attrs = { path: "/" };
  if (DOMAIN && DOMAIN !== "localhost") attrs.domain = DOMAIN;
  jar.delete(NAME, attrs);
}
