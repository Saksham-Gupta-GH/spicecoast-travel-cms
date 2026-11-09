import { NextResponse } from "next/server";
import { createTravellerSession, encodeTravellerSession, TRAVELLER_SESSION_COOKIE } from "@/lib/auth";
import { enforceAuthRateLimit } from "@/lib/auth-security";
import { initDatabase } from "@/lib/db";
import { authenticateTraveller } from "@/lib/traveller-portal";
import { internalServerError } from "@/lib/api-response";

export async function POST(request: Request) {
  await initDatabase();
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
  }

  const limited = await enforceAuthRateLimit(request, body.email);
  if (limited) return limited;

  try {
    const account = await authenticateTraveller(body.email, body.password);
    if (!account) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const session = createTravellerSession(account.id);
    const response = NextResponse.json({ success: true, user: { name: account.name } });
    response.cookies.set(TRAVELLER_SESSION_COOKIE, encodeTravellerSession(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error: unknown) {
    return internalServerError("POST /api/traveller/auth/login", error);
  }
}
