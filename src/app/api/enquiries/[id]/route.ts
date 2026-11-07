import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";

initDatabase();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole(["admin", "consultant"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const enquiry = db.prepare(`
      SELECT e.*, p.title as package_title, p.slug as package_slug, u.name as consultant_name
      FROM enquiries e
      LEFT JOIN packages p ON e.package_id = p.id
      LEFT JOIN users u ON e.assigned_consultant_id = u.id
      WHERE e.id = ?
    `).get(id) as any;

    if (!enquiry) {
      return NextResponse.json({ success: false, error: "Enquiry not found" }, { status: 404 });
    }

    const suggestedIds = JSON.parse(enquiry.suggested_package_ids_json || "[]");
    let suggestedPackages: any[] = [];
    if (suggestedIds.length > 0) {
      const placeholders = suggestedIds.map(() => "?").join(",");
      suggestedPackages = db.prepare(`
        SELECT id, title, slug, duration_days, duration_nights, category, destination_summary
        FROM packages
        WHERE id IN (${placeholders})
      `).all(...suggestedIds);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...enquiry,
        suggested_packages: suggestedPackages,
        human_corrections: enquiry.human_corrections_json ? JSON.parse(enquiry.human_corrections_json) : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole(["admin", "consultant"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = db.prepare("SELECT * FROM enquiries WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: "Enquiry not found" }, { status: 404 });
    }

    const {
      status,
      assigned_consultant_id,
      ai_destination,
      ai_travel_dates,
      ai_adults,
      ai_kids,
      ai_budget_inr,
      ai_special_requests,
      is_human_reviewed = 1,
      human_corrections,
      final_reply,
      internal_notes,
      mark_sent = false,
    } = body;

    let repliedAt = existing.replied_at;
    if (mark_sent) {
      repliedAt = new Date().toISOString();
    }

    db.prepare(`
      UPDATE enquiries SET
        status = COALESCE(@status, status),
        assigned_consultant_id = COALESCE(@assigned_consultant_id, assigned_consultant_id),
        ai_destination = COALESCE(@ai_destination, ai_destination),
        ai_travel_dates = COALESCE(@ai_travel_dates, ai_travel_dates),
        ai_adults = COALESCE(@ai_adults, ai_adults),
        ai_kids = COALESCE(@ai_kids, ai_kids),
        ai_budget_inr = COALESCE(@ai_budget_inr, ai_budget_inr),
        ai_special_requests = COALESCE(@ai_special_requests, ai_special_requests),
        is_human_reviewed = @is_human_reviewed,
        human_corrections_json = @human_corrections_json,
        final_reply = COALESCE(@final_reply, final_reply),
        replied_at = @replied_at,
        internal_notes = COALESCE(@internal_notes, internal_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({
      id,
      status: status || (mark_sent ? "Quoted" : existing.status),
      assigned_consultant_id,
      ai_destination,
      ai_travel_dates,
      ai_adults,
      ai_kids,
      ai_budget_inr,
      ai_special_requests,
      is_human_reviewed: is_human_reviewed ? 1 : 0,
      human_corrections_json: human_corrections ? JSON.stringify(human_corrections) : existing.human_corrections_json,
      final_reply,
      replied_at: repliedAt,
      internal_notes,
    });

    // Record activity
    if (mark_sent) {
      db.prepare(`
        INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details)
        VALUES ('Mathew Varghese (Consultant)', 'REPLY_SENT', 'enquiry', ?, ?)
      `).run(id, `Approved and sent tailored reply to ${existing.traveller_name}`);
    } else {
      db.prepare(`
        INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details)
        VALUES ('Consultant', 'ENQUIRY_UPDATED', 'enquiry', ?, ?)
      `).run(id, `Updated enquiry ${id}: status=${status || existing.status}, human_reviewed=${is_human_reviewed}`);
    }

    return NextResponse.json({ success: true, message: "Enquiry updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
