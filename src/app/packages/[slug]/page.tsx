import { notFound } from "next/navigation";
import Link from "next/link";
import db, { initDatabase } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PackageDetailClient } from "./PackageDetailClient";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  await initDatabase();
  const { slug } = await params;
  const pkg = await db.prepare("SELECT * FROM packages WHERE slug = ? OR id = ?").get(slug, slug) as any;

  if (!pkg) {
    return { title: "Package Not Found | SpiceCoast Holidays" };
  }

  return {
    title: `${pkg.title} | SpiceCoast Holidays Kochi`,
    description: pkg.tagline || pkg.description.slice(0, 160),
    openGraph: {
      title: pkg.title,
      description: pkg.tagline,
      images: [pkg.featured_image],
    },
  };
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await initDatabase();
  const { slug } = await params;

  const pkg = await db.prepare(`
    SELECT * FROM packages
    WHERE slug = ? OR id = ?
  `).get(slug, slug) as any;

  if (!pkg) {
    notFound();
  }

  const seasonalPrices = await db.prepare(`
    SELECT * FROM seasonal_prices
    WHERE package_id = ?
    ORDER BY standard_price_pp ASC
  `).all(pkg.id) as any[];

  const itinerary = await db.prepare(`
    SELECT * FROM itinerary_days
    WHERE package_id = ?
    ORDER BY day_number ASC
  `).all(pkg.id) as any[];

  const parsedPkg = {
    ...pkg,
    destinations: JSON.parse(pkg.destinations_json || "[]"),
    gallery: JSON.parse(pkg.gallery_json || "[]"),
    inclusions: JSON.parse(pkg.inclusions_json || "[]"),
    exclusions: JSON.parse(pkg.exclusions_json || "[]"),
    seasonal_prices: seasonalPrices,
    itinerary: itinerary.map((item) => ({
      ...item,
      activity_tags: JSON.parse(item.activity_tags_json || "[]"),
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/packages" className="hover:text-emerald-700">Packages</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-medium truncate max-w-xs">{parsedPkg.title}</span>
        </nav>

        {/* Client Interactive wrapper with sticky booking card */}
        <PackageDetailClient pkg={parsedPkg} />
      </main>

      <Footer />
    </div>
  );
}
