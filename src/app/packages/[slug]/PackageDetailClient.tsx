"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Utensils,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send,
  Hotel,
  Info,
} from "lucide-react";
import { EnquiryModal } from "@/components/EnquiryModal";

interface Props {
  pkg: any;
}

export function PackageDetailClient({ pkg }: Props) {
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [selectedSeason, setSelectedSeason] = useState(0);

  const currentPrice = pkg.seasonal_prices[selectedSeason] || pkg.seasonal_prices[0] || {
    standard_price_pp: 24900,
    deluxe_price_pp: 32500,
    luxury_price_pp: 46000,
    season_name: "Standard Season",
    period_label: "Round the Year",
  };

  const whatsappMessage = encodeURIComponent(
    `Hello SpiceCoast Holidays! I am interested in booking "${pkg.title}" (${pkg.id}). Please share customized quote & dates.`
  );

  return (
    <div className="space-y-10">
      {/* Top Header & Gallery */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {pkg.category} Circuit
            </span>
            <span className="bg-slate-100 text-slate-700 text-xs font-mono font-medium px-2 py-0.5 rounded-full">
              {pkg.id}
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Consent Protected</span>
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Version {pkg.current_version} • Managed by Kochi Operations
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
          {pkg.title}
        </h1>

        <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
          {pkg.tagline}
        </p>

        {/* Quick Highlights Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Duration</div>
            <div className="font-bold text-slate-900 mt-0.5 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{pkg.duration_days} Days / {pkg.duration_nights} Nights</span>
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Route Circuit</div>
            <div className="font-bold text-slate-900 mt-0.5 text-sm flex items-center gap-1.5 truncate">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{pkg.destination_summary}</span>
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Deluxe Twin Sharing</div>
            <div className="font-bold text-slate-900 mt-0.5 text-sm text-emerald-800">
              ₹{currentPrice.deluxe_price_pp?.toLocaleString("en-IN")} / person
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Mandatory Taxes</div>
            <div className="font-bold text-slate-900 mt-0.5 text-sm text-emerald-700">
              Includes 5% GST
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2 aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
            <Image
              src={pkg.featured_image}
              alt={pkg.title}
              width={1200}
              height={750}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            {(pkg.gallery.slice(1, 3).length > 0 ? pkg.gallery.slice(1, 3) : [pkg.featured_image]).map(
              (img: string, idx: number) => (
                <div key={idx} className="aspect-[16/10] md:aspect-auto md:h-full rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                  <Image src={img} alt={`Gallery ${idx + 1}`} width={640} height={400} className="w-full h-full object-cover" />
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Itinerary, Seasonal Prices, Hotels, Inclusions */}
        <div className="lg:col-span-2 space-y-10">
          {/* Overview */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Holiday Overview</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {pkg.description}
            </p>
          </div>

          {/* Seasonal Pricing Matrix Table (Core Brief Constraint) */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Transparent Tariff Matrix
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Seasonal Pricing Table (Twin Sharing Basis)
                </h2>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-medium">
                5% GST Included
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              In accordance with tour operating guidelines, all prices are published on a <strong>per-person basis</strong> for two adults traveling together (twin sharing). Rates adjust by travel season to reflect peak winter holiday surcharges and discounted monsoon rejuvenation rates.
            </p>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Season & Dates</th>
                    <th className="py-3 px-4">Standard (3★)</th>
                    <th className="py-3 px-4 bg-emerald-50/70 text-emerald-900">Deluxe (4★)</th>
                    <th className="py-3 px-4">Luxury (5★)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pkg.seasonal_prices.map((sp: any, i: number) => (
                    <tr
                      key={sp.id || i}
                      onClick={() => setSelectedSeason(i)}
                      className={`cursor-pointer transition hover:bg-slate-50 ${
                        selectedSeason === i ? "bg-emerald-50/40 font-medium" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sp.season_name}</div>
                        <div className="text-[11px] text-slate-500">{sp.period_label}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        ₹{sp.standard_price_pp.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 bg-emerald-50/50">
                        ₹{sp.deluxe_price_pp.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        ₹{sp.luxury_price_pp.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 text-[11px] text-slate-600 border border-slate-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Pricing Note:</strong> Child with bed is charged at 50% of the per-person twin sharing rate. Includes AC private transportation throughout, breakfast, and the demo&apos;s assumed 5% GST. No hidden booking surcharges.
              </span>
            </div>
          </div>

          {/* Day-Wise Detailed Itinerary */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Detailed Day-Wise Plan
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Itinerary & Activities
              </h2>
            </div>

            <div className="space-y-4">
              {pkg.itinerary.map((day: any) => {
                const isOpen = expandedDay === day.day_number;
                return (
                  <div
                    key={day.id || day.day_number}
                    className="border border-slate-200 rounded-xl overflow-hidden transition"
                  >
                    <button
                      onClick={() => setExpandedDay(isOpen ? null : day.day_number)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100/80 text-left transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          D{day.day_number}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{day.title}</h4>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>{day.overnight_location}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3 h-3 text-amber-600" />
                              <span>{day.meals_included}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 sm:p-5 bg-white text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed border-t border-slate-100">
                        <p>{day.description}</p>

                        {day.activity_tags && day.activity_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {day.activity_tags.map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 text-[11px] px-2.5 py-1 rounded-md font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accommodation Tiers */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-emerald-700" />
              <span>Handpicked Accommodation Standards</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Standard (3-Star)</div>
                <p className="text-slate-600">{pkg.hotel_standard_name}</p>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                <div className="font-bold text-emerald-950 text-sm mb-1">Deluxe (4-Star)</div>
                <p className="text-slate-700">{pkg.hotel_deluxe_name}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Luxury (5-Star Heritage)</div>
                <p className="text-slate-600">{pkg.hotel_luxury_name}</p>
              </div>
            </div>
          </div>

          {/* Inclusions & Exclusions */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Inclusions & Exclusions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              <div>
                <h4 className="font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Package Inclusions</span>
                </h4>
                <ul className="space-y-2.5 text-slate-600">
                  {pkg.inclusions.map((inc: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Package Exclusions</span>
                </h4>
                <ul className="space-y-2.5 text-slate-600">
                  {pkg.exclusions.map((exc: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Column: Booking & Quote Trigger */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-lg space-y-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Deluxe Package Tariff
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900">
                  ₹{currentPrice.deluxe_price_pp?.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-500">/ person (twin sharing)</span>
              </div>
              <p className="text-xs text-emerald-700 font-medium">
                Inclusive of 5% GST & AC vehicle
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <button
                onClick={() => setEnquiryModalOpen(true)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition text-sm"
              >
                <Send className="w-4 h-4" />
                <span>Enquire Now (1-Hr Reply SLA)</span>
              </button>

              <a
                href={`https://wa.me/914842389000?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Enquire via WhatsApp</span>
              </a>
            </div>

            {/* SLA Trust Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Direct Tour Operator Advantage:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Your enquiry lands directly in our Kochi admin inbox. Mathew or Ananya will review your dates, customize your itinerary, and send a PDF quote within 60 minutes.
              </p>
            </div>

            {/* Quick Contact */}
            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              Need immediate booking advice? <br />
              <a href="tel:+914842389000" className="text-emerald-700 font-bold hover:underline">
                Call +91 484 238 9000
              </a>
            </div>
          </div>
        </div>
      </div>

      <EnquiryModal
        packageId={pkg.id}
        packageTitle={pkg.title}
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
      />
    </div>
  );
}
