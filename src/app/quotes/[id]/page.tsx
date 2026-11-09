import { notFound, redirect } from "next/navigation";
import db, { initDatabase } from "@/lib/db";
import { getStaffSession, getTravellerSession } from "@/lib/auth";
import { travellerOwnsQuote } from "@/lib/traveller-portal";
import { QuoteViewClient } from "./QuoteViewClient";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Private Holiday Proposal | SpiceCoast",
    robots: { index: false, follow: false },
  };
}

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  await initDatabase();
  const { id } = await params;
  const [staffSession, travellerSession] = await Promise.all([
    getStaffSession(),
    getTravellerSession(),
  ]);

  if (!staffSession && !travellerSession) {
    redirect(`/traveller-login?next=${encodeURIComponent(`/quotes/${id}`)}`);
  }

  if (!staffSession && travellerSession && !(await travellerOwnsQuote(travellerSession.userId, id))) {
    notFound();
  }

  const quote = await db.prepare(`
    SELECT q.*, p.title as package_title, p.slug as package_slug,
           p.destination_summary, p.duration_days, p.duration_nights,
           p.destinations_json,
           p.inclusions_json, p.exclusions_json, p.hotel_standard_name,
           p.hotel_deluxe_name, p.hotel_luxury_name
    FROM quotes q
    JOIN packages p ON q.package_id = p.id
    WHERE q.id = ? OR q.quote_number = ?
  `).get(id, id) as any;

  if (!quote) notFound();

  const itinerary = await db.prepare(`
    SELECT * FROM itinerary_days WHERE package_id = ? ORDER BY day_number ASC
  `).all(quote.package_id) as any[];

  const parsedQuote = {
    ...quote,
    inclusions: JSON.parse(quote.inclusions_json || "[]"),
    exclusions: JSON.parse(quote.exclusions_json || "[]"),
    destinations: JSON.parse(quote.destinations_json || "[]"),
    itinerary,
  };

  return <QuoteViewClient quote={parsedQuote} viewer={staffSession ? "staff" : "traveller"} />;
}
