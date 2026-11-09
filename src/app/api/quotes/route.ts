import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";
import { internalServerError } from "@/lib/api-response";

export async function GET() {
  await initDatabase();
  if (!(await hasRole(["admin", "consultant"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const quotes = await db.prepare(`
      SELECT q.*, p.title as package_title
      FROM quotes q
      LEFT JOIN packages p ON q.package_id = p.id
      ORDER BY q.created_at DESC
    `).all();

    return NextResponse.json({ success: true, data: quotes });
  } catch (error: unknown) {
    return internalServerError("GET /api/quotes", error);
  }
}

export async function POST(request: Request) {
  await initDatabase();
  if (!(await hasRole(["admin", "consultant"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const {
      enquiry_id = null,
      package_id,
      traveller_name,
      email,
      phone,
      travel_date,
      adults_count = 2,
      kids_count = 0,
      selected_tier = "Deluxe",
      custom_price_pp = null,
      notes = "",
      created_by = "usr_consultant",
    } = body;

    if (!package_id || !traveller_name || !email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const pkg = await db.prepare("SELECT * FROM packages WHERE id = ?").get(package_id) as any;
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    // Determine price per person from price table if not overridden
    let pricePP = custom_price_pp;
    if (!pricePP) {
      const priceRow = await db.prepare(`
        SELECT * FROM seasonal_prices
        WHERE package_id = ?
        LIMIT 1
      `).get(package_id) as any;

      if (priceRow) {
        if (selected_tier === "Standard") pricePP = priceRow.standard_price_pp;
        else if (selected_tier === "Luxury") pricePP = priceRow.luxury_price_pp;
        else pricePP = priceRow.deluxe_price_pp;
      } else {
        pricePP = 24900;
      }
    }

    const adults = parseInt(adults_count, 10) || 2;
    const kids = parseInt(kids_count, 10) || 0;

    // Base subtotal (adults + 50% for kids extra bed)
    const totalEffectivePax = adults + (kids * 0.5);
    const totalWithGst = Math.round(pricePP * totalEffectivePax);
    const subtotal = Math.round(totalWithGst / 1.05);
    const gstAmount = totalWithGst - subtotal;

    const count = (await db.prepare("SELECT COUNT(*)::int as c FROM quotes").get() as any).c + 1;
    const quoteId = `QUO-2026-${count.toString().padStart(4, "0")}`;
    const quoteNumber = `SCH-2026-Q${count.toString().padStart(4, "0")}`;

    await db.prepare(`
      INSERT INTO quotes (
        id, enquiry_id, package_id, quote_number, traveller_name, email, phone,
        travel_date, adults_count, kids_count, selected_tier, price_per_person,
        subtotal_amount, gst_percent, gst_amount, grand_total, notes, status, created_by
      ) VALUES (
        @id, @enquiry_id, @package_id, @quote_number, @traveller_name, @email, @phone,
        @travel_date, @adults_count, @kids_count, @selected_tier, @price_per_person,
        @subtotal_amount, 5.0, @gst_amount, @grand_total, @notes, 'Sent', @created_by
      )
    `).run({
      id: quoteId,
      enquiry_id,
      package_id,
      quoteNumber,
      quote_number: quoteNumber,
      traveller_name,
      email,
      phone: phone || "",
      travel_date: travel_date || new Date().toISOString().split("T")[0],
      adults_count: adults,
      kids_count: kids,
      selected_tier,
      price_per_person: pricePP,
      subtotal_amount: subtotal,
      gst_amount: gstAmount,
      grand_total: totalWithGst,
      notes: notes || `Valid for travel starting ${travel_date || "as requested"}. Prices on twin-sharing basis with 5% GST included.`,
      created_by,
    });

    // If linked to enquiry, update enquiry status to Quoted
    if (enquiry_id) {
      await db.prepare(`UPDATE enquiries SET status = 'Quoted' WHERE id = ?`).run(enquiry_id);
    }

    await db.prepare(`
      INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details)
      VALUES ('Mathew Varghese', 'QUOTE_CREATED', 'quote', ?, ?)
    `).run(quoteId, `Generated official quote #${quoteNumber} for ${traveller_name} (Total: ₹${totalWithGst.toLocaleString("en-IN")})`);

    return NextResponse.json({
      success: true,
      quote_id: quoteId,
      quote_number: quoteNumber,
      grand_total: totalWithGst,
    });
  } catch (error: unknown) {
    return internalServerError("POST /api/quotes", error);
  }
}
