import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULTS, ROUTES, evaluate } from "../dist/model.mjs";
import {
  timelineFor,
  comparisonFor,
  routeComparisonCsv,
} from "../dist/planning.mjs";

test("every journey reconciles to its route duration and arrival", () => {
  for (const r of ROUTES) {
    for (const delay of [0, 7, 14]) {
      const settings = { ...DEFAULTS, delay };
      const timeline = timelineFor(r.id, settings);
      assert.equal(timeline.totalDays, evaluate(r, settings).days);
      assert.equal(timeline.arrival, evaluate(r, settings).arrival);
      assert.equal(timeline.segments.at(-1).endDate, timeline.arrival);
    }
  }
});
test("a stress-test hold appears before arrival handling and does not affect air", () => {
  const route = timelineFor("suez", { ...DEFAULTS, delay: 7 });
  assert.equal(route.segments.at(-2).kind, "delay");
  assert.equal(route.segments.at(-2).days, 7);
  assert.equal(route.segments.at(-1).kind, "destination");
  assert.ok(
    timelineFor("air", { ...DEFAULTS, delay: 7 }).segments.every(
      (s) => s.kind !== "delay",
    ),
  );
});
test("comparison distinguishes cheapest from feasible", () => {
  const comparison = comparisonFor(["cape", "suez", "rail"], DEFAULTS);
  assert.equal(comparison.items.find((r) => r.lowestCost).id, "cape");
  assert.equal(comparison.items.find((r) => r.lowestCost).feasible, false);
  assert.equal(comparison.items.find((r) => r.fastest).id, "rail");
  assert.equal(comparison.items.find((r) => r.lowestCarbon).id, "rail");
});
test("comparison deduplicates routes and calculates differences against the pinned reference", () => {
  const comparison = comparisonFor(["suez", "rail", "rail"], {
    ...DEFAULTS,
    baseline: "rail",
  });
  assert.equal(comparison.items.length, 2);
  assert.equal(comparison.items[0].costDelta, -3440);
  assert.equal(comparison.items[1].costDelta, 0);
  assert.throws(() => comparisonFor(["suez"], DEFAULTS));
});
test("CSV includes only requested routes and keeps calculation assumptions", () => {
  const csv = routeComparisonCsv(["suez", "rail"], {
    ...DEFAULTS,
    baseline: "rail",
    fuel: 15,
  });
  assert.equal(csv.split("\r\n").length, 3);
  assert.ok(csv.includes("Comparison baseline"));
  assert.ok(csv.includes("Rail · Middle Corridor"));
  assert.ok(!csv.includes("Cape of Good Hope"));
  assert.ok(csv.includes('"20580"'));
  assert.ok(csv.includes('"15","0","22000","2026-12-14"'));
});
