import db from "./db";

export interface ExtractedEnquiryData {
  destination: string;
  travelDates: string;
  adults: number;
  kids: number;
  budgetInr: number | null;
  specialRequests: string;
  confidence: number;
}

export interface PackageSuggestion {
  id: string;
  title: string;
  category: string;
  duration: string;
  samplePrice: number;
  seasonLabel: string;
  matchScore: number;
  matchReason: string;
}

export interface AIDraftReplyResult {
  extracted: ExtractedEnquiryData;
  suggestedPackages: PackageSuggestion[];
  draftReply: string;
  acknowledgementTemplate: string;
  provider: "gemini" | "openrouter" | "local";
  model: string;
  fallbackReason: string | null;
}

interface ExtractionResult {
  extracted: ExtractedEnquiryData;
  provider: AIDraftReplyResult["provider"];
  model: string;
  fallbackReason: string | null;
}

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    destination: { type: "string", description: "Requested destinations or broad region." },
    travelDates: { type: "string", description: "Travel month, dates and/or duration. Do not invent exact dates." },
    adults: { type: "integer", minimum: 1, maximum: 100 },
    kids: { type: "integer", minimum: 0, maximum: 50 },
    budgetInr: { type: ["integer", "null"], minimum: 0, maximum: 100000000 },
    specialRequests: { type: "string", description: "Must-haves and constraints, or Standard holiday customization." },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["destination", "travelDates", "adults", "kids", "budgetInr", "specialRequests", "confidence"],
} as const;

function clampText(value: unknown, fallback: string, maxLength = 500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function validateExtraction(value: unknown): ExtractedEnquiryData {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("AI returned a non-object extraction");
  const data = value as Record<string, unknown>;
  if (!Number.isInteger(data.adults) || Number(data.adults) < 1 || Number(data.adults) > 100) throw new Error("Invalid adults count");
  if (!Number.isInteger(data.kids) || Number(data.kids) < 0 || Number(data.kids) > 50) throw new Error("Invalid kids count");
  if (data.budgetInr !== null && (!Number.isInteger(data.budgetInr) || Number(data.budgetInr) < 0 || Number(data.budgetInr) > 100000000)) {
    throw new Error("Invalid INR budget");
  }
  if (typeof data.confidence !== "number" || !Number.isFinite(data.confidence)) throw new Error("Invalid confidence");

  return {
    destination: clampText(data.destination, "Kerala Highlights", 200),
    travelDates: clampText(data.travelDates, "Upcoming Season", 200),
    adults: Number(data.adults),
    kids: Number(data.kids),
    budgetInr: data.budgetInr === null ? null : Number(data.budgetInr),
    specialRequests: clampText(data.specialRequests, "Standard holiday customization"),
    confidence: Math.max(0, Math.min(1, data.confidence)),
  };
}

export function redactDirectIdentifiers(message: string) {
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[REDACTED_PHONE]")
    .slice(0, 3000);
}

function extractionPrompt(message: string) {
  return `Extract travel enquiry facts from the message below. Return only schema-compliant JSON.

Rules:
- Budget must be total INR as an integer; convert lakh/lac and k/thousand. Use null if absent.
- Keep ambiguous dates or durations as written; never invent exact dates.
- Adults defaults to 2 only when party size is genuinely unstated. Kids defaults to 0.
- Put must-haves, accessibility, dietary and accommodation preferences in specialRequests.
- Confidence must reflect ambiguity: below 0.70 when important facts conflict or are unclear.
- Do not include personal identifiers.

Traveller message:
${redactDirectIdentifiers(message)}

Required JSON schema:
${JSON.stringify(EXTRACTION_SCHEMA)}`;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonText(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

async function extractWithGemini(message: string): Promise<ExtractionResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: extractionPrompt(message) }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 700,
          responseMimeType: "application/json",
          responseJsonSchema: EXTRACTION_SCHEMA,
        },
      }),
    },
    12000
  );
  const payload = await response.json() as any;
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new Error("Gemini returned no structured candidate");
  return { extracted: validateExtraction(parseJsonText(text)), provider: "gemini", model, fallbackReason: null };
}

async function extractWithOpenRouter(message: string, geminiFailure: string): Promise<ExtractionResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const response = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://spicecoast-travel-cms.vercel.app",
        "X-Title": "SpiceCoast Travel CMS",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You extract travel enquiry facts. Return JSON only and never invent missing facts." },
          { role: "user", content: extractionPrompt(message) },
        ],
        temperature: 0,
        max_completion_tokens: 700,
        response_format: { type: "json_object" },
      }),
    },
    8000
  );
  const payload = await response.json() as any;
  if (payload?.error?.message) throw new Error(`OpenRouter: ${String(payload.error.message).slice(0, 180)}`);
  const content = payload?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content : content?.find?.((part: any) => part?.type === "text")?.text;
  if (typeof text !== "string") throw new Error("OpenRouter returned no structured completion");
  return { extracted: validateExtraction(parseJsonText(text)), provider: "openrouter", model: payload?.model || model, fallbackReason: geminiFailure };
}

export async function extractEnquiryWithFallback(message: string): Promise<ExtractionResult> {
  let geminiFailure = "Gemini was unavailable";
  try {
    return await extractWithGemini(message);
  } catch (error) {
    geminiFailure = error instanceof Error ? error.message : geminiFailure;
  }

  try {
    return await extractWithOpenRouter(message, geminiFailure);
  } catch (error) {
    const openRouterFailure = error instanceof Error ? error.message : "OpenRouter was unavailable";
    return {
      extracted: extractEnquiryLocally(message),
      provider: "local",
      model: "spicecoast-deterministic-v1",
      fallbackReason: `Gemini: ${geminiFailure}; OpenRouter: ${openRouterFailure}`.slice(0, 500),
    };
  }
}

/**
 * Deterministic NLP Extraction Rule Engine
 * Guaranteed to run 100% offline with zero token cost and zero network lag,
 * using deterministic, testable local extraction and database-backed ranking.
 */
export function extractEnquiryLocally(message: string): ExtractedEnquiryData {
  const text = message.toLowerCase();

  // 1. Extract Adults & Kids
  let adults = 2; // sensible default
  let kids = 0;

  const adultMatch = text.match(/(\d+)\s*(?:senior|academics|guests|travelers|travellers|members)?\s*(adult|adults|pax|persons|people|elder|senior|academics)/i);
  const groupMatch = text.match(/(?:group of|party of|we are|total of)\s*(\d+)/i);

  if (adultMatch) {
    adults = parseInt(adultMatch[1], 10);
  } else if (groupMatch) {
    adults = parseInt(groupMatch[1], 10);
  } else if (text.includes("couple") || text.includes("honeymoon") || text.includes("me and my wife") || text.includes("husband and i")) {
    adults = 2;
  } else if (text.includes("solo") || text.includes("myself")) {
    adults = 1;
  }

  const kidMatch = text.match(/(\d+)\s*(kid|kids|child|children|infant|baby|babies|son|daughter)/i);
  if (kidMatch) {
    kids = parseInt(kidMatch[1], 10);
  }

  // 2. Extract Budget
  let budgetInr: number | null = null;
  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
  const kMatch = text.match(/(\d+)\s*(?:k|thousand)/i);
  const rawNumMatch = text.match(/(?:budget|around|upto|approx|about)\s*(?:of|is|rs\.?|inr|₹)?\s*(\d{4,7})/i);

  if (lakhMatch) {
    budgetInr = Math.round(parseFloat(lakhMatch[1]) * 100000);
  } else if (kMatch) {
    budgetInr = parseInt(kMatch[1], 10) * 1000;
  } else if (rawNumMatch) {
    budgetInr = parseInt(rawNumMatch[1], 10);
  } else {
    // Check range like "80k to 1 lakh"
    const rangeMatch = text.match(/(\d+)\s*k?\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|k)/i);
    if (rangeMatch) {
      if (text.includes("lakh") || text.includes("lac")) {
        budgetInr = Math.round(parseFloat(rangeMatch[2]) * 100000);
      } else {
        budgetInr = parseInt(rangeMatch[2], 10) * 1000;
      }
    }
  }

  // 3. Extract Destination & Key Landmarks
  const destinations: string[] = [];
  if (text.includes("munnar")) destinations.push("Munnar");
  if (text.includes("alleppey") || text.includes("alappuzha") || text.includes("backwater") || text.includes("houseboat")) {
    destinations.push("Alleppey");
  }
  if (text.includes("thekkady") || text.includes("periyar")) destinations.push("Thekkady");
  if (text.includes("wayanad")) destinations.push("Wayanad");
  if (text.includes("kochi") || text.includes("cochin") || text.includes("marari") || text.includes("kumarakom")) {
    destinations.push("Central Kerala");
  }
  if (text.includes("madurai") || text.includes("rameswaram") || text.includes("kanyakumari") || text.includes("temple")) {
    destinations.push("Tamil Nadu / Southern Heritage");
  }

  let destination = destinations.length > 0 ? destinations.join(", ") : "Kerala Highlights";
  if (text.includes("kerala") && !destinations.length) {
    destination = "Kerala (All Highlights)";
  }

  // 4. Extract Travel Dates / Duration
  let travelDates = "Upcoming Season";
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  for (const m of months) {
    if (text.includes(m)) {
      travelDates = m.charAt(0).toUpperCase() + m.slice(1) + " 2026/27";
      break;
    }
  }

  const durationMatch = text.match(/(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:night|nights|day|days)/i);
  if (durationMatch) {
    const durStr = durationMatch[2] ? `${durationMatch[1]}-${durationMatch[2]} Nights` : `${durationMatch[1]} Nights`;
    travelDates = travelDates === "Upcoming Season" ? durStr : `${travelDates} (${durStr})`;
  }

  // 5. Extract Special Preferences / Must-Haves
  const requests: string[] = [];
  if (text.includes("houseboat") || text.includes("boat")) requests.push("Private Houseboat overnight cruise required");
  if (text.includes("pool") || text.includes("villa") || text.includes("resort")) requests.push("Pool villa / premium luxury resort requested");
  if (text.includes("honeymoon") || text.includes("anniversary")) requests.push("Honeymoon special arrangements & candlelight dinner");
  if (text.includes("temple") || text.includes("darshan")) requests.push("Temple special darshan & spiritual circuit");
  if (text.includes("veg") || text.includes("jain")) requests.push("Vegetarian/Jain dining preference");
  if (kids > 0) requests.push(`Family friendly pacing with ${kids} child/children`);

  const specialRequests = requests.length > 0 ? requests.join(" • ") : "Standard holiday customization";

  const evidenceCount = [
    Boolean(adultMatch || groupMatch || text.includes("couple") || text.includes("honeymoon") || text.includes("solo")),
    Boolean(kidMatch),
    budgetInr !== null,
    travelDates !== "Upcoming Season",
    destinations.length > 0 || text.includes("kerala"),
    requests.length > 0,
  ].filter(Boolean).length;

  return {
    destination,
    travelDates,
    adults,
    kids,
    budgetInr,
    specialRequests,
    confidence: Math.min(0.96, 0.58 + evidenceCount * 0.065),
  };
}

/**
 * Suggest Top 3 Best-Fit Packages from Database
 */
export async function getPackageSuggestions(extracted: ExtractedEnquiryData, message: string): Promise<PackageSuggestion[]> {
  const packages = await db.prepare(`
    SELECT p.*,
      MIN(sp.deluxe_price_pp) as min_deluxe_price,
      MIN(sp.season_name) as season_name
    FROM packages p
    LEFT JOIN seasonal_prices sp ON p.id = sp.package_id
    GROUP BY p.id
  `).all() as any[];

  const scored = packages.map((pkg) => {
    let score = 50; // base score
    const reasons: string[] = [];

    const text = message.toLowerCase();
    const destJson = JSON.parse(pkg.destinations_json || "[]");

    // Check destination overlap
    const hasDestMatch = destJson.some((d: string) => text.includes(d.toLowerCase()));
    if (hasDestMatch) {
      score += 35;
      reasons.push("Matches requested destinations");
    }

    // Check category fit
    if (extracted.kids > 0 && pkg.category === "Family") {
      score += 25;
      reasons.push("Tailored for family travel with children");
    } else if (text.includes("honeymoon") && pkg.category === "Honeymoon") {
      score += 30;
      reasons.push("Dedicated romantic honeymoon package");
    } else if (text.includes("temple") && pkg.id === "PKG-SI-12") {
      score += 40;
      reasons.push("Dedicated pilgrim & temple heritage itinerary");
    }

    // Check Houseboat requirement
    if (text.includes("houseboat") && pkg.title.toLowerCase().includes("houseboat")) {
      score += 30;
      reasons.push("Features overnight private backwater houseboat");
    }

    // Budget check
    if (extracted.budgetInr && pkg.min_deluxe_price) {
      const estimatedTotal = pkg.min_deluxe_price * extracted.adults;
      if (estimatedTotal <= extracted.budgetInr) {
        score += 20;
        reasons.push(`Comfortably within budget (est. ₹${estimatedTotal.toLocaleString("en-IN")})`);
      } else if (estimatedTotal <= extracted.budgetInr * 1.2) {
        score += 5;
        reasons.push("Close to specified budget target");
      }
    }

    return {
      id: pkg.id,
      title: pkg.title,
      category: pkg.category,
      duration: `${pkg.duration_days}D / ${pkg.duration_nights}N`,
      samplePrice: pkg.min_deluxe_price || 24900,
      seasonLabel: pkg.season_name || "Seasonal Rate",
      matchScore: score,
      matchReason: reasons.join(". ") || "Popular South India holiday circuit",
    };
  });

  // Sort descending by score and return top 3
  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, 3);
}

/**
 * Generate Draft Reply
 * STRICT CONSTRAINT:
 * "prices in drafts come from the package price table, never from the AI."
 */
export async function generateDraftReply(
  travellerName: string,
  extracted: ExtractedEnquiryData,
  suggestions: PackageSuggestion[],
  consultantName: string = "Mathew Varghese"
): Promise<string> {
  const topPkgId = suggestions[0]?.id || "PKG-KL-07";

  // Fetch actual prices from the database price table for topPkgId
  const prices = await db.prepare(`
    SELECT * FROM seasonal_prices
    WHERE package_id = ?
    ORDER BY standard_price_pp ASC
  `).all(topPkgId) as any[];

  const pkgRecord = await db.prepare(`SELECT * FROM packages WHERE id = ?`).get(topPkgId) as any;

  let pricingBreakdownText = "";
  if (prices.length > 0) {
    pricingBreakdownText = prices.map(p =>
      `• ${p.season_name} (${p.period_label}):\n  - Standard Tier: ₹${p.standard_price_pp.toLocaleString("en-IN")} per person\n  - Deluxe Tier: ₹${p.deluxe_price_pp.toLocaleString("en-IN")} per person\n  - Luxury Tier: ₹${p.luxury_price_pp.toLocaleString("en-IN")} per person\n  (Prices on twin-sharing basis, inclusive of 5% GST)`
    ).join("\n");
  } else {
    pricingBreakdownText = "• Seasonal package rates start from ₹24,900 per person on twin-sharing basis including 5% GST.";
  }

  const childNote = extracted.kids > 0
    ? `\nWe have also noted you are traveling with ${extracted.kids} child/children. We can provide an extra rollaway bed or mattress at nominal supplementary cost.`
    : "";

  const specialNote = extracted.specialRequests
    ? `\nRegarding your request (${extracted.specialRequests}), our team will ensure this is prioritized in the hotel room allotment and cruise logistics.`
    : "";

  return `Dear ${travellerName || "Valued Traveller"},

Warm greetings from SpiceCoast Holidays, Kochi!

Thank you for your enquiry regarding your upcoming trip to ${extracted.destination} for ${extracted.adults} adults${extracted.kids > 0 ? ` and ${extracted.kids} child` : ""}.

Based on your preferred travel window of ${extracted.travelDates}, we enthusiastically recommend our signature itinerary:

🏆 ${pkgRecord?.title || suggestions[0]?.title} (${topPkgId})
• Duration: ${pkgRecord?.duration_days || 6} Days / ${pkgRecord?.duration_nights || 5} Nights
• Route Highlights: ${pkgRecord?.destination_summary || "Kochi • Munnar • Thekkady • Alleppey"}

Official Seasonal Pricing Table (Twin-Sharing Basis):
${pricingBreakdownText}
${childNote}${specialNote}

All demo packages include private chauffeur-driven AC vehicle, daily breakfast, 24/7 on-tour customer support, driver allowances, toll/parking, and the assumed 5% GST shown in the tariff table.

Would you like us to prepare a formal customized day-wise quote and reserve accommodation options for your travel dates?

Warm regards,

${consultantName}
Senior Tour Consultant | SpiceCoast Holidays
MG Road, Ravipuram, Kochi, Kerala
Phone: +91 484 238 9000 | Email: holidays@spicecoast.in`;
}

/**
 * Fixed instant acknowledgement template (sent automatically upon receipt)
 */
export function getInstantAcknowledgement(travellerName: string, enquiryId: string): string {
  return `Dear ${travellerName || "Traveller"},

Thank you for reaching out to SpiceCoast Holidays (Kochi)! We have received your holiday enquiry [Ref: ${enquiryId}].

A dedicated Kerala travel specialist is already reviewing your preferences and will share a customized day-by-day itinerary and official quote within 1 hour.

If you need urgent assistance, you can also reach our Kochi headquarters directly at +91 484 238 9000.

Warm regards,
Customer Experience Team
SpiceCoast Holidays, Kochi`;
}

/**
 * Master AI Triage Pipeline
 */
export async function triageEnquiry(message: string, travellerName: string, enquiryId: string): Promise<AIDraftReplyResult> {
  // 1. Perform privacy-redacted provider extraction with two fallbacks
  const extraction = await extractEnquiryWithFallback(message);
  const extracted = extraction.extracted;

  // 2. Compute package suggestions
  const suggestedPackages = await getPackageSuggestions(extracted, message);

  // 3. Draft reply with verified database prices
  const draftReply = await generateDraftReply(travellerName, extracted, suggestedPackages);

  // 4. Fixed template instant acknowledgment
  const acknowledgementTemplate = getInstantAcknowledgement(travellerName, enquiryId);

  return {
    extracted,
    suggestedPackages,
    draftReply,
    acknowledgementTemplate,
    provider: extraction.provider,
    model: extraction.model,
    fallbackReason: extraction.fallbackReason,
  };
}
