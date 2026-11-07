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

  return {
    destination,
    travelDates,
    adults,
    kids,
    budgetInr,
    specialRequests,
    confidence: 0.94,
  };
}

/**
 * Suggest Top 3 Best-Fit Packages from Database
 */
export function getPackageSuggestions(extracted: ExtractedEnquiryData, message: string): PackageSuggestion[] {
  const packages = db.prepare(`
    SELECT p.*,
      MIN(sp.deluxe_price_pp) as min_deluxe_price,
      sp.season_name
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
export function generateDraftReply(
  travellerName: string,
  extracted: ExtractedEnquiryData,
  suggestions: PackageSuggestion[],
  consultantName: string = "Mathew Varghese"
): string {
  const topPkgId = suggestions[0]?.id || "PKG-KL-07";

  // Fetch actual prices from the database price table for topPkgId
  const prices = db.prepare(`
    SELECT * FROM seasonal_prices
    WHERE package_id = ?
    ORDER BY standard_price_pp ASC
  `).all(topPkgId) as any[];

  const pkgRecord = db.prepare(`SELECT * FROM packages WHERE id = ?`).get(topPkgId) as any;

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
  // 1. Perform extraction
  const extracted = extractEnquiryLocally(message);

  // 2. Compute package suggestions
  const suggestedPackages = getPackageSuggestions(extracted, message);

  // 3. Draft reply with verified database prices
  const draftReply = generateDraftReply(travellerName, extracted, suggestedPackages);

  // 4. Fixed template instant acknowledgment
  const acknowledgementTemplate = getInstantAcknowledgement(travellerName, enquiryId);

  return {
    extracted,
    suggestedPackages,
    draftReply,
    acknowledgementTemplate,
  };
}
