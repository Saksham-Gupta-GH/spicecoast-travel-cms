import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "spicecoast_session";
export type StaffRole = "admin" | "editor" | "consultant";
export type StaffSession = { userId: string; name: string; email: string; role: StaffRole; expiresAt: number };

const DEMO_PASSWORD = "SpiceCoastDemo!2026";
const staffAccounts: Record<string, Omit<StaffSession, "expiresAt"> & { password: string }> = {
  "admin@spicecoast.in": { userId: "usr_admin", name: "Jawahar Kurian", email: "admin@spicecoast.in", role: "admin", password: process.env.DEMO_ADMIN_PASSWORD ?? DEMO_PASSWORD },
  "editor@spicecoast.in": { userId: "usr_editor", name: "Ananya Pillai", email: "editor@spicecoast.in", role: "editor", password: process.env.DEMO_EDITOR_PASSWORD ?? DEMO_PASSWORD },
  "consultant@spicecoast.in": { userId: "usr_consultant", name: "Mathew Varghese", email: "consultant@spicecoast.in", role: "consultant", password: process.env.DEMO_CONSULTANT_PASSWORD ?? DEMO_PASSWORD },
};

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be configured in production");
  return "local-development-only-session-secret";
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function authenticateStaff(email: string, password: string): StaffSession | null {
  const account = staffAccounts[email.trim().toLowerCase()];
  if (!account) return null;
  const supplied = Buffer.from(password);
  const expected = Buffer.from(account.password);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  return { userId: account.userId, name: account.name, email: account.email, role: account.role, expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
}

export function encodeSession(session: StaffSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value?: string): StaffSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StaffSession;
    return session.email && session.role && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function getStaffSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function hasRole(allowedRoles: StaffRole[]) {
  const session = await getStaffSession();
  return session && allowedRoles.includes(session.role) ? session : null;
}
