import { NextResponse } from "next/server";
import { createTravellerSession, encodeTravellerSession, TRAVELLER_SESSION_COOKIE } from "@/lib/auth";
import { enforceAuthRateLimit } from "@/lib/auth-security";
import { initDatabase } from "@/lib/db";
import { registerTraveller } from "@/lib/traveller-portal";
import { internalServerError } from "@/lib/api-response";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

export async function POST(request: Request) {
  await initDatabase();
  let body: { name?: unknown; email?: unknown; password?: unknown; quoteNumber?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    typeof body.quoteNumber !== "string"
  ) {
    return NextResponse.json({ success: false, error: "All registration fields are required" }, { status: 400 });
  }

  const name = body.name.trim();
  const email = body.email.trim();
  const quoteNumber = body.quoteNumber.trim();
  if (name.length < 2 || name.length > 80 || !EMAIL_PATTERN.test(email) || quoteNumber.length > 40) {
    return NextResponse.json({ success: false, error: "Please check your name, email and quote number" }, { status: 400 });
  }
  if (!PASSWORD_PATTERN.test(body.password)) {
    return NextResponse.json(
      { success: false, error: "Password must be 12+ characters with uppercase, lowercase, number and symbol" },
      { status: 400 }
    );
  }

  const limited = await enforceAuthRateLimit(request, email);
  if (limited) return limited;

  try {
    const account = await registerTraveller({ name, email, password: body.password, quoteNumber });
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
    if (error instanceof Error && /match|already linked|already exists/i.test(error.message)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    return internalServerError("POST /api/traveller/auth/register", error);
  }
}
