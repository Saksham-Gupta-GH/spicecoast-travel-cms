import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { internalServerError } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDatabase();
  try {
    const { id } = await params;
    const quote = await db.prepare(`
      SELECT q.*, p.title as package_title, p.slug as package_slug,
             p.destination_summary, p.duration_days, p.duration_nights,
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
      },
    });
  } catch (error: unknown) {
    return internalServerError("GET /api/quotes/[id]", error);
  }
}
