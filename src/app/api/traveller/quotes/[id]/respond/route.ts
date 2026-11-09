import { NextResponse } from "next/server";
import { getTravellerSession } from "@/lib/auth";
import { internalServerError } from "@/lib/api-response";
import { respondToTravellerQuote, type TravellerQuoteResponse } from "@/lib/traveller-portal";

const ALLOWED_STATUSES = new Set<TravellerQuoteResponse>(["Accepted", "Changes Requested", "Declined"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getTravellerSession();
  if (!session) return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });

  let body: { status?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.status !== "string" || !ALLOWED_STATUSES.has(body.status as TravellerQuoteResponse)) {
    return NextResponse.json({ success: false, error: "Invalid quote response" }, { status: 400 });
  }
  if (body.message !== undefined && typeof body.message !== "string") {
    return NextResponse.json({ success: false, error: "Response message must be text" }, { status: 400 });
  }
  const message = (body.message || "").trim();
  if (message.length > 1000) {
    return NextResponse.json({ success: false, error: "Response must be 1,000 characters or fewer" }, { status: 400 });
  }

  try {
    const { id } = await params;
    await respondToTravellerQuote({
      userId: session.userId,
      quoteId: id,
      status: body.status as TravellerQuoteResponse,
      message,
    });
    return NextResponse.json({ success: true, status: body.status, message });
  } catch (error: unknown) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }
    if (error instanceof Error && /accepted|expired|not been sent|not available/i.test(error.message)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    if (error instanceof Error && /describe/i.test(error.message)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return internalServerError("POST /api/traveller/quotes/[id]/respond", error);
  }
}
