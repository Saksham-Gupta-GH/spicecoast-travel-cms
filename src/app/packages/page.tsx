import db, { initDatabase } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PackagesCatalogClient } from "./PackagesCatalogClient";

initDatabase();

export const metadata = {
  title: "Kerala & South India Holiday Packages | SpiceCoast Holidays Kochi",
  description: "Browse curated holiday packages across Kerala, Tamil Nadu, and South India. Transparent seasonal pricing on twin sharing basis with 5% GST included.",
};

export default function PackagesPage() {
  const packages = db.prepare(`
    SELECT p.*,
      MIN(sp.deluxe_price_pp) as min_price,
      MIN(sp.standard_price_pp) as min_standard_price
    FROM packages p
    LEFT JOIN seasonal_prices sp ON p.id = sp.package_id
    WHERE p.status = 'published'
    GROUP BY p.id
    ORDER BY p.id ASC
  `).all() as any[];

  const parsedPackages = packages.map((pkg) => ({
    ...pkg,
    destinations: JSON.parse(pkg.destinations_json || "[]"),
    gallery: JSON.parse(pkg.gallery_json || "[]"),
    inclusions: JSON.parse(pkg.inclusions_json || "[]"),
    exclusions: JSON.parse(pkg.exclusions_json || "[]"),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header banner */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            Company A • Kerala & South India Tour Operator
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Holiday Packages & Itineraries
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Explore our curated circuits across Munnar hill stations, Alleppey houseboats, Wayanad rainforests, and South Indian temple circuits. Prices stated per-person on twin sharing basis with 5% GST included.
          </p>
        </div>

        <PackagesCatalogClient initialPackages={parsedPackages} />
      </main>

      <Footer />
    </div>
  );
}
