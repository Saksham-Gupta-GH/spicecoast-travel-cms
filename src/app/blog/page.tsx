import Link from "next/link";
import db, { initDatabase } from "@/lib/db";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChevronRight, Calendar, User, Compass, Sparkles } from "lucide-react";

initDatabase();

export const metadata = {
  title: "Kerala Travel Guides & Insider Blog | SpiceCoast Holidays",
  description: "Expert advice on Alleppey backwater houseboats, Munnar tea plantation trails, seasonal travel advice, and culture guides by Company A, Kochi.",
};

export default function BlogListPage() {
  const blogs = db.prepare(`
    SELECT * FROM blogs
    WHERE status = 'published'
    ORDER BY created_at DESC
  `).all() as any[];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Banner */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Kochi Local Travel Desk</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Kerala Travel Guides & Stories
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Firsthand recommendations from our tour consultants to help you plan the perfect journey across Kerala and South India. Every guide is paired directly with verified holiday packages.
          </p>
        </div>

        {/* Blog grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((b: any) => {
            const relatedIds = JSON.parse(b.related_package_ids_json || "[]");
            return (
              <article
                key={b.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg transition flex flex-col group"
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-100 relative">
                  <img
                    src={b.featured_image}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-emerald-800 font-semibold text-xs px-2.5 py-1 rounded-full shadow-sm">
                    {b.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-2">
                      <Link href={`/blog/${b.slug}`}>{b.title}</Link>
                    </h2>
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                      {b.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.author}</span>
                    </div>

                    <Link
                      href={`/blog/${b.slug}`}
                      className="font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition"
                    >
                      <span>Read Guide</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
