"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, MapPin, CheckCircle, ArrowRight, Sparkles, Send } from "lucide-react";
import { EnquiryModal } from "./EnquiryModal";

interface PackageCardProps {
  pkg: {
    id: string;
    slug: string;
    title: string;
    tagline: string;
    duration_days: number;
    duration_nights: number;
    destination_summary: string;
    category: string;
    featured_image: string;
    inclusions: string[];
    min_price?: number;
    min_standard_price?: number;
    hotel_standard_name?: string;
    hotel_deluxe_name?: string;
  };
}

export function PackageCard({ pkg }: PackageCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const price = pkg.min_price || pkg.min_standard_price || 24900;

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col group">
        {/* Image & Badges */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            src={pkg.featured_image}
            alt={pkg.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-white/95 backdrop-blur text-slate-900 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              {pkg.category}
            </span>
            <span className="bg-emerald-950/80 text-emerald-300 text-xs font-mono font-medium px-2 py-0.5 rounded-full border border-emerald-600/40">
              {pkg.id}
            </span>
          </div>

          {/* Bottom on-image duration */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {pkg.duration_days} Days / {pkg.duration_nights} Nights
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur px-2.5 py-1 rounded-md">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[140px]">{pkg.destination_summary.split("•")[0]}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
              <Link href={`/packages/${pkg.slug}`}>{pkg.title}</Link>
            </h3>

            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{pkg.destination_summary}</span>
            </p>

            <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
              {pkg.tagline}
            </p>

            {/* Inclusions checklist snippet */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
              {pkg.inclusions.slice(0, 2).map((inc, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{inc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price & CTA */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Starting from</div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-500">/ person</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">Twin Sharing • 5% GST Incl.</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition"
                title="Quick Enquiry"
                aria-label="Quick Enquiry"
              >
                <Send className="w-4 h-4" />
              </button>

              <Link
                href={`/packages/${pkg.slug}`}
                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                <span>Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <EnquiryModal
        packageId={pkg.id}
        packageTitle={pkg.title}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
