"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Compass, MessageSquareText, Printer, XCircle } from "lucide-react";
import { RouteMap } from "@/components/RouteMap";

type Decision = "Accepted" | "Changes Requested" | "Declined";

interface Props {
  quote: any;
  viewer: "staff" | "traveller";
}

const DECISION_STYLES: Record<string, string> = {
  Accepted: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Changes Requested": "border-amber-200 bg-amber-50 text-amber-950",
  Declined: "border-red-200 bg-red-50 text-red-900",
  Sent: "border-blue-200 bg-blue-50 text-blue-900",
};

export function QuoteViewClient({ quote, viewer }: Props) {
  const [status, setStatus] = useState(quote.status as string);
  const [responseMessage, setResponseMessage] = useState(quote.traveller_response || "");
  const [draftMessage, setDraftMessage] = useState(quote.traveller_response || "");
  const [showChanges, setShowChanges] = useState(false);
  const [pending, setPending] = useState<Decision | null>(null);
  const [error, setError] = useState("");

  async function respond(decision: Decision) {
    setError("");
    if (decision === "Changes Requested" && draftMessage.trim().length < 10) {
      setError("Please describe the change in at least 10 characters.");
      return;
    }

    setPending(decision);
    try {
      const response = await fetch(`/api/traveller/quotes/${quote.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision, message: decision === "Changes Requested" ? draftMessage.trim() : "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save your response");
      setStatus(decision);
      setResponseMessage(decision === "Changes Requested" ? draftMessage.trim() : "");
      setShowChanges(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save your response");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 print:bg-white print:p-0 sm:px-6 lg:px-8">
      <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between print:hidden">
        <Link href={viewer === "staff" ? "/admin/quotes" : "/traveller"} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{viewer === "staff" ? "Back to Quote Studio" : "Back to my quotes"}</span>
        </Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800">
          <Printer className="h-4 w-4" /> Print or Save as PDF
        </button>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl print:border-none print:p-0 print:shadow-none sm:p-12">
        <header className="flex flex-col justify-between gap-6 border-b-2 border-slate-900 pb-8 sm:flex-row sm:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white"><Compass className="h-6 w-6" /></div>
              <div><span className="text-2xl font-black tracking-tight">SpiceCoast Holidays</span><span className="block text-xs font-semibold uppercase tracking-wider text-emerald-800">Company A • Kochi, Kerala</span></div>
            </div>
            <p className="max-w-sm text-xs text-slate-500">SpiceCoast House, MG Road, Ravipuram, Kochi, Kerala 682016<br />Govt. Licensed Tour Operator • GSTIN: 32AABCS1234F1Z9</p>
          </div>
          <div className="space-y-1 text-left sm:text-right">
            <div className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">OFFICIAL TRAVEL PROPOSAL</div>
            <div className="font-mono text-lg font-black">#{quote.quote_number}</div>
            <div className="text-xs text-slate-500">Date: {new Date(quote.created_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</div>
            <div className="text-xs font-semibold text-emerald-700">Valid for 14 days from issuance</div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-xs sm:grid-cols-2">
          <div><div className="mb-2 font-bold uppercase tracking-wider text-slate-400">Prepared exclusively for</div><div className="text-base font-bold">{quote.traveller_name}</div><div className="mt-0.5 text-slate-600">{quote.email}</div>{quote.phone && <div className="text-slate-600">{quote.phone}</div>}</div>
          <div><div className="mb-2 font-bold uppercase tracking-wider text-slate-400">Travel parameters</div><div className="space-y-1 text-slate-700"><div><strong>Commencing:</strong> {new Date(quote.travel_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div><div><strong>Party:</strong> {quote.adults_count} adults{quote.kids_count > 0 ? `, ${quote.kids_count} child` : ""} (twin sharing)</div><div><strong>Accommodation:</strong> <span className="font-bold text-emerald-800">{quote.selected_tier} tier</span></div></div></div>
        </section>

        <section className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Selected itinerary &amp; circuit</div>
          <h1 className="text-xl font-bold">{quote.package_title} ({quote.package_id})</h1>
          <p className="text-xs text-slate-600"><strong>Duration:</strong> {quote.duration_days} days / {quote.duration_nights} nights • <strong>Circuit:</strong> {quote.destination_summary}</p>
          <RouteMap destinations={quote.destinations || []} compact />
        </section>

        <section className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Financial tariff breakdown (twin-sharing basis)</div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 text-xs">
            <table className="w-full min-w-[620px] text-left">
              <thead className="border-b border-slate-200 bg-slate-100 font-bold"><tr><th className="p-3.5">Component</th><th className="p-3.5 text-center">Basis</th><th className="p-3.5 text-right">Amount (INR)</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr><td className="p-3.5"><div className="font-bold text-slate-900">{quote.selected_tier} accommodation &amp; transfers</div><div className="text-[11px] text-slate-500">Private vehicle, chauffeur, breakfasts and listed experiences</div></td><td className="p-3.5 text-center">₹{quote.price_per_person?.toLocaleString("en-IN")} / person</td><td className="p-3.5 text-right font-mono font-medium">₹{quote.subtotal_amount?.toLocaleString("en-IN")}</td></tr>
                <tr><td className="p-3.5"><div className="font-semibold text-slate-900">Demonstration GST @ 5%</div><div className="text-[11px] text-slate-500">Tax-rate assumption for this prototype</div></td><td className="p-3.5 text-center font-mono">5.0%</td><td className="p-3.5 text-right font-mono text-emerald-800">₹{quote.gst_amount?.toLocaleString("en-IN")}</td></tr>
                <tr className="bg-emerald-50/80 text-sm font-bold"><td className="p-4" colSpan={2}><div className="font-black text-emerald-950">Net total payable</div><div className="text-[11px] font-normal text-emerald-800">All listed taxes and chauffeur included</div></td><td className="p-4 text-right font-mono text-lg font-black text-emerald-900">₹{quote.grand_total?.toLocaleString("en-IN")}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {quote.notes && <section className="space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs"><strong>Proposal notes</strong><p className="leading-relaxed text-slate-600">{quote.notes}</p></section>}

        <section className="grid grid-cols-1 gap-6 pt-2 text-xs sm:grid-cols-2">
          <div><h2 className="mb-2 font-bold uppercase tracking-wider text-emerald-800">Inclusions confirmed</h2><ul className="space-y-1.5 text-slate-600">{quote.inclusions.slice(0, 5).map((item: string) => <li key={item} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{item}</li>)}</ul></div>
          <div><h2 className="mb-2 font-bold uppercase tracking-wider">Terms &amp; guarantee</h2><ul className="space-y-1.5 text-[11px] text-slate-600"><li>• 24/7 on-ground assistance in Kochi.</li><li>• Approval continues the offline booking process; it is not payment.</li><li>• Personal data is processed under the DPDP Act 2023.</li></ul></div>
        </section>

        <footer className="border-t border-slate-200 pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="text-xs text-slate-500">Authorized signatory: <strong className="text-slate-800">Jawahar Kurian (Founder &amp; MD)</strong></div><span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${DECISION_STYLES[status] || DECISION_STYLES.Sent}`}>{status}</span></div>
          {responseMessage && status === "Changes Requested" && <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />{responseMessage}</div>}

          {viewer === "traveller" && <div className="mt-6 space-y-4 print:hidden">
            <p className="text-xs leading-5 text-slate-500">Your choice is saved for your consultant. You can change it while the proposal remains active.</p>
            {showChanges && <textarea value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} maxLength={1000} rows={4} placeholder="Tell your consultant what should change…" className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50" />}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button disabled={!!pending} onClick={() => respond("Accepted")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{pending === "Accepted" ? "Saving…" : "Approve proposal"}</button>
              <button disabled={!!pending} onClick={() => showChanges ? respond("Changes Requested") : setShowChanges(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-xs font-bold text-amber-950 transition hover:bg-amber-100 disabled:opacity-60"><MessageSquareText className="h-4 w-4" />{pending === "Changes Requested" ? "Saving…" : showChanges ? "Send change request" : "Request changes"}</button>
              <button disabled={!!pending} onClick={() => respond("Declined")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 disabled:opacity-60"><XCircle className="h-4 w-4" />{pending === "Declined" ? "Saving…" : "Decline"}</button>
            </div>
          </div>}
        </footer>
      </div>
    </div>
  );
}
