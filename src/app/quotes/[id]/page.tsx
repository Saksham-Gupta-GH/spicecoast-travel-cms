import { notFound } from "next/navigation";
import db, { initDatabase } from "@/lib/db";
import { QuoteViewClient } from "./QuoteViewClient";

await initDatabase();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await db.prepare(`
    SELECT quote_number, traveller_name FROM quotes WHERE id = ? OR quote_number = ?
  `).get(id, id) as any;

  if (!quote) return { title: "Quote Not Found" };

  return {
    title: `Holiday Proposal #${quote.quote_number} for ${quote.traveller_name} | SpiceCoast`,
  };
}

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quote = await db.prepare(`
    SELECT q.*, p.title as package_title, p.slug as package_slug,
           p.destination_summary, p.duration_days, p.duration_nights,
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
    itinerary,
  };

  return <QuoteViewClient quote={parsedQuote} />;
}
