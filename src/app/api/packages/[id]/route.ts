import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";
import { internalServerError } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDatabase();
  if (!(await hasRole(["admin", "editor"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;

    // Search by ID or slug
    const pkg = await db.prepare(`
      SELECT * FROM packages
      WHERE id = ? OR slug = ?
    `).get(id, id) as any;

    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    const seasonalPrices = await db.prepare(`
      SELECT * FROM seasonal_prices
      WHERE package_id = ?
      ORDER BY standard_price_pp ASC
    `).all(pkg.id);

    const itinerary = await db.prepare(`
      SELECT * FROM itinerary_days
      WHERE package_id = ?
      ORDER BY day_number ASC
    `).all(pkg.id);

    const versions = await db.prepare(`
      SELECT id, version_number, change_summary, created_by, created_at
      FROM package_versions
      WHERE package_id = ?
      ORDER BY version_number DESC
    `).all(pkg.id);

    return NextResponse.json({
      success: true,
      data: {
        ...pkg,
        destinations: JSON.parse(pkg.destinations_json || "[]"),
        gallery: JSON.parse(pkg.gallery_json || "[]"),
        inclusions: JSON.parse(pkg.inclusions_json || "[]"),
        exclusions: JSON.parse(pkg.exclusions_json || "[]"),
        seasonal_prices: seasonalPrices,
        itinerary: itinerary.map((item: any) => ({
          ...item,
          activity_tags: JSON.parse(item.activity_tags_json || "[]"),
        })),
        versions,
      },
    });
  } catch (error: unknown) {
    return internalServerError("GET /api/packages/[id]", error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDatabase();
  if (!(await hasRole(["admin", "editor"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.prepare("SELECT * FROM packages WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    const newVersion = (existing.current_version || 1) + 1;
    const updatedBy = body.updated_by || "usr_editor";
    const changeSummary = body.change_summary || "Updated package details and pricing via CMS";

    // Update package table
    await db.prepare(`
      UPDATE packages SET
        title = COALESCE(@title, title),
        tagline = COALESCE(@tagline, tagline),
        description = COALESCE(@description, description),
        duration_days = COALESCE(@duration_days, duration_days),
        duration_nights = COALESCE(@duration_nights, duration_nights),
        destination_summary = COALESCE(@destination_summary, destination_summary),
        destinations_json = COALESCE(@destinations_json, destinations_json),
        category = COALESCE(@category, category),
        featured_image = COALESCE(@featured_image, featured_image),
        gallery_json = COALESCE(@gallery_json, gallery_json),
        inclusions_json = COALESCE(@inclusions_json, inclusions_json),
        exclusions_json = COALESCE(@exclusions_json, exclusions_json),
        hotel_standard_name = COALESCE(@hotel_standard_name, hotel_standard_name),
        hotel_deluxe_name = COALESCE(@hotel_deluxe_name, hotel_deluxe_name),
        hotel_luxury_name = COALESCE(@hotel_luxury_name, hotel_luxury_name),
        status = COALESCE(@status, status),
        current_version = @current_version,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({
      id,
      title: body.title,
      tagline: body.tagline,
      description: body.description,
      duration_days: body.duration_days ? parseInt(body.duration_days, 10) : undefined,
      duration_nights: body.duration_nights ? parseInt(body.duration_nights, 10) : undefined,
      destination_summary: body.destination_summary,
      destinations_json: body.destinations ? JSON.stringify(body.destinations) : undefined,
      category: body.category,
      featured_image: body.featured_image,
      gallery_json: body.gallery ? JSON.stringify(body.gallery) : undefined,
      inclusions_json: body.inclusions ? JSON.stringify(body.inclusions) : undefined,
      exclusions_json: body.exclusions ? JSON.stringify(body.exclusions) : undefined,
      hotel_standard_name: body.hotel_standard_name,
      hotel_deluxe_name: body.hotel_deluxe_name,
      hotel_luxury_name: body.hotel_luxury_name,
      status: body.status,
      current_version: newVersion,
    });

    // If seasonal prices provided, update them
    if (Array.isArray(body.seasonal_prices)) {
      await db.prepare("DELETE FROM seasonal_prices WHERE package_id = ?").run(id);
      const insertPrice = db.prepare(`
        INSERT INTO seasonal_prices (
          id, package_id, season_name, period_label, start_month, end_month,
          standard_price_pp, deluxe_price_pp, luxury_price_pp, gst_percent, note
        ) VALUES (
          @id, @package_id, @season_name, @period_label, @start_month, @end_month,
          @standard_price_pp, @deluxe_price_pp, @luxury_price_pp, 5.0, @note
        )
      `);

      await Promise.all(body.seasonal_prices.map((sp: any, idx: number) =>
        insertPrice.run({
          id: sp.id || `PRC-${id}-${idx + 1}-${Date.now().toString().slice(-4)}`,
          package_id: id,
          season_name: sp.season_name,
          period_label: sp.period_label || "Seasonal",
          start_month: sp.start_month || 1,
          end_month: sp.end_month || 12,
          standard_price_pp: parseInt(sp.standard_price_pp, 10),
          deluxe_price_pp: parseInt(sp.deluxe_price_pp, 10),
          luxury_price_pp: parseInt(sp.luxury_price_pp, 10),
          note: sp.note || "Per person basis on twin sharing, includes 5% GST",
        })
      ));
    }

    // Save version history snapshot
    await db.prepare(`
      INSERT INTO package_versions (package_id, version_number, snapshot_json, change_summary, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, newVersion, JSON.stringify(body), changeSummary, updatedBy);

    // Activity Log
    await db.prepare(`
      INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, details)
      VALUES (?, 'CMS User', 'PACKAGE_UPDATE', 'package', ?, ?)
    `).run(updatedBy, id, `Updated ${existing.title} to version ${newVersion}: ${changeSummary}`);

    return NextResponse.json({ success: true, version: newVersion });
  } catch (error: unknown) {
    return internalServerError("PUT /api/packages/[id]", error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDatabase();
  if (!(await hasRole(["admin"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    await db.prepare("DELETE FROM packages WHERE id = ?").run(id);
    await db.prepare(`
      INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details)
      VALUES ('Staff', 'PACKAGE_DELETE', 'package', ?, 'Package removed from CMS')
    `).run(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return internalServerError("DELETE /api/packages/[id]", error);
  }
}
