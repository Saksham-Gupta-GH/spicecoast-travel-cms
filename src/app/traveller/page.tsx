import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight, FileCheck2, LogOut, MapPin, MessageSquareText, UsersRound } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getTravellerSession } from "@/lib/auth";
import { getTravellerAccount, getTravellerQuotes } from "@/lib/traveller-portal";

export const dynamic = "force-dynamic";

type QuoteSummary = {
  id: string;
  quote_number: string;
  travel_date: string;
  adults_count: number;
  kids_count: number;
  selected_tier: string;
  grand_total: number;
  status: string;
  traveller_response: string | null;
  package_title: string;
  destination_summary: string;
  duration_days: number;
  duration_nights: number;
  featured_image: string;
};

const STATUS_STYLES: Record<string, string> = {
  Sent: "bg-blue-50 text-blue-800 border-blue-200",
  "Changes Requested": "bg-amber-50 text-amber-900 border-amber-200",
  Accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Declined: "bg-red-50 text-red-800 border-red-200",
  Expired: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function TravellerPortalPage() {
  const session = await getTravellerSession();
  if (!session) redirect("/traveller-login?next=/traveller");
  const account = await getTravellerAccount(session.userId);
  if (!account) redirect("/traveller-login");
  const quotes = await getTravellerQuotes(session.userId) as QuoteSummary[];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Private traveller portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Welcome, {account.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review proposals prepared for you, respond to your consultant and keep every decision attached to the quote.</p>
          </div>
          <form action="/api/traveller/auth/logout" method="post">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"><LogOut className="h-4 w-4" /> Sign out</button>
          </form>
        </div>

        {quotes.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileCheck2 className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">No proposals yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Your consultant will link a proposal to this account after reviewing your enquiry.</p>
            <Link href="/#enquiry" className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Send an enquiry</Link>
          </section>
        ) : (
          <div className="space-y-6">
            {quotes.map((quote) => (
              <article key={quote.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md md:grid md:grid-cols-[260px_1fr]">
                <div className="relative min-h-48 bg-slate-100 md:min-h-full">
                  <Image src={quote.featured_image} alt="" fill sizes="(min-width: 768px) 260px, 100vw" className="object-cover" />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">#{quote.quote_number}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[quote.status] || STATUS_STYLES.Sent}`}>{quote.status}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-slate-900">{quote.package_title}</h2>
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{quote.destination_summary}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400">Total including 5% GST</p>
                      <p className="mt-1 font-mono text-2xl font-black text-slate-900">₹{quote.grand_total.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
                    <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><CalendarDays className="h-4 w-4 text-emerald-600" />{new Date(quote.travel_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><UsersRound className="h-4 w-4 text-emerald-600" />{quote.adults_count} adults{quote.kids_count ? `, ${quote.kids_count} child` : ""}</span>
                    <span className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><FileCheck2 className="h-4 w-4 text-emerald-600" />{quote.selected_tier} • {quote.duration_days}D/{quote.duration_nights}N</span>
                  </div>

                  {quote.traveller_response && <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />{quote.traveller_response}</p>}

                  <div className="mt-6 flex justify-end">
                    <Link href={`/quotes/${quote.id}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Review proposal <ChevronRight className="h-4 w-4" /></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
