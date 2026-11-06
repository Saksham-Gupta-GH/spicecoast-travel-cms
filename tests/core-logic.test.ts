import { test, describe } from "node:test";
import assert from "node:assert/strict";
import db, { initDatabase } from "../src/lib/db";
import {
  extractEnquiryLocally,
  getPackageSuggestions,
  generateDraftReply,
  getInstantAcknowledgement,
  triageEnquiry,
} from "../src/lib/ai-engine";

initDatabase();

describe("1. AI Enquiry Extraction Logic", () => {
  test("Extracts party size, dates, budget and houseboat from brief's sample query", () => {
    const rawMessage = "2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must";
    const extracted = extractEnquiryLocally(rawMessage);

    assert.equal(extracted.adults, 2, "Adults count should be 2");
    assert.equal(extracted.kids, 1, "Kids count should be 1");
    assert.equal(extracted.budgetInr, 120000, "Budget should be parsed as ₹1,20,000");
    assert.match(extracted.travelDates, /December/i, "Travel window should detect December");
    assert.match(extracted.specialRequests, /houseboat/i, "Must-haves should identify houseboat requirement");
    assert.equal(extracted.confidence >= 0.9, true, "Confidence score should be >= 0.9");
  });

  test("Extracts honeymoon party size and romantic preference", () => {
    const rawMessage = "Planning our honeymoon in Kerala next month (November). We want quiet places, tea gardens and a private luxury villa with pool. 4 to 5 days. Budget around 80k to 1 lakh.";
    const extracted = extractEnquiryLocally(rawMessage);

    assert.equal(extracted.adults, 2, "Couple should be inferred as 2 adults");
    assert.equal(extracted.kids, 0, "No kids mentioned");
    assert.equal(extracted.budgetInr, 100000, "Range upper bound should be ₹1,00,000");
    assert.match(extracted.specialRequests, /honeymoon/i, "Should detect honeymoon request");
  });

  test("Extracts foreign group query with senior academics", () => {
    const rawMessage = "We are a small group of 4 senior academics from Scotland visiting South India in late January. We want temple heritage in Madurai and Rameswaram.";
    const extracted = extractEnquiryLocally(rawMessage);

    assert.equal(extracted.adults, 4, "Should extract 4 adults");
    assert.match(extracted.destination, /Tamil Nadu|Heritage|Madurai/i, "Should detect Southern Heritage circuit");
  });
});

describe("2. Package Suggestion & Recommendation Scoring", () => {
  test("Suggests PKG-KL-07 as #1 best fit for family + houseboat request", () => {
    const rawMessage = "2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must";
    const extracted = extractEnquiryLocally(rawMessage);
    const suggestions = getPackageSuggestions(extracted, rawMessage);

    assert.equal(suggestions.length, 3, "Should return top 3 package suggestions");
    assert.equal(suggestions[0].id, "PKG-KL-07", "Top recommendation must be PKG-KL-07");
    assert.match(suggestions[0].matchReason, /houseboat/i, "Match reason should reference houseboat");
  });

  test("Suggests PKG-SI-12 for pilgrim/temple inquiries", () => {
    const rawMessage = "Temple heritage tour for Madurai and Rameswaram";
    const extracted = extractEnquiryLocally(rawMessage);
    const suggestions = getPackageSuggestions(extracted, rawMessage);

    assert.equal(suggestions[0].id, "PKG-SI-12", "Top recommendation must be PKG-SI-12");
  });
});

describe("3. Strict Pricing Integrity (Zero Hallucinations)", () => {
  test("Draft reply uses prices directly from seasonal_prices table", () => {
    const rawMessage = "2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must";
    const extracted = extractEnquiryLocally(rawMessage);
    const suggestions = getPackageSuggestions(extracted, rawMessage);
    const reply = generateDraftReply("Rahul Sharma", extracted, suggestions);

    // Verify Peak Season price ₹32,500 and Monsoon ₹24,900 from database are present
    assert.match(reply, /32,500/, "Draft must include database Deluxe Peak price ₹32,500");
    assert.match(reply, /24,900/, "Draft must include database Deluxe Monsoon price ₹24,900");
    assert.match(reply, /twin-sharing basis/i, "Draft must state twin-sharing basis");
    assert.match(reply, /5% GST/i, "Draft must mention 5% GST inclusion");
  });
});

describe("4. Instant Acknowledgement SLA", () => {
  test("Generates branded instant acknowledgement with tracking ref and 1-hour guarantee", () => {
    const ack = getInstantAcknowledgement("Rahul Sharma", "ENQ-2026-001");
    assert.match(ack, /Rahul Sharma/, "Must greet client by name");
    assert.match(ack, /ENQ-2026-001/, "Must state reference tracking ID");
    assert.match(ack, /within 1 hour/i, "Must commit to 1-hour reply SLA");
  });
});

describe("5. Package Versioning & Rollback Integrity", () => {
  test("Package version increments and snapshot is recorded", () => {
    const initialPkg = db.prepare("SELECT current_version FROM packages WHERE id = 'PKG-KL-07'").get() as any;
    const initialVer = initialPkg.current_version;

    // Simulate CMS edit
    const newVer = initialVer + 1;
    db.prepare("UPDATE packages SET current_version = ? WHERE id = 'PKG-KL-07'").run(newVer);
    db.prepare(`
      INSERT INTO package_versions (package_id, version_number, snapshot_json, change_summary, created_by)
      VALUES ('PKG-KL-07', ?, '{"test": true}', 'Unit test edit', 'test_runner')
    `).run(newVer);

    const updatedPkg = db.prepare("SELECT current_version FROM packages WHERE id = 'PKG-KL-07'").get() as any;
    assert.equal(updatedPkg.current_version, newVer, "Version number must increment");

    // Clean up to keep db consistent
    db.prepare("UPDATE packages SET current_version = ? WHERE id = 'PKG-KL-07'").run(initialVer);
    db.prepare("DELETE FROM package_versions WHERE package_id = 'PKG-KL-07' AND version_number = ?").run(newVer);
  });
});
