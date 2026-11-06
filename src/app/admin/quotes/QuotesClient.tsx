"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  ExternalLink,
  Printer,
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
  X,
  Sparkles,
} from "lucide-react";

interface Props {
  initialQuotes: any[];
  packages: any[];
  enquiries: any[];
}

export function QuotesClient({ initialQuotes, packages, enquiries }: Props) {
  const [quotes, setQuotes] = useState<any[]>(initialQuotes);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [packageId, setPackageId] = useState(packages[0]?.id || "");
  const [enquiryId, setEnquiryId] = useState("");
  const [travellerName, setTravellerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [travelDate, setTravelDate] = useState("2026-12-15");
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [tier, setTier] = useState<"Standard" | "Deluxe" | "Luxury">("Deluxe");
  const [notes, setNotes] = useState("");

  // When selecting an existing enquiry, auto-fill details
  function handleSelectEnquiry(eId: string) {
    setEnquiryId(eId);
    const found = enquiries.find((e) => e.id === eId);
    if (found) {
      setTravellerName(found.traveller_name);
      setEmail(found.email);
      setPhone(found.phone);
    }
  }

  async function handleCreateQuote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiry_id: enquiryId || null,
          package_id: packageId,
          traveller_name: travellerName,
          email,
          phone,
          travel_date: travelDate,
          adults_count: adults,
          kids_count: kids,
          selected_tier: tier,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create quote");

      alert(`Quote created successfully! Number: ${data.quote_number}`);
      setIsCreating(false);
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            Quote Builder &amp; PDF Engine
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Client Quotes &amp; Proposals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate branded, itemized PDF quotes from packages with twin sharing &amp; 5% GST calculation.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Quote</span>
        </button>
      </div>

      {/* Quote List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Quote No / Status</th>
                <th className="py-3.5 px-4">Traveller Details</th>
                <th className="py-3.5 px-4">Package</th>
                <th className="py-3.5 px-4">Party &amp; Tier</th>
                <th className="py-3.5 px-4">Grand Total (Inc GST)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 transition">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900">{q.quote_number}</div>
                    <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {q.status}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900">{q.traveller_name}</div>
                    <div className="text-[11px] text-slate-500">{q.email}</div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-900 max-w-xs truncate">{q.package_title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{q.package_id}</div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <div>{q.adults_count} Adults{q.kids_count > 0 ? `, ${q.kids_count} Kid` : ""}</div>
                    <div className="text-[11px] font-semibold text-emerald-700">{q.selected_tier} Tier</div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-mono font-black text-slate-900 text-sm">
                      ₹{q.grand_total?.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-slate-400">Includes 5% GST (₹{q.gst_amount?.toLocaleString("en-IN")})</div>
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <Link
                      href={`/quotes/${q.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <span>View PDF Quote</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Generation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Company A Quote Studio
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Generate Branded Client Proposal
                </h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4 text-xs">
              {/* Optional: Link from existing enquiry */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Link to Received Enquiry (Optional)
                </label>
                <select
                  value={enquiryId}
                  onChange={(e) => handleSelectEnquiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="">-- Manual Standalone Quote --</option>
                  {enquiries.map((enq) => (
                    <option key={enq.id} value={enq.id}>
                      {enq.id} - {enq.traveller_name} ({enq.ai_destination})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Package *</label>
                <select
                  required
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.id}: {pkg.title} ({pkg.duration_days}D)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Traveller Name *</label>
                  <input
                    type="text"
                    required
                    value={travellerName}
                    onChange={(e) => setTravellerName(e.target.value)}
                    placeholder="e.g. Dr. Evelyn Campbell"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="evelyn@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98201 54321"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Travel Date *</label>
                  <input
                    type="date"
                    required
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Adults (Pax)</label>
                  <input
                    type="number"
                    min="1"
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kids (Pax)</label>
                  <input
                    type="number"
                    min="0"
                    value={kids}
                    onChange={(e) => setKids(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hotel Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Standard">Standard (3★)</option>
                    <option value="Deluxe">Deluxe (4★)</option>
                    <option value="Luxury">Luxury (5★)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom Notes / Inclusions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Includes private AC Tempo Traveller, English chauffeur, 2 twin sharing rooms."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-[11px] text-emerald-900">
                <strong>Twin Sharing Math:</strong> Total will be automatically computed using the package price table with 5% GST added and formatted for printing.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition"
                >
                  {saving ? "Generating..." : "Generate Quote & Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
