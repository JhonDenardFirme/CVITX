import { NextResponse } from "next/server";

const SESSION = process.env.CVX_SESSION_COOKIE || "cvx_session";

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Protect these roots only
  const protectedRoots = ["/workspaces", "/w"];
  const isProtected = protectedRoots.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) return NextResponse.next();

  // Cookie-only check (no network)
  const token = req.cookies.get(SESSION)?.value;
  if (!token) {
    const url = new URL("/auth-signin", req.url);
    // preserve the original path + query so we can bounce back post-login
    url.searchParams.set("next", `${pathname}${search || ""}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workspaces/:path*", "/w/:path*"],
};
