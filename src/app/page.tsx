import Link from "next/link";
import Image from "next/image";
import db, { initDatabase } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PackageCard } from "@/components/PackageCard";
import { PublicEnquiryForm } from "@/components/PublicEnquiryForm";
import {
  ShieldCheck,
  Clock,
  Sparkles,
  Award,
  Users,
  ChevronRight,
  Waves,
  Star,
} from "lucide-react";

await initDatabase();

export const revalidate = 60; // fast server-side cache

export default async function HomePage() {
  const packages = await db.prepare(`
    SELECT p.*,
      MIN(sp.deluxe_price_pp) as min_price,
      MIN(sp.standard_price_pp) as min_standard_price
    FROM packages p
    LEFT JOIN seasonal_prices sp ON p.id = sp.package_id
    WHERE p.status = 'published'
    GROUP BY p.id
    ORDER BY p.id ASC
    LIMIT 6
  `).all() as any[];

  const parsedPackages = packages.map((pkg) => ({
    ...pkg,
    destinations: JSON.parse(pkg.destinations_json || "[]"),
    gallery: JSON.parse(pkg.gallery_json || "[]"),
    inclusions: JSON.parse(pkg.inclusions_json || "[]"),
    exclusions: JSON.parse(pkg.exclusions_json || "[]"),
  }));

  const blogs = await db.prepare(`
    SELECT * FROM blogs
    WHERE status = 'published'
    ORDER BY created_at DESC
    LIMIT 2
  `).all() as any[];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-20 lg:py-28">
        {/* Background Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1800&auto=format&fit=crop"
            alt="Kerala Backwaters and Tea Plantations"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Company A • Kochi&apos;s Leading Holiday Operator</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Kerala Holidays, <br />
              <span className="text-emerald-400">Crafted In Kochi.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
              Misty tea valleys of Munnar, private backwater kettuvallams in Alleppey, and sacred South India pilgrim circuits. Tailored for families, honeymooners, and discerning travelers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/packages"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition text-sm flex items-center gap-2"
              >
                <span>Explore Packages</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a
                href="#enquiry"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl backdrop-blur border border-white/20 transition text-sm"
              >
                Get Custom Itinerary
              </a>
            </div>

            {/* Micro trust indicators */}
            <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-6 text-xs text-slate-300">
              <div>
                <div className="text-xl font-bold text-white">4,300+</div>
                <div className="text-slate-400">Trips Curated / Year</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">₹32 Cr</div>
                <div className="text-slate-400">Annual Tour Operations</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-400">1 Hour</div>
                <div className="text-slate-400">Enquiry Reply SLA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Differentiation Strip */}
      <section className="bg-white border-y border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">48 Local Staff</h4>
                <p className="text-[11px] text-slate-500">Based in Ravipuram, Kochi</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Twin Sharing & GST</h4>
                <p className="text-[11px] text-slate-500">All prices clear & itemized</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">1-Hour Response</h4>
                <p className="text-[11px] text-slate-500">No 12-hour waiting delays</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Consent Captured</h4>
                <p className="text-[11px] text-slate-500">Explicit digital follow-up opt-in</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Holiday Packages Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
              Handcrafted Itineraries
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Signature Kerala & South India Packages
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Transparent seasonal rates with Standard, Deluxe, and Luxury hotel tiers. Accompanied by experienced local chauffeurs.
            </p>
          </div>
          <Link
            href="/packages"
            className="mt-4 md:mt-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
                <span>View package catalogue</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {parsedPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </section>

      {/* Spotlight Experience: Backwater Houseboat */}
      <section className="bg-emerald-950 text-white py-16 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 bg-emerald-900/70 border border-emerald-700/50 text-emerald-300 text-xs px-3 py-1 rounded-full font-medium">
                <Waves className="w-3.5 h-3.5 text-teal-400" />
                <span>The Alleppey Kettuvallam Experience</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Private Luxury Houseboats <br />
                <span className="text-teal-400">On The Kerala Backwaters</span>
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                Glide through palm-shaded lagoons and emerald paddy fields. Every SpiceCoast houseboat is private to your party, featuring dedicated onboard crew, air-conditioned suites, and authentic dining featuring local Karimeen fry and freshly tapped coconut.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Private Crew (Captain & Chef)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>4 Traditional Kerala Meals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Twin Sharing AC Bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Sunset Canal Sightseeing</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/packages/munnar-thekkady-alleppey-houseboat"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition"
                >
                  <span>View Houseboat Package (PKG-KL-07)</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-emerald-800/60">
                <Image
                  src="https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1000&auto=format&fit=crop"
                  alt="Alleppey Houseboat at Sunset"
                  width={1000}
                  height={750}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Travel Guides & Blogs (Directly solving: blogs live on own site & link to packages) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
              Local Kerala Insights
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Travel Guides & Insider Articles
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Authored by our Kochi content desk, linking readers straight to verified packages.
            </p>
          </div>
          <Link
            href="/blog"
            className="mt-4 md:mt-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>All Articles</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((b: any) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row group"
            >
              <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto overflow-hidden bg-slate-100">
                <Image
                  src={b.featured_image}
                  alt={b.title}
                  width={640}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    {b.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition mt-1 line-clamp-2">
                    <Link href={`/blog/${b.slug}`}>{b.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {b.excerpt}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">By {b.author}</span>
                  <Link
                    href={`/blog/${b.slug}`}
                    className="font-semibold text-emerald-700 flex items-center gap-1"
                  >
                    <span>Read Guide</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Interactive Enquiry Section with DPDP Consent */}
      <section id="enquiry" className="bg-slate-100 py-16 scroll-mt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Direct Tour Operator Desk</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Plan Your Dream Holiday With Us
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
              Tell us your group size, travel dates, and budget. Our AI instantly routes your request to a senior consultant in Kochi who replies within 1 hour.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10">
            <PublicEnquiryForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
