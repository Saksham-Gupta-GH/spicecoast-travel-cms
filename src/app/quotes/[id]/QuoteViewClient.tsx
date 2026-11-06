"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Printer,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Building,
  Clock,
  ArrowLeft,
} from "lucide-react";

interface Props {
  quote: any;
}

export function QuoteViewClient({ quote }: Props) {
  const [accepted, setAccepted] = useState(quote.status === "Accepted");

  function handlePrint() {
    window.print();
  }

  function handleAccept() {
    setAccepted(true);
    alert("Thank you! Quote marked as Accepted. Our booking team in Kochi will initiate room and vehicle reservations.");
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 text-slate-900 print:bg-white print:p-0">
      {/* Top action toolbar (hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/admin/quotes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Quote Studio</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Main Proposal Document */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 print:shadow-none print:border-none print:p-0 space-y-8">
        {/* Document Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b-2 border-slate-900 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  SpiceCoast Holidays
                </span>
                <span className="text-xs text-emerald-800 block font-semibold uppercase tracking-wider">
                  Company A • Kochi, Kerala
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              SpiceCoast House, MG Road, Ravipuram, Kochi, Kerala 682016 <br />
              Govt. Licensed Tour Operator • GSTIN: 32AABCS1234F1Z9
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="inline-block bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full">
              OFFICIAL TRAVEL PROPOSAL
            </div>
            <div className="text-lg font-mono font-black text-slate-900">
              #{quote.quote_number}
            </div>
            <div className="text-xs text-slate-500">
              Date: {new Date(quote.created_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className="text-xs text-emerald-700 font-semibold">
              Valid until: 14 Days from issuance
            </div>
          </div>
        </div>

        {/* Client & Travel Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-2">Prepared Exclusively For:</div>
            <div className="text-base font-bold text-slate-900">{quote.traveller_name}</div>
            <div className="text-slate-600 mt-0.5">{quote.email}</div>
            {quote.phone && <div className="text-slate-600">{quote.phone}</div>}
          </div>

          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-2">Travel Parameters:</div>
            <div className="space-y-1 text-slate-700">
              <div>
                <strong>Commencing:</strong> {new Date(quote.travel_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <div>
                <strong>Party:</strong> {quote.adults_count} Adults{quote.kids_count > 0 ? `, ${quote.kids_count} Child` : ""} (Twin Sharing)
              </div>
              <div>
                <strong>Accommodation Standard:</strong> <span className="font-bold text-emerald-800">{quote.selected_tier} Tier (4★ Premium)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Package Details */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Selected Itinerary &amp; Circuit
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {quote.package_title} ({quote.package_id})
          </h2>
          <p className="text-xs text-slate-600">
            <strong>Duration:</strong> {quote.duration_days} Days / {quote.duration_nights} Nights • <strong>Circuit:</strong> {quote.destination_summary}
          </p>
        </div>

        {/* Itemized Pricing & Tax Breakdown (Core Constraint) */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Financial Tariff Breakdown (Twin Sharing Basis)
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Component Description</th>
                  <th className="p-3.5 text-center">Basis</th>
                  <th className="p-3.5 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{quote.selected_tier} Package Accommodation &amp; Transfers</div>
                    <div className="text-slate-500 text-[11px]">
                      {quote.adults_count} Adults on Twin Sharing Basis (includes private AC Sedan/Innova, chauffeur, breakfasts, and houseboat where applicable)
                    </div>
                  </td>
                  <td className="p-3.5 text-center">
                    ₹{quote.price_per_person?.toLocaleString("en-IN")} / person
                  </td>
                  <td className="p-3.5 text-right font-mono font-medium">
                    ₹{quote.subtotal_amount?.toLocaleString("en-IN")}
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">Mandatory Goods &amp; Services Tax (GST @ 5%)</div>
                    <div className="text-slate-500 text-[11px]">
                      Tour operator statutory compliance (CGST 2.5% + SGST 2.5%)
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-mono">5.0%</td>
                  <td className="p-3.5 text-right font-mono text-emerald-800">
                    ₹{quote.gst_amount?.toLocaleString("en-IN")}
                  </td>
                </tr>

                <tr className="bg-emerald-50/80 font-bold text-slate-900 text-sm">
                  <td className="p-4" colSpan={2}>
                    <div className="text-emerald-950 font-black">Net Total Payable (All Taxes &amp; Chauffeur Included)</div>
                    <div className="text-[11px] text-emerald-800 font-normal">
                      Zero hidden charges. No credit card surcharge.
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-lg font-black text-emerald-900">
                    ₹{quote.grand_total?.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Inclusions & Notes */}
        {quote.notes && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800">Specific Proposal Notes:</span>
            <p className="text-slate-600 leading-relaxed">{quote.notes}</p>
          </div>
        )}

        {/* Inclusions checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pt-2">
          <div>
            <h4 className="font-bold text-emerald-800 uppercase tracking-wider mb-2">Inclusions Confirmed</h4>
            <ul className="space-y-1.5 text-slate-600">
              {quote.inclusions.slice(0, 4).map((inc: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Terms &amp; Guarantee</h4>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li>• Dedicated 24/7 on-ground assistance helpline in Kochi.</li>
              <li>• Free rescheduling up to 14 days prior to departure.</li>
              <li>• Personal data processed strictly under DPDP Act 2023.</li>
            </ul>
          </div>
        </div>

        {/* Bottom Acceptance Banner */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Authorized Signatory: <strong className="text-slate-800">Jawahar Kurian (Founder &amp; MD)</strong>
          </div>

          <div className="print:hidden">
            {accepted ? (
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 font-bold text-xs px-4 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Proposal Accepted</span>
              </div>
            ) : (
              <button
                onClick={handleAccept}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition"
              >
                Accept Proposal &amp; Lock Dates
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
