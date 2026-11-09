import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/passwords";
import { resolveRoutePoints } from "../src/lib/route-points";

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
