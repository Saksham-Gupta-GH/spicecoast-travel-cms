import db, { initDatabase } from "@/lib/db";
import { BlogsCmsClient } from "./BlogsCmsClient";

initDatabase();

export default function AdminBlogsPage() {
  const blogs = db.prepare(`
    SELECT * FROM blogs ORDER BY created_at DESC
  `).all() as any[];

  const packages = db.prepare(`
    SELECT id, title FROM packages ORDER BY id ASC
  `).all() as any[];

  const parsedBlogs = blogs.map((b) => ({
    ...b,
    related_package_ids: JSON.parse(b.related_package_ids_json || "[]"),
  }));

  return <BlogsCmsClient initialBlogs={parsedBlogs} packages={packages} />;
}
