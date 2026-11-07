import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDatabase();
  if (!(await hasRole(["admin", "editor"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const original = await db.prepare("SELECT * FROM packages WHERE id = ?").get(id) as any;

    if (!original) {
      return NextResponse.json({ success: false, error: "Original package not found" }, { status: 404 });
    }

    const count = (await db.prepare("SELECT COUNT(*)::int as c FROM packages").get() as any).c + 1;
    const newId = `PKG-KL-${count.toString().padStart(2, "0")}`;
    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;

    // Duplicate package
    await db.prepare(`
      INSERT INTO packages (
        id, slug, title, tagline, description, duration_days, duration_nights,
        destination_summary, destinations_json, category, featured_image, gallery_json,
        inclusions_json, exclusions_json, hotel_standard_name, hotel_deluxe_name,
        hotel_luxury_name, status, current_version, created_by
      ) VALUES (
        @id, @slug, @title, @tagline, @description, @duration_days, @duration_nights,
        @destination_summary, @destinations_json, @category, @featured_image, @gallery_json,
        @inclusions_json, @exclusions_json, @hotel_standard_name, @hotel_deluxe_name,
        @hotel_luxury_name, 'draft', 1, 'usr_editor'
      )
    `).run({
      ...original,
      id: newId,
      slug: newSlug,
      title: newTitle,
    });

    // Duplicate seasonal prices
    const prices = await db.prepare("SELECT * FROM seasonal_prices WHERE package_id = ?").all(id) as any[];
    const insertPrice = db.prepare(`
      INSERT INTO seasonal_prices (
        id, package_id, season_name, period_label, start_month, end_month,
        standard_price_pp, deluxe_price_pp, luxury_price_pp, gst_percent, note
      ) VALUES (
        @id, @package_id, @season_name, @period_label, @start_month, @end_month,
        @standard_price_pp, @deluxe_price_pp, @luxury_price_pp, @gst_percent, @note
      )
    `);

    await Promise.all(prices.map((p, idx) =>
      insertPrice.run({
        ...p,
        id: `PRC-${newId}-${idx + 1}`,
        package_id: newId,
      })
    ));

    // Duplicate itinerary days
    const days = await db.prepare("SELECT * FROM itinerary_days WHERE package_id = ?").all(id) as any[];
    const insertDay = db.prepare(`
      INSERT INTO itinerary_days (
        id, package_id, day_number, title, description, meals_included, overnight_location, activity_tags_json
      ) VALUES (
        @id, @package_id, @day_number, @title, @description, @meals_included, @overnight_location, @activity_tags_json
      )
    `);

    await Promise.all(days.map((d, idx) =>
      insertDay.run({
        ...d,
        id: `ITN-${newId}-D${idx + 1}`,
        package_id: newId,
      })
    ));

    // Log activity
    await db.prepare(`
      INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details)
      VALUES ('Staff', 'PACKAGE_DUPLICATE', 'package', ?, ?)
    `).run(newId, `Duplicated package ${id} into new draft ${newId} (${newTitle})`);

    return NextResponse.json({ success: true, package_id: newId, slug: newSlug });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
