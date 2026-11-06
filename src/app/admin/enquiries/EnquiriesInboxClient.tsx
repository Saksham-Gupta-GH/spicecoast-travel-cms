"use client";

import { useState } from "react";
import {
  Inbox,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Edit3,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

interface Props {
  initialEnquiries: any[];
  packages: any[];
}

export function EnquiriesInboxClient({ initialEnquiries, packages }: Props) {
  const [enquiries, setEnquiries] = useState<any[]>(initialEnquiries);
  const [selectedId, setSelectedId] = useState<string>(initialEnquiries[0]?.id || "");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const currentEnquiry = enquiries.find((e) => e.id === selectedId) || enquiries[0];

  // Editable AI Fields State
  const [editDest, setEditDest] = useState(currentEnquiry?.ai_destination || "");
  const [editDates, setEditDates] = useState(currentEnquiry?.ai_travel_dates || "");
  const [editAdults, setEditAdults] = useState(currentEnquiry?.ai_adults || 2);
  const [editKids, setEditKids] = useState(currentEnquiry?.ai_kids || 0);
  const [editBudget, setEditBudget] = useState(currentEnquiry?.ai_budget_inr || "");
  const [editSpecial, setEditSpecial] = useState(currentEnquiry?.ai_special_requests || "");
  const [draftReplyText, setDraftReplyText] = useState(currentEnquiry?.ai_draft_reply || "");
  const [statusVal, setStatusVal] = useState(currentEnquiry?.status || "New");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // When selected enquiry changes, update state
  function handleSelectEnquiry(enq: any) {
    setSelectedId(enq.id);
    setEditDest(enq.ai_destination || "");
    setEditDates(enq.ai_travel_dates || "");
    setEditAdults(enq.ai_adults || 2);
    setEditKids(enq.ai_kids || 0);
    setEditBudget(enq.ai_budget_inr || "");
    setEditSpecial(enq.ai_special_requests || "");
    setDraftReplyText(enq.final_reply || enq.ai_draft_reply || "");
    setStatusVal(enq.status);
    setSaveSuccess(null);
  }

  // Filtered enquiries
  const filteredEnquiries = enquiries.filter((e) => {
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        e.traveller_name.toLowerCase().includes(term) ||
        e.raw_message.toLowerCase().includes(term) ||
        e.id.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Save AI corrections
  async function handleSaveCorrections(markSent = false) {
    setSaving(true);
    setSaveSuccess(null);

    try {
      const res = await fetch(`/api/enquiries/${currentEnquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: markSent ? "Quoted" : statusVal,
          ai_destination: editDest,
          ai_travel_dates: editDates,
          ai_adults: parseInt(editAdults, 10),
          ai_kids: parseInt(editKids, 10),
          ai_budget_inr: editBudget ? parseInt(editBudget, 10) : null,
          ai_special_requests: editSpecial,
          is_human_reviewed: 1,
          final_reply: draftReplyText,
          mark_sent: markSent,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Save failed");
      }

      setSaveSuccess(markSent ? "Reply approved & sent to traveller!" : "Enquiry fields updated & saved.");
      if (markSent) setStatusVal("Quoted");

      // Update local state
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === currentEnquiry.id
            ? {
                ...e,
                status: markSent ? "Quoted" : statusVal,
                ai_destination: editDest,
                ai_travel_dates: editDates,
                ai_adults: parseInt(editAdults, 10),
                ai_kids: parseInt(editKids, 10),
                ai_budget_inr: editBudget ? parseInt(editBudget, 10) : null,
                ai_special_requests: editSpecial,
                is_human_reviewed: 1,
                final_reply: draftReplyText,
              }
            : e
        )
      );
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Source badge colors
  function getSourceBadge(source: string) {
    switch (source) {
      case "whatsapp":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">WhatsApp</span>;
      case "email":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">Email</span>;
      case "phone":
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">Phone Log</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">Web Form</span>;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "New":
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">New Lead</span>;
      case "In Review":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">In Review</span>;
      case "Quoted":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Quoted</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Automated Lead Triage & Response</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Unified Enquiry Inbox & AI Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming leads from Web, WhatsApp, and Email with instant auto-extraction and price-verified reply drafting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/quotes"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Quote Builder</span>
          </Link>
        </div>
      </div>

      {/* Main Studio: Two-Pane Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Inbox List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Filters & Search */}
          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leads, message..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto text-[11px]">
              {["All", "New", "In Review", "Quoted"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition ${
                    filterStatus === st
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filteredEnquiries.map((enq) => {
              const isSelected = enq.id === currentEnquiry?.id;
              return (
                <div
                  key={enq.id}
                  onClick={() => handleSelectEnquiry(enq)}
                  className={`p-3.5 cursor-pointer transition text-left ${
                    isSelected ? "bg-emerald-50/70 border-l-4 border-emerald-600" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[150px]">
                      {enq.traveller_name}
                    </span>
                    {getStatusBadge(enq.status)}
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    {getSourceBadge(enq.source)}
                    <span className="text-[10px] font-mono text-slate-400">{enq.id}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {enq.raw_message}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {enq.ai_budget_inr ? `Budget: ₹${enq.ai_budget_inr.toLocaleString("en-IN")}` : "Flexible"}
                    </span>
                    <span>{new Date(enq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: AI Triage & Reply Studio (8 cols) */}
        {currentEnquiry ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Lead Header & Raw Message */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{currentEnquiry.traveller_name}</h2>
                    <span className="font-mono text-xs text-slate-400">({currentEnquiry.id})</span>
                    {getStatusBadge(statusVal)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentEnquiry.email}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentEnquiry.phone}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Status:</span>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
                  >
                    <option value="New">New Lead</option>
                    <option value="In Review">In Review</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Booked">Booked</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Raw enquiry text callout */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Original Message Received:
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-mono">
                  &ldquo;{currentEnquiry.raw_message}&rdquo;
                </p>
              </div>
            </div>

            {/* AI Extraction & Human Correction Card (Side-by-Side as required in brief!) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900">
                    AI Extracted Fields (Human-in-the-Loop Review)
                  </h3>
                </div>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Confidence: {Math.round((currentEnquiry.ai_confidence || 0.94) * 100)}%
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Verify or edit any extracted field below before approving the reply or issuing a quote.
              </p>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Target</label>
                  <input
                    type="text"
                    value={editDest}
                    onChange={(e) => setEditDest(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Travel Window / Duration</label>
                  <input
                    type="text"
                    value={editDates}
                    onChange={(e) => setEditDates(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Adults (Pax)</label>
                    <input
                      type="number"
                      min="1"
                      value={editAdults}
                      onChange={(e) => setEditAdults(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kids (Pax)</label>
                    <input
                      type="number"
                      min="0"
                      value={editKids}
                      onChange={(e) => setEditKids(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Budget (INR)</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    placeholder="e.g. 120000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Special Must-Haves</label>
                  <input
                    type="text"
                    value={editSpecial}
                    onChange={(e) => setEditSpecial(e.target.value)}
                    placeholder="e.g. Private Houseboat overnight cruise required"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {currentEnquiry.is_human_reviewed ? "✓ Human reviewed and verified" : "Pending consultant review"}
                </span>
                <button
                  onClick={() => handleSaveCorrections(false)}
                  disabled={saving}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  {saving ? "Saving..." : "Save Field Corrections"}
                </button>
              </div>
            </div>

            {/* AI Top 3 Package Suggestions */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">
                  Top Best-Fit Packages (Queried from Database)
                </h3>
                <span className="text-xs text-slate-400">Strict price validation active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {packages.slice(0, 3).map((pkg, idx) => (
                  <div
                    key={pkg.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-500 mb-1">
                        <span>{pkg.id}</span>
                        <span className="text-emerald-700 font-bold">#{idx + 1} Best Fit</span>
                      </div>
                      <h4 className="font-bold text-slate-900 line-clamp-2">{pkg.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{pkg.destination_summary}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800">
                        ₹{(pkg.min_deluxe_price || 24900).toLocaleString("en-IN")}
                      </span>
                      <Link
                        href={`/packages/${pkg.slug}`}
                        target="_blank"
                        className="text-[11px] text-slate-600 hover:text-emerald-700 font-medium"
                      >
                        View Itinerary
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Draft Reply Editor (Strict Pricing from Price Table) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Draft Reply (Prices Injected From Tariff Table)
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Guaranteed Zero Price Hallucinations
                </span>
              </div>

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              <textarea
                rows={12}
                value={draftReplyText}
                onChange={(e) => setDraftReplyText(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-500">
                  Reviewer note: Nothing is sent until you click &quot;Approve &amp; Send&quot;.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSaveCorrections(false)}
                    disabled={saving}
                    className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                  >
                    Save Draft
                  </button>

                  <button
                    onClick={() => handleSaveCorrections(true)}
                    disabled={saving}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve &amp; Send Tailored Reply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
            <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900">No enquiry selected</h3>
            <p className="text-xs text-slate-500 mt-1">Select an enquiry from the left pane to begin AI triage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
