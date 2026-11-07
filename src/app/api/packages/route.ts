import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";
import { hasRole } from "@/lib/auth";

// Ensure DB is ready
export async function GET(request: Request) {
  await initDatabase();
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const destination = searchParams.get("destination");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let query = `
      SELECT p.*,
        MIN(sp.deluxe_price_pp) as min_price,
        MIN(sp.standard_price_pp) as min_standard_price
      FROM packages p
      LEFT JOIN seasonal_prices sp ON p.id = sp.package_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (category && category !== "All") {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (destination && destination !== "All") {
      query += ` AND p.destinations_json LIKE ?`;
      params.push(`%${destination}%`);
    }

    if (search) {
      query += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.destination_summary LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY p.id ORDER BY p.updated_at DESC`;

    const packages = await db.prepare(query).all(...params);

    // Parse JSON fields
    const parsed = packages.map((pkg: any) => ({
      ...pkg,
      destinations: JSON.parse(pkg.destinations_json || "[]"),
      gallery: JSON.parse(pkg.gallery_json || "[]"),
      inclusions: JSON.parse(pkg.inclusions_json || "[]"),
      exclusions: JSON.parse(pkg.exclusions_json || "[]"),
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await initDatabase();
  if (!(await hasRole(["admin", "editor"]))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const {
      title,
      tagline,
      description,
      duration_days,
      duration_nights,
      destination_summary,
      destinations,
      category,
      featured_image,
      gallery,
      inclusions,
      exclusions,
      hotel_standard_name,
      hotel_deluxe_name,
      hotel_luxury_name,
      status = "draft",
      seasonal_prices = [],
      created_by = "usr_admin",
    } = body;

    if (!title || !destination_summary || !duration_days) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Auto-generate ID & slug
    const count = (await db.prepare("SELECT COUNT(*)::int as c FROM packages").get() as any).c + 1;
    const id = `PKG-KL-${count.toString().padStart(2, "0")}`;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const insertPkg = db.prepare(`
      INSERT INTO packages (
        id, slug, title, tagline, description, duration_days, duration_nights,
        destination_summary, destinations_json, category, featured_image, gallery_json,
        inclusions_json, exclusions_json, hotel_standard_name, hotel_deluxe_name,
        hotel_luxury_name, status, current_version, created_by
      ) VALUES (
        @id, @slug, @title, @tagline, @description, @duration_days, @duration_nights,
        @destination_summary, @destinations_json, @category, @featured_image, @gallery_json,
        @inclusions_json, @exclusions_json, @hotel_standard_name, @hotel_deluxe_name,
        @hotel_luxury_name, @status, 1, @created_by
      )
    `);

    await insertPkg.run({
      id,
      slug,
      title,
      tagline: tagline || "",
      description: description || "",
      duration_days: parseInt(duration_days, 10),
      duration_nights: parseInt(duration_nights, 10),
      destination_summary,
      destinations_json: JSON.stringify(destinations || []),
      category: category || "Family",
      featured_image: featured_image || "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200",
      gallery_json: JSON.stringify(gallery || []),
      inclusions_json: JSON.stringify(inclusions || []),
      exclusions_json: JSON.stringify(exclusions || []),
      hotel_standard_name: hotel_standard_name || "Standard 3-Star Hotels",
      hotel_deluxe_name: hotel_deluxe_name || "Deluxe 4-Star Hotels",
      hotel_luxury_name: hotel_luxury_name || "Luxury 5-Star Resorts",
      status,
      created_by,
    });

    // Insert seasonal prices if supplied
    if (Array.isArray(seasonal_prices) && seasonal_prices.length > 0) {
      const insertPrice = db.prepare(`
        INSERT INTO seasonal_prices (
          id, package_id, season_name, period_label, start_month, end_month,
          standard_price_pp, deluxe_price_pp, luxury_price_pp, gst_percent, note
        ) VALUES (
          @id, @package_id, @season_name, @period_label, @start_month, @end_month,
          @standard_price_pp, @deluxe_price_pp, @luxury_price_pp, 5.0, @note
        )
      `);

      await Promise.all(seasonal_prices.map((sp: any, idx: number) =>
        insertPrice.run({
          id: `PRC-${id}-${idx + 1}`,
          package_id: id,
          season_name: sp.season_name || "Standard Season",
          period_label: sp.period_label || "All Months",
          start_month: sp.start_month || 1,
          end_month: sp.end_month || 12,
          standard_price_pp: parseInt(sp.standard_price_pp, 10) || 20000,
          deluxe_price_pp: parseInt(sp.deluxe_price_pp, 10) || 25000,
          luxury_price_pp: parseInt(sp.luxury_price_pp, 10) || 35000,
          note: sp.note || "Per person basis on twin sharing, includes 5% GST",
        })
      ));
    }

    // Save initial version snapshot
    await db.prepare(`
      INSERT INTO package_versions (package_id, version_number, snapshot_json, change_summary, created_by)
      VALUES (?, 1, ?, 'Initial package creation via CMS', ?)
    `).run(id, JSON.stringify(body), created_by);

    // Activity log
    await db.prepare(`
      INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, details)
      VALUES (?, 'CMS User', 'PACKAGE_CREATE', 'package', ?, ?)
    `).run(created_by, id, `Created new package: ${title} (${id})`);

    return NextResponse.json({ success: true, package_id: id, slug });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
