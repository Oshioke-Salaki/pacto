import { NextResponse } from "next/server";

/**
 * Security headers for every HTML response. Blink API routes are excluded
 * because they must stay CORS-open for wallets and X to unfurl them.
 */
export function proxy() {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: ["/((?!api/actions|actions.json|_next/static|_next/image|brand|favicon.ico).*)"],
};
