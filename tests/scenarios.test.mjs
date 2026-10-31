import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULTS,
  applyStressPreset,
  referenceRoute,
  rankRoutes,
  validateSettings,
  snapshotDecision,
} from "../dist/model.mjs";

test("stress presets preserve the shipment limits and reference route", () => {
  const settings = {
    ...DEFAULTS,
    budget: 24000,
    baseline: "rail",
    priority: "carbon",
  };
  const stressed = applyStressPreset(settings, "combined");
  assert.equal(stressed.fuel, 15);
  assert.equal(stressed.delay, 7);
  assert.equal(stressed.budget, 24000);
  assert.equal(stressed.baseline, "rail");
  assert.equal(stressed.priority, "carbon");
  assert.equal(settings.fuel, 0);
});
test("a port delay makes the baseline recommendation ineligible and rail remains viable", () => {
  const routes = rankRoutes(applyStressPreset(DEFAULTS, "delay"));
  assert.equal(routes[0].id, "rail");
  assert.equal(routes[0].feasible, true);
  assert.ok(
    routes.find((r) => r.id === "suez").failures.includes("Late arrival"),
  );
});
test("a pinned reference changes deltas, not eligibility or ranking", () => {
  const pinned = { ...DEFAULTS, baseline: "rail" };
  assert.equal(referenceRoute(pinned).cost, 21860);
  assert.deepEqual(
    rankRoutes(pinned).map((r) => r.id),
    rankRoutes(DEFAULTS).map((r) => r.id),
  );
});
test("a saved scenario retains its baseline when the workspace changes", () => {
  const settings = { ...DEFAULTS, baseline: "rail" };
  const saved = snapshotDecision(
    "suez",
    settings,
    "This option balances budget and the delivery window.",
  );
  settings.baseline = "air";
  assert.equal(saved.settings.baseline, "rail");
});
test("older preferences without a baseline and invalid references migrate safely", () => {
  assert.equal(
    validateSettings({ budget: 22000, selected: "suez" }).baseline,
    "cape",
  );
  assert.equal(
    validateSettings({ ...DEFAULTS, baseline: "unknown" }).baseline,
    "cape",
  );
});
