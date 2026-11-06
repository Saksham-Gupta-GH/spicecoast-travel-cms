"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Sparkles, Shield, X, Clock } from "lucide-react";

interface EnquiryModalProps {
  packageId?: string;
  packageTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EnquiryModal({ packageId, packageTitle, isOpen, onClose }: EnquiryModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    packageTitle ? `Hi, I am interested in ${packageTitle}. Please share customized pricing and availability.` : ""
  );
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dpdpConsent) {
      setError("Please grant consent for our travel consultants to contact you in accordance with DPDP Act 2023.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traveller_name: name,
          email,
          phone,
          raw_message: message,
          package_id: packageId || null,
          source: "web_form",
          dpdp_consent: dpdpConsent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit enquiry");
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setSuccessData(null);
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Enquiry Received!</h3>
              <p className="text-sm text-slate-600 mt-1">
                Reference ID: <span className="font-mono font-semibold text-emerald-800">{successData.enquiry_id}</span>
              </p>
            </div>

            {/* Instant acknowledgement message */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-left text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-900 text-sm">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>1-Hour Response Commitment</span>
              </div>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {successData.instant_acknowledgement}
              </p>
            </div>

            {/* AI parsed quick glance */}
            {successData.extracted && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs">
                <div className="flex items-center gap-1 font-semibold text-slate-700 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Automated Triage Summary:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">Destination:</span> {successData.extracted.destination}
                  </div>
                  <div>
                    <span className="text-slate-400">Guests:</span> {successData.extracted.adults} Adults
                    {successData.extracted.kids > 0 ? `, ${successData.extracted.kids} Child` : ""}
                  </div>
                  <div>
                    <span className="text-slate-400">Dates:</span> {successData.extracted.travelDates}
                  </div>
                  <div>
                    <span className="text-slate-400">Target Budget:</span>{" "}
                    {successData.extracted.budgetInr ? `₹${successData.extracted.budgetInr.toLocaleString()}` : "Flexible"}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded-xl transition"
            >
              Done & Return to Site
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Direct Kochi Tour Desk</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {packageTitle ? `Enquire for ${packageTitle}` : "Plan Your Custom South India Journey"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Every enquiry is assigned to a dedicated destination consultant with guaranteed 1-hour reply.
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Holiday Requirements & Preferences *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 leading-relaxed text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Tip: Mention travel dates, party size, budget, and must-have experiences (houseboat, treehouse, temples).
                </p>
              </div>

              {/* DPDP Act Consent Checkbox */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dpdpConsent}
                    onChange={(e) => setDpdpConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    <strong className="text-slate-800">DPDP Act 2023 Consent:</strong> I agree to receive holiday quotes and WhatsApp/email travel itineraries from SpiceCoast Holidays. We respect your privacy and never spam.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing with AI Triage...</span>
                  </span>
                ) : (
                  <>
                    <span>Submit Enquiry (Guaranteed 1-Hr Reply)</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
