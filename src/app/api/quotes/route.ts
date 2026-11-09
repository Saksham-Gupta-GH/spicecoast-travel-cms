import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";
import { internalServerError } from "@/lib/api-response";
import { randomUUID } from "node:crypto";

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
  const staff = await hasRole(["admin", "consultant"]);
  if (!staff) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
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
      notes = "",
    } = body;

    const allowedTiers = new Set(["Standard", "Deluxe", "Luxury"]);
    if (
      typeof package_id !== "string" || !package_id ||
      typeof traveller_name !== "string" || traveller_name.trim().length < 2 || traveller_name.length > 80 ||
      typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160 ||
      !allowedTiers.has(selected_tier)
    ) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const pkg = await db.prepare("SELECT * FROM packages WHERE id = ?").get(package_id) as any;
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    // Quote prices always come from the package table, selected by travel month.
    const requestedDate = typeof travel_date === "string" ? new Date(`${travel_date}T00:00:00Z`) : new Date();
    const effectiveTravelDate = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;
    const travelMonth = effectiveTravelDate.getUTCMonth() + 1;
    const priceRow = await db.prepare(`
      SELECT * FROM seasonal_prices
      WHERE package_id = ?
        AND (
          (start_month <= end_month AND ? BETWEEN start_month AND end_month)
          OR (start_month > end_month AND (? >= start_month OR ? <= end_month))
        )
      LIMIT 1
    `).get(package_id, travelMonth, travelMonth, travelMonth) as any
      ?? await db.prepare("SELECT * FROM seasonal_prices WHERE package_id = ? LIMIT 1").get(package_id) as any;

    if (!priceRow) {
      return NextResponse.json({ success: false, error: "Package pricing is not configured" }, { status: 409 });
    }
    const pricePP = selected_tier === "Standard"
      ? priceRow.standard_price_pp
      : selected_tier === "Luxury"
        ? priceRow.luxury_price_pp
        : priceRow.deluxe_price_pp;

    const adults = parseInt(adults_count, 10) || 2;
    const kids = parseInt(kids_count, 10) || 0;
    if (adults < 1 || adults > 30 || kids < 0 || kids > 20) {
      return NextResponse.json({ success: false, error: "Traveller counts are outside the supported range" }, { status: 400 });
    }

    // Base subtotal (adults + 50% for kids extra bed)
    const totalEffectivePax = adults + (kids * 0.5);
    const totalWithGst = Math.round(pricePP * totalEffectivePax);
    const subtotal = Math.round(totalWithGst / 1.05);
    const gstAmount = totalWithGst - subtotal;

    const uniqueSuffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const quoteId = `QUO-${uniqueSuffix}`;
    const quoteNumber = `SCH-2026-${uniqueSuffix}`;
    const traveller = await db.prepare(`
      SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND role = 'traveller'
    `).get(email) as { id: string } | undefined;

    await db.prepare(`
      INSERT INTO quotes (
        id, enquiry_id, package_id, quote_number, traveller_name, email, phone,
        travel_date, adults_count, kids_count, selected_tier, price_per_person,
        subtotal_amount, gst_percent, gst_amount, grand_total, notes, status, created_by,
        traveller_user_id
      ) VALUES (
        @id, @enquiry_id, @package_id, @quote_number, @traveller_name, @email, @phone,
        @travel_date, @adults_count, @kids_count, @selected_tier, @price_per_person,
        @subtotal_amount, 5.0, @gst_amount, @grand_total, @notes, 'Sent', @created_by,
        @traveller_user_id
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
      travel_date: effectiveTravelDate.toISOString().split("T")[0],
      adults_count: adults,
      kids_count: kids,
      selected_tier,
      price_per_person: pricePP,
      subtotal_amount: subtotal,
      gst_amount: gstAmount,
      grand_total: totalWithGst,
      notes: notes || `Valid for travel starting ${travel_date || "as requested"}. Prices on twin-sharing basis with 5% GST included.`,
      created_by: staff.userId,
      traveller_user_id: traveller?.id || null,
    });

    // If linked to enquiry, update enquiry status to Quoted
    if (enquiry_id) {
      await db.prepare(`UPDATE enquiries SET status = 'Quoted' WHERE id = ?`).run(enquiry_id);
    }

    await db.prepare(`
      INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, details)
      VALUES (?, ?, 'QUOTE_CREATED', 'quote', ?, ?)
    `).run(staff.userId, staff.name, quoteId, `Generated official quote #${quoteNumber} for ${traveller_name} (Total: ₹${totalWithGst.toLocaleString("en-IN")})`);

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
