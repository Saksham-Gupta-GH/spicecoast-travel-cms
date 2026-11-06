import { NextResponse } from "next/server";
import db, { initDatabase } from "@/lib/db";

initDatabase();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = "SELECT * FROM blogs WHERE status = 'published'";
    const params: any[] = [];

    if (category && category !== "All") {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY created_at DESC";

    const blogs = db.prepare(query).all(...params);

    const parsed = blogs.map((b: any) => ({
      ...b,
      related_package_ids: JSON.parse(b.related_package_ids_json || "[]"),
    }));

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      excerpt,
      content,
      category,
      featured_image,
      author = "Ananya Pillai",
      related_package_ids = [],
      seo_title,
      seo_description,
      status = "published",
    } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content required" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const count = (db.prepare("SELECT COUNT(*) as c FROM blogs").get() as any).c + 1;
    const id = `BLG-${count.toString().padStart(3, "0")}`;

    db.prepare(`
      INSERT INTO blogs (
        id, slug, title, excerpt, content, category, featured_image, author,
        related_package_ids_json, seo_title, seo_description, status
      ) VALUES (
        @id, @slug, @title, @excerpt, @content, @category, @featured_image, @author,
        @related_package_ids_json, @seo_title, @seo_description, @status
      )
    `).run({
      id,
      slug,
      title,
      excerpt: excerpt || title,
      content,
      category: category || "Travel Guide",
      featured_image: featured_image || "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1000",
      author,
      related_package_ids_json: JSON.stringify(related_package_ids),
      seo_title: seo_title || title,
      seo_description: seo_description || excerpt || title,
      status,
    });

    db.prepare(`
      INSERT INTO activity_logs (user_name, action, entity_type, entity_id, details)
      VALUES (?, 'BLOG_PUBLISHED', 'blog', ?, ?)
    `).run(author, id, `Published blog post: ${title} linking to packages: ${related_package_ids.join(", ")}`);

    return NextResponse.json({ success: true, blog_id: id, slug });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
