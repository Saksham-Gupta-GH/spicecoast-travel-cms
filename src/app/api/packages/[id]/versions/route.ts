import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";

initDatabase();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole(["admin", "editor"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const versions = db.prepare(`
      SELECT * FROM package_versions
      WHERE package_id = ?
      ORDER BY version_number DESC
    `).all(id);

    return NextResponse.json({ success: true, versions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Rollback / Restore version
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole(["admin", "editor"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const { version_id } = await request.json();

    const versionRecord = db.prepare(`
      SELECT * FROM package_versions
      WHERE package_id = ? AND (id = ? OR version_number = ?)
    `).get(id, version_id, version_id) as any;

    if (!versionRecord) {
      return NextResponse.json({ success: false, error: "Version record not found" }, { status: 404 });
    }

    const snapshot = JSON.parse(versionRecord.snapshot_json);
    const existing = db.prepare("SELECT * FROM packages WHERE id = ?").get(id) as any;
    const restoredVersionNum = (existing.current_version || 1) + 1;

    db.prepare(`
      UPDATE packages SET
        title = COALESCE(?, title),
        tagline = COALESCE(?, tagline),
        description = COALESCE(?, description),
        duration_days = COALESCE(?, duration_days),
        duration_nights = COALESCE(?, duration_nights),
        destination_summary = COALESCE(?, destination_summary),
        category = COALESCE(?, category),
        hotel_standard_name = COALESCE(?, hotel_standard_name),
        hotel_deluxe_name = COALESCE(?, hotel_deluxe_name),
        hotel_luxury_name = COALESCE(?, hotel_luxury_name),
        current_version = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      snapshot.title,
      snapshot.tagline,
      snapshot.description,
      snapshot.duration_days,
      snapshot.duration_nights,
      snapshot.destination_summary,
      snapshot.category,
      snapshot.hotel_standard_name,
      snapshot.hotel_deluxe_name,
      snapshot.hotel_luxury_name,
      restoredVersionNum,
      id
    );

    // Save a new version node reflecting the rollback
    db.prepare(`
      INSERT INTO package_versions (package_id, version_number, snapshot_json, change_summary, created_by)
      VALUES (?, ?, ?, ?, 'usr_admin')
    `).run(
      id,
      restoredVersionNum,
      versionRecord.snapshot_json,
      `Rolled back to Version ${versionRecord.version_number}`
    );

    db.prepare(`
      INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details)
      VALUES ('Admin', 'PACKAGE_ROLLBACK', 'package', ?, ?)
    `).run(id, `Restored ${id} to historical state from Version ${versionRecord.version_number}`);

    return NextResponse.json({
      success: true,
      restored_to: versionRecord.version_number,
      new_version: restoredVersionNum,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
