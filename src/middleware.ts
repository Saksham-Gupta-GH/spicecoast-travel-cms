import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Sample legacy URLs mapped to modern clean URLs (simulating the 140 legacy URLs migration)
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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if requested path matches legacy redirect
  const redirectTarget = legacyRedirects[pathname];
  if (redirectTarget) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTarget;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
