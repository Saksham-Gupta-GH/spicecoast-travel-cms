import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";
import { internalServerError } from "@/lib/api-response";

export async function GET() {
  await initDatabase();
  if (!(await hasRole(["admin"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const logs = await db.prepare(`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    return internalServerError("GET /api/activity-logs", error);
  }
}
