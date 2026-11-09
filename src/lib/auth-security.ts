import "server-only";

import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import db from "./db";

const WINDOW_MINUTES = 10;
const MAX_ATTEMPTS_PER_WINDOW = 10;

function requestIdentity(request: Request, email: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.SESSION_SECRET || "local-auth-rate-limit-salt";
  return createHash("sha256")
    .update(`${salt}|${ip}|${email.trim().toLowerCase()}`)
    .digest("hex");
}

export async function enforceAuthRateLimit(request: Request, email: string) {
  const identityHash = requestIdentity(request, email);
  const result = await db.prepare(`
    INSERT INTO auth_rate_limits (identity_hash, window_started_at, request_count, updated_at)
    VALUES (?, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (identity_hash) DO UPDATE SET
      request_count = CASE
        WHEN auth_rate_limits.window_started_at < CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 1
        ELSE auth_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN auth_rate_limits.window_started_at < CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN CURRENT_TIMESTAMP
        ELSE auth_rate_limits.window_started_at
      END,
      updated_at = CURRENT_TIMESTAMP
    RETURNING request_count
  `).get(identityHash) as { request_count: number };

  if (result.request_count <= MAX_ATTEMPTS_PER_WINDOW) return null;
  return NextResponse.json(
    { success: false, error: "Too many sign-in attempts. Please try again in 10 minutes." },
    { status: 429, headers: { "Retry-After": String(WINDOW_MINUTES * 60) } }
  );
}
