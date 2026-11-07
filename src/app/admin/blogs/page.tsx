import db, { initDatabase } from "@/lib/db";
import { BlogsCmsClient } from "./BlogsCmsClient";
import { hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

await initDatabase();

export default async function AdminBlogsPage() {
  if (!(await hasRole(["admin", "editor"]))) redirect("/admin");
  const blogs = await db.prepare(`
    SELECT * FROM blogs ORDER BY created_at DESC
  `).all() as any[];

  const packages = await db.prepare(`
    SELECT id, title FROM packages ORDER BY id ASC
  `).all() as any[];

  const parsedBlogs = blogs.map((b) => ({
    ...b,
    related_package_ids: JSON.parse(b.related_package_ids_json || "[]"),
  }));

  return <BlogsCmsClient initialBlogs={parsedBlogs} packages={packages} />;
}
