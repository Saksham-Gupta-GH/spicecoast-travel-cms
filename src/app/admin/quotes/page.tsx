import db, { initDatabase } from "@/lib/db";
import { QuotesClient } from "./QuotesClient";
import { hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

initDatabase();

export default async function AdminQuotesPage() {
  if (!(await hasRole(["admin", "consultant"]))) redirect("/admin");
  const quotes = db.prepare(`
    SELECT q.*, p.title as package_title, p.slug as package_slug
    FROM quotes q
    LEFT JOIN packages p ON q.package_id = p.id
    ORDER BY q.created_at DESC
  `).all() as any[];

  const packages = db.prepare(`
    SELECT p.id, p.title, p.duration_days, p.destination_summary,
      MIN(sp.deluxe_price_pp) as min_deluxe_price,
      MIN(sp.standard_price_pp) as min_standard_price,
      MIN(sp.luxury_price_pp) as min_luxury_price
    FROM packages p
    LEFT JOIN seasonal_prices sp ON p.id = sp.package_id
    GROUP BY p.id
  `).all() as any[];

  const enquiries = db.prepare(`
    SELECT id, traveller_name, email, phone, ai_destination, ai_budget_inr
    FROM enquiries
    ORDER BY created_at DESC
  `).all() as any[];

  return <QuotesClient initialQuotes={quotes} packages={packages} enquiries={enquiries} />;
}
