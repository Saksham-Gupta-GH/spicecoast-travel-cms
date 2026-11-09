import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/passwords";
import { resolveRoutePoints } from "../src/lib/route-points";
import { canTravellerRespondToQuote, quoteResponseBlockReason } from "../src/lib/quote-transitions";

describe("Traveller account password security", () => {
  test("hashes passwords with a unique salt and verifies the correct password", async () => {
    const first = await hashPassword("StrongTraveller!2026");
    const second = await hashPassword("StrongTraveller!2026");

    assert.notEqual(first, second);
    assert.equal(await verifyPassword("StrongTraveller!2026", first), true);
    assert.equal(await verifyPassword("WrongTraveller!2026", first), false);
  });

  test("rejects malformed stored hashes", async () => {
    assert.equal(await verifyPassword("anything", "not-a-valid-hash"), false);
  });
});

describe("Package route maps", () => {
  test("resolves ordered Kerala stops and removes duplicates", () => {
    const points = resolveRoutePoints(["Kochi", "Munnar", "Thekkady", "Alleppey", "Kochi"]);
    assert.deepEqual(points.map((point) => point.name), ["Kochi", "Munnar", "Thekkady", "Alleppey"]);
  });

  test("supports aliases and ignores unknown locations safely", () => {
    const points = resolveRoutePoints(["Cochin", "Alappuzha", "Unknown resort"]);
    assert.deepEqual(points.map((point) => point.name), ["Kochi", "Alleppey"]);
  });
});

describe("Traveller quote response transitions", () => {
  test("allows reviewable proposals and rejects drafts or final states", () => {
    assert.equal(canTravellerRespondToQuote("Sent"), true);
    assert.equal(canTravellerRespondToQuote("Changes Requested"), true);
    assert.equal(canTravellerRespondToQuote("Declined"), true);
    assert.equal(canTravellerRespondToQuote("Draft"), false);
    assert.equal(canTravellerRespondToQuote("Accepted"), false);
    assert.equal(canTravellerRespondToQuote("Expired"), false);
    assert.match(quoteResponseBlockReason("Accepted"), /already been accepted/i);
  });
});
