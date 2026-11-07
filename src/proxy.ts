import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const legacyRedirects: Record<string, string> = {
  "/kerala-packages/munnar-alleppey.html": "/packages/munnar-thekkady-alleppey-houseboat",
  "/tours/south-india-pilgrim-madurai.php": "/packages/madurai-rameswaram-kanyakumari-pilgrim",
  "/honeymoon-specials/wayanad-resort.asp": "/packages/wayanad-misty-hills-luxury-retreat",
  "/luxury/kumarakom-marari-7days": "/packages/kerala-grand-heritage-backwaters-beach",
  "/blog/houseboat-tips-kerala": "/blog/alleppey-houseboat-guide-first-timers",
  "/munnar-tour": "/packages/munnar-thekkady-alleppey-houseboat",
  "/kerala-enquiry": "/packages",
  "/contact-us.html": "/#enquiry",
};

export function proxy(request: NextRequest) {
  const redirectTarget = legacyRedirects[request.nextUrl.pathname];
  if (redirectTarget) return NextResponse.redirect(new URL(redirectTarget, request.url), 301);
  if (request.nextUrl.pathname.startsWith("/admin") && !request.cookies.has("spicecoast_session")) return NextResponse.redirect(new URL("/staff-login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
