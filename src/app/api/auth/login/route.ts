import { NextResponse } from "next/server";
import { authenticateStaff, encodeSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 }); }
  if (typeof body.email !== "string" || typeof body.password !== "string") return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
  const session = authenticateStaff(body.email, body.password);
  if (!session) return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
  const response = NextResponse.json({ success: true, user: session });
  response.cookies.set(SESSION_COOKIE, encodeSession(session), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 60 * 60 });
  return response;
}
