import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";

initDatabase();

export async function GET() {
  try {
    const logs = db.prepare(`
      SELECT * FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
