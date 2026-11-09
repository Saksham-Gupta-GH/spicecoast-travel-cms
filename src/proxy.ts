import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LEGACY_REDIRECT_MAP } from "@/lib/legacy-redirects";

export function proxy(request: NextRequest) {
  const redirectTarget = LEGACY_REDIRECT_MAP.get(request.nextUrl.pathname);
  if (redirectTarget) return NextResponse.redirect(new URL(redirectTarget, request.url), 301);
  if (request.nextUrl.pathname.startsWith("/admin") && !request.cookies.has("spicecoast_session")) return NextResponse.redirect(new URL("/staff-login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
