import "server-only";

import { randomUUID } from "node:crypto";
import db, { initDatabase } from "./db";
import { hashPassword, verifyPassword } from "./passwords";
import { canTravellerRespondToQuote, quoteResponseBlockReason } from "./quote-transitions";

export type TravellerAccount = {
  id: string;
  name: string;
  email: string;
};

export type TravellerQuoteResponse = "Accepted" | "Changes Requested" | "Declined";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function authenticateTraveller(email: string, password: string): Promise<TravellerAccount | null> {
  await initDatabase();
  const account = await db.prepare(`
    SELECT id, name, email, password_hash
    FROM users
    WHERE LOWER(email) = ? AND role = 'traveller'
  `).get(normalizeEmail(email)) as (TravellerAccount & { password_hash: string | null }) | undefined;

  if (!account?.password_hash || !(await verifyPassword(password, account.password_hash))) return null;
  await linkQuotesToTraveller(account.id, account.email);
  return { id: account.id, name: account.name, email: account.email };
}

export async function registerTraveller(input: {
  name: string;
  email: string;
  password: string;
  quoteNumber: string;
}): Promise<TravellerAccount> {
  await initDatabase();
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const quoteNumber = input.quoteNumber.trim().toUpperCase();

  const quote = await db.prepare(`
    SELECT id, traveller_user_id
    FROM quotes
    WHERE LOWER(email) = ? AND UPPER(quote_number) = ?
  `).get(email, quoteNumber) as { id: string; traveller_user_id: string | null } | undefined;

  if (!quote) throw new Error("We could not match that email and quote number.");
  if (quote.traveller_user_id) throw new Error("This quote is already linked to an account. Please sign in.");

  const existing = await db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(email);
  if (existing) throw new Error("An account already exists for this email. Please sign in.");

  const id = `usr_traveller_${randomUUID()}`;
  const passwordHash = await hashPassword(input.password);
  await db.prepare(`
    INSERT INTO users (id, name, email, role, password_hash)
    VALUES (?, ?, ?, 'traveller', ?)
  `).run(id, name, email, passwordHash);

  await linkQuotesToTraveller(id, email);
  return { id, name, email };
}

export async function linkQuotesToTraveller(userId: string, email: string) {
  await db.prepare(`
    UPDATE quotes
    SET traveller_user_id = ?
    WHERE LOWER(email) = ? AND traveller_user_id IS NULL
  `).run(userId, normalizeEmail(email));
}

export async function getTravellerAccount(userId: string): Promise<TravellerAccount | null> {
  await initDatabase();
  const account = await db.prepare(`
    SELECT id, name, email FROM users WHERE id = ? AND role = 'traveller'
  `).get(userId) as TravellerAccount | undefined;
  return account ?? null;
}

export async function getTravellerQuotes(userId: string) {
  await initDatabase();
  return db.prepare(`
    SELECT q.id, q.quote_number, q.travel_date, q.adults_count, q.kids_count,
           q.selected_tier, q.grand_total, q.gst_amount, q.status,
           q.traveller_response, q.responded_at, q.created_at,
           p.title AS package_title, p.destination_summary, p.duration_days, p.duration_nights,
           p.featured_image
    FROM quotes q
    JOIN packages p ON p.id = q.package_id
    WHERE q.traveller_user_id = ?
    ORDER BY q.created_at DESC
  `).all(userId);
}

export async function travellerOwnsQuote(userId: string, quoteId: string) {
  await initDatabase();
  const quote = await db.prepare(`
    SELECT id FROM quotes
    WHERE (id = ? OR quote_number = ?) AND traveller_user_id = ?
  `).get(quoteId, quoteId, userId);
  return Boolean(quote);
}

export async function respondToTravellerQuote(input: {
  userId: string;
  quoteId: string;
  status: TravellerQuoteResponse;
  message: string;
}) {
  await initDatabase();
  const account = await getTravellerAccount(input.userId);
  if (!account) throw new Error("Traveller account not found.");

  const quote = await db.prepare(`
    SELECT id, quote_number, status
    FROM quotes
    WHERE (id = ? OR quote_number = ?) AND traveller_user_id = ?
  `).get(input.quoteId, input.quoteId, input.userId) as { id: string; quote_number: string; status: string } | undefined;
  if (!quote) throw new Error("Quote not found.");
  if (!canTravellerRespondToQuote(quote.status)) throw new Error(quoteResponseBlockReason(quote.status));

  const message = input.message.trim();
  if (input.status === "Changes Requested" && message.length < 10) {
    throw new Error("Please describe the requested change in at least 10 characters.");
  }

  const update = await db.prepare(`
    UPDATE quotes
    SET status = ?, traveller_response = ?, responded_at = CURRENT_TIMESTAMP
    WHERE id = ? AND traveller_user_id = ?
      AND status IN ('Sent', 'Changes Requested', 'Declined')
  `).run(input.status, message || null, quote.id, input.userId);
  if (update.changes !== 1) throw new Error(quoteResponseBlockReason(quote.status));

  await db.prepare(`
    INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, 'quote', ?, ?)
  `).run(
    input.userId,
    account.name,
    `QUOTE_${input.status.toUpperCase().replace(/ /g, "_")}`,
    quote.id,
    `${account.name} marked ${quote.quote_number} as ${input.status}${message ? `: ${message}` : "."}`
  );
}
