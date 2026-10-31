import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ROUTES,
  DEFAULTS,
  evaluate,
  rankRoutes,
  visibleRoutes,
  validateSettings,
  snapshotDecision,
  validDecisions,
} from "../dist/model.mjs";
test("baseline cost reconciles and its arrival misses the deadline", () => {
  const r = evaluate(ROUTES.find((r) => r.id === "cape"));
  assert.equal(r.cost, 16880);
  assert.equal(r.arrival, "2026-12-19");
  assert.equal(r.buffer, -5);
  assert.deepEqual(r.failures, ["Late arrival"]);
});
test("fuel adjustment affects freight, not handling or insurance", () => {
  const route = ROUTES[0];
  const a = evaluate(route),
    b = evaluate(route, { ...DEFAULTS, fuel: 10 });
  assert.equal(b.cost - a.cost, 1440);
  assert.equal(b.origin, a.origin);
  assert.equal(b.insurance, a.insurance);
});
test("port disruption changes non-air transit only", () => {
  const s = { ...DEFAULTS, delay: 7 };
  assert.equal(evaluate(ROUTES[0], s).days, 38);
  assert.equal(
    evaluate(
      ROUTES.find((r) => r.id === "air"),
      s,
    ).days,
    7,
  );
});
test("feasibility ranks ahead of preferences and an impossible scenario has no recommendation", () => {
  assert.equal(rankRoutes(DEFAULTS)[0].id, "suez");
  const impossible = rankRoutes({
    ...DEFAULTS,
    budget: 15000,
    deadline: "2026-11-10",
    emissions: 10,
  });
  assert.ok(impossible.every((r) => !r.feasible));
});
test("preference changes can select lower-emission rail within the same constraints", () =>
  assert.equal(rankRoutes({ ...DEFAULTS, priority: "carbon" })[0].id, "rail"));
test("search and mode filters intersect; a zero result stays empty", () => {
  assert.equal(
    visibleRoutes({ ...DEFAULTS, mode: "rail", query: "ocean" }).length,
    0,
  );
  assert.equal(visibleRoutes({ ...DEFAULTS, mode: "ocean" }).length, 3);
});
test("a saved decision is immutable with respect to later planner changes", () => {
  const settings = { ...DEFAULTS };
  const saved = snapshotDecision(
    "suez",
    settings,
    "Fits the delivery window and the current budget.",
  );
  settings.fuel = 40;
  assert.equal(saved.settings.fuel, 0);
  assert.equal(saved.cost, 18420);
  assert.equal(saved.status, "Saved for review");
});
test("cannot save an infeasible route or an unexplained decision", () => {
  assert.throws(
    () => snapshotDecision("cape", DEFAULTS, "A reason that is long enough."),
    /does not meet/,
  );
  assert.throws(
    () => snapshotDecision("suez", DEFAULTS, "short"),
    /12 and 500/,
  );
});
test("stored values are bounded and invalid selections reset safely", () => {
  const s = validateSettings({
    budget: -1,
    fuel: 500,
    delay: 3.8,
    selected: "missing",
    deadline: "bad",
  });
  assert.equal(s.budget, 15000);
  assert.equal(s.fuel, 40);
  assert.equal(s.delay, 4);
  assert.equal(s.selected, "suez");
  assert.equal(s.deadline, DEFAULTS.deadline);
});
test("corrupted saved records are discarded without losing a valid scenario", () => {
  const valid = snapshotDecision(
    "suez",
    DEFAULTS,
    "Fits the delivery window and the current budget.",
  );
  assert.deepEqual(
    validDecisions([
      null,
      {},
      valid,
      { ...valid, arrival: "bad" },
      { ...valid, co2: null },
    ]),
    [valid],
  );
});
test("invalid calendar dates and dates before departure reset", () => {
  assert.equal(
    validateSettings({ ...DEFAULTS, deadline: "2026-11-31" }).deadline,
    DEFAULTS.deadline,
  );
  assert.equal(
    validateSettings({ ...DEFAULTS, deadline: "2026-11-01" }).deadline,
    DEFAULTS.deadline,
  );
});

test("numeric sorting supports ascending and descending order", () => {
  const asc = visibleRoutes({ ...DEFAULTS, sort: "cost", order: "asc" }),
    desc = visibleRoutes({ ...DEFAULTS, sort: "cost", order: "desc" });
  assert.equal(asc[0].id, "cape");
  assert.equal(desc[0].id, "air");
});
