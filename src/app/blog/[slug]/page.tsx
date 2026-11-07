import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import db, { initDatabase } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChevronRight, ArrowRight, User, Sparkles, Compass } from "lucide-react";

await initDatabase();

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await db.prepare("SELECT * FROM blogs WHERE slug = ?").get(slug) as any;

  if (!blog) return { title: "Blog Not Found" };

  return {
    title: `${blog.seo_title || blog.title} | SpiceCoast Travel Desk`,
    description: blog.seo_description || blog.excerpt,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const blog = await db.prepare("SELECT * FROM blogs WHERE slug = ?").get(slug) as any;
  if (!blog) notFound();

  const relatedIds = JSON.parse(blog.related_package_ids_json || "[]");
  let relatedPackages: any[] = [];
  if (relatedIds.length > 0) {
    const placeholders = relatedIds.map(() => "?").join(",");
    relatedPackages = await db.prepare(`
      SELECT p.*, MIN(sp.deluxe_price_pp) as min_deluxe_price
      FROM packages p
      LEFT JOIN seasonal_prices sp ON p.id = sp.package_id
      WHERE p.id IN (${placeholders})
      GROUP BY p.id
    `).all(...relatedIds) as any[];
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/blog" className="hover:text-emerald-700">Travel Blog</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-medium truncate max-w-xs">{blog.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article Main Content */}
          <article className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="inline-block bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {blog.category}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                {blog.title}
              </h1>

              <div className="mt-4 pb-6 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Written by <strong>{blog.author}</strong> (Company A Content Desk)</span>
                </div>
                <span>{new Date(blog.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>

            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
              <Image
                src={blog.featured_image}
                alt={blog.title}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Prose */}
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed space-y-4 whitespace-pre-line">
              {blog.content}
            </div>

            {/* Bottom Callout: Lead Readers to the Right Package */}
            <div className="mt-8 pt-6 border-t border-slate-200 bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Ready to experience this in person?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip the middlemen and book directly with Company A, Kochi. All itineraries are private, customizable, and supported by our 24/7 on-ground assistance team.
              </p>
              <div className="pt-1">
                <Link
                  href="/#enquiry"
                  className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
                >
                  <span>Request Custom Itinerary from Mathew (1-Hr SLA)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar: Related Packages Linked to This Post */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <span>Featured Packages for this Guide</span>
                </div>
                <p className="text-xs text-slate-500">
                  Book the exact tour circuit discussed in this article:
                </p>

                <div className="space-y-4">
                  {relatedPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="border border-slate-200/80 rounded-xl p-3.5 hover:border-emerald-300 transition group bg-slate-50/60"
                    >
                      <div className="aspect-[16/10] rounded-lg overflow-hidden bg-slate-100 mb-2.5">
                        <Image
                          src={pkg.featured_image}
                          alt={pkg.title}
                          width={640}
                          height={400}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {pkg.id}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition mt-1 line-clamp-2">
                        <Link href={`/packages/${pkg.slug}`}>{pkg.title}</Link>
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900">
                          ₹{(pkg.min_deluxe_price || 24900).toLocaleString("en-IN")}{" "}
                          <span className="text-[10px] text-slate-500 font-normal">/ pax</span>
                        </span>
                        <Link
                          href={`/packages/${pkg.slug}`}
                          className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Contact Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
                <h4 className="font-bold text-sm">Need Help Choosing?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our destination planners in Kochi are available 9:00 AM – 8:00 PM IST to answer questions regarding houseboats, hotels, and vehicle routes.
                </p>
                <a
                  href="tel:+914842389000"
                  className="block text-center bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-lg transition"
                >
                  Call +91 484 238 9000
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
