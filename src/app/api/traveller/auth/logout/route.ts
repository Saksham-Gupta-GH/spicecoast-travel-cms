import { NextResponse } from "next/server";
import { TRAVELLER_SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/traveller-login", request.url), 303);
  response.cookies.set(TRAVELLER_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
