import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { triageEnquiry } from "@/lib/ai-engine";
import { hasRole } from "@/lib/auth";

export async function GET(request: Request) {
  await initDatabase();
  if (!(await hasRole(["admin", "consultant"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");

    let query = `
      SELECT e.*, p.title as package_title, u.name as consultant_name
      FROM enquiries e
      LEFT JOIN packages p ON e.package_id = p.id
      LEFT JOIN users u ON e.assigned_consultant_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== "All") {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    if (source && source !== "All") {
      query += ` AND e.source = ?`;
      params.push(source);
    }

    query += ` ORDER BY e.created_at DESC`;

    const enquiries = await db.prepare(query).all(...params);

    const parsed = enquiries.map((enq: any) => ({
      ...enq,
      suggested_packages: JSON.parse(enq.suggested_package_ids_json || "[]"),
      human_corrections: enq.human_corrections_json ? JSON.parse(enq.human_corrections_json) : null,
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await initDatabase();
  try {
    const body = await request.json();
    const {
      traveller_name,
      email,
      phone,
      raw_message,
      package_id = null,
      source = "web_form",
      dpdp_consent = false,
    } = body;

    const validSources = ["web_form", "whatsapp", "email", "phone", "chat"];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      typeof traveller_name !== "string" || traveller_name.trim().length < 2 || traveller_name.length > 100 ||
      typeof email !== "string" || !emailPattern.test(email) || email.length > 200 ||
      typeof raw_message !== "string" || raw_message.trim().length < 10 || raw_message.length > 3000 ||
      (phone && (typeof phone !== "string" || phone.length > 30)) ||
      !validSources.includes(source)
    ) {
      return NextResponse.json({ success: false, error: "Missing required enquiry fields" }, { status: 400 });
    }
    if (source === "web_form" && dpdp_consent !== true) {
      return NextResponse.json({ success: false, error: "Consent is required for digital follow-up" }, { status: 400 });
    }

    // Auto-generate enquiry ID
    const count = (await db.prepare("SELECT COUNT(*)::int as c FROM enquiries").get() as any).c + 1;
    const enquiryId = `ENQ-2026-${count.toString().padStart(3, "0")}`;

    // Execute AI Triage Pipeline
    const triageResult = await triageEnquiry(raw_message, traveller_name, enquiryId);

    const insert = await db.prepare(`
      INSERT INTO enquiries (
        id, package_id, source, traveller_name, email, phone, raw_message,
        status, assigned_consultant_id, dpdp_consent_given,
        ai_destination, ai_travel_dates, ai_adults, ai_kids, ai_budget_inr,
        ai_special_requests, ai_confidence, ai_provider, ai_model, ai_fallback_reason, is_human_reviewed,
        suggested_package_ids_json, ai_draft_reply
      ) VALUES (
        @id, @package_id, @source, @traveller_name, @email, @phone, @raw_message,
        'New', 'usr_consultant', @dpdp_consent_given,
        @ai_destination, @ai_travel_dates, @ai_adults, @ai_kids, @ai_budget_inr,
        @ai_special_requests, @ai_confidence, @ai_provider, @ai_model, @ai_fallback_reason, 0,
        @suggested_package_ids_json, @ai_draft_reply
      )
    `);

    await insert.run({
      id: enquiryId,
      package_id: package_id || (triageResult.suggestedPackages[0]?.id ?? null),
      source,
      traveller_name: traveller_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || "Not provided",
      raw_message: raw_message.trim(),
      dpdp_consent_given: dpdp_consent ? 1 : 0,
      ai_destination: triageResult.extracted.destination,
      ai_travel_dates: triageResult.extracted.travelDates,
      ai_adults: triageResult.extracted.adults,
      ai_kids: triageResult.extracted.kids,
      ai_budget_inr: triageResult.extracted.budgetInr,
      ai_special_requests: triageResult.extracted.specialRequests,
      ai_confidence: triageResult.extracted.confidence,
      ai_provider: triageResult.provider,
      ai_model: triageResult.model,
      ai_fallback_reason: triageResult.fallbackReason,
      suggested_package_ids_json: JSON.stringify(triageResult.suggestedPackages.map(p => p.id)),
      ai_draft_reply: triageResult.draftReply,
    });

    // Record activity
    await db.prepare(`
      INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details)
      VALUES ('AI Automation', 'ENQUIRY_RECEIVED', 'enquiry', ?, ?)
    `).run(
      enquiryId,
      `New ${source} enquiry from ${traveller_name}. ${triageResult.provider} (${triageResult.model}) extracted ${triageResult.extracted.destination} (Budget: ₹${triageResult.extracted.budgetInr ? triageResult.extracted.budgetInr.toLocaleString() : 'N/A'}).`
    );

    return NextResponse.json({
      success: true,
      enquiry_id: enquiryId,
      instant_acknowledgement: triageResult.acknowledgementTemplate,
      extracted: triageResult.extracted,
      ai_provider: triageResult.provider,
      ai_model: triageResult.model,
      fallback_reason: triageResult.fallbackReason,
      suggested_packages: triageResult.suggestedPackages,
      draft_reply: triageResult.draftReply,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
