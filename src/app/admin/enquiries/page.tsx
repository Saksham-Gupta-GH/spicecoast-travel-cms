import db, { initDatabase } from "@/lib/db";
import { EnquiriesInboxClient } from "./EnquiriesInboxClient";
import { hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EnquiriesPage() {
  await initDatabase();
  if (!(await hasRole(["admin", "consultant"]))) redirect("/admin");
  const enquiries = await db.prepare(`
    SELECT e.*, p.title as package_title, p.slug as package_slug, u.name as consultant_name
    FROM enquiries e
    LEFT JOIN packages p ON e.package_id = p.id
    LEFT JOIN users u ON e.assigned_consultant_id = u.id
    ORDER BY e.created_at DESC
  `).all() as any[];

  const parsed = enquiries.map((enq) => ({
    ...enq,
    suggested_packages: JSON.parse(enq.suggested_package_ids_json || "[]"),
    human_corrections: enq.human_corrections_json ? JSON.parse(enq.human_corrections_json) : null,
  }));

  const allPackages = await db.prepare(`
    SELECT p.id, p.title, p.slug, p.category, p.duration_days, p.destination_summary,
      MIN(sp.deluxe_price_pp) as min_deluxe_price
    FROM packages p
    LEFT JOIN seasonal_prices sp ON p.id = sp.package_id
    GROUP BY p.id
  `).all() as any[];

  return <EnquiriesInboxClient initialEnquiries={parsed} packages={allPackages} />;
}
