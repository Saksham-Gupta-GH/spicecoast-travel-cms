import db, { initDatabase } from "@/lib/db";
import { PackagesCmsClient } from "./PackagesCmsClient";
import { hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

initDatabase();

export default async function PackagesAdminPage() {
  if (!(await hasRole(["admin", "editor"]))) redirect("/admin");
  const packages = db.prepare(`
    SELECT p.*,
      MIN(sp.deluxe_price_pp) as min_deluxe_price,
      MIN(sp.standard_price_pp) as min_standard_price
    FROM packages p
    LEFT JOIN seasonal_prices sp ON p.id = sp.package_id
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all() as any[];

  const parsedPackages = packages.map((pkg) => {
    const seasonalPrices = db.prepare(`
      SELECT * FROM seasonal_prices WHERE package_id = ? ORDER BY standard_price_pp ASC
    `).all(pkg.id);

    const versions = db.prepare(`
      SELECT * FROM package_versions WHERE package_id = ? ORDER BY version_number DESC
    `).all(pkg.id);

    return {
      ...pkg,
      destinations: JSON.parse(pkg.destinations_json || "[]"),
      gallery: JSON.parse(pkg.gallery_json || "[]"),
      inclusions: JSON.parse(pkg.inclusions_json || "[]"),
      exclusions: JSON.parse(pkg.exclusions_json || "[]"),
      seasonal_prices: seasonalPrices,
      versions,
    };
  });

  return <PackagesCmsClient initialPackages={parsedPackages} />;
}
