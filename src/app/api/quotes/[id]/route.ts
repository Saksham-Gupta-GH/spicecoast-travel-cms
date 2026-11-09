import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { getStaffSession, getTravellerSession } from "@/lib/auth";
import { travellerOwnsQuote } from "@/lib/traveller-portal";
import { internalServerError } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDatabase();
  try {
    const { id } = await params;
    const [staffSession, travellerSession] = await Promise.all([
      getStaffSession(),
      getTravellerSession(),
    ]);
    if (!staffSession && !travellerSession) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (!staffSession && travellerSession && !(await travellerOwnsQuote(travellerSession.userId, id))) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const quote = await db.prepare(`
      SELECT q.*, p.title as package_title, p.slug as package_slug,
             p.destination_summary, p.duration_days, p.duration_nights,
             p.destinations_json,
             p.inclusions_json, p.exclusions_json, p.hotel_standard_name,
             p.hotel_deluxe_name, p.hotel_luxury_name
      FROM quotes q
      JOIN packages p ON q.package_id = p.id
      WHERE q.id = ? OR q.quote_number = ?
    `).get(id, id) as any;

    if (!quote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...quote,
        inclusions: JSON.parse(quote.inclusions_json || "[]"),
        exclusions: JSON.parse(quote.exclusions_json || "[]"),
        destinations: JSON.parse(quote.destinations_json || "[]"),
      },
    });
  } catch (error: unknown) {
    return internalServerError("GET /api/quotes/[id]", error);
  }
}
