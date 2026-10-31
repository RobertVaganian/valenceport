import test from "node:test";
import assert from "node:assert/strict";
import { ROUTES } from "../dist/model.mjs";
import {
  roundedRoutePath,routePoints,
  projectPoint,
  routeRelation,
  routeDirections,
} from "../dist/route-geometry.mjs";
import {routeLocations} from "../dist/map-layout.mjs";
import { routeMap } from "../dist/route-map.mjs";

test("every schematic path preserves shipment endpoints without changing source coordinates", () => {
  const original = JSON.stringify(ROUTES);
  for (const route of ROUTES) {
    const path = roundedRoutePath(route);
    const points=routePoints(route),coord=p=>p.map(n=>Number(n.toFixed(4))).join(",");
    assert.ok(path.startsWith("M"+coord(points[0])));
    assert.ok(path.endsWith("L"+coord(points.at(-1))));
    assert.ok(!/NaN|Infinity/.test(path));
  }
  assert.equal(JSON.stringify(ROUTES), original);
});
test("named Suez and Singapore handovers remain on the route", () => {
  const path = roundedRoutePath(ROUTES.find((r) => r.id === "suez"));
  for (const point of routeLocations(ROUTES[0]).filter(p=>["Singapore","Suez Canal"].includes(p.name)).map(p=>p.point))
    assert.ok(
      path.includes(
        "L" +
          point
            .map((n) => Number(n.toFixed(4)))
            .join(","),
      ),
    );
});
test("same service and shared geography are distinct comparison states", () => {
  const suez = ROUTES.find((r) => r.id === "suez"),
    eco = ROUTES.find((r) => r.id === "eco"),
    cape = ROUTES.find((r) => r.id === "cape");
  assert.equal(routeRelation(suez, suez), "same-route");
  assert.equal(routeRelation(suez, eco), "shared-path");
  assert.equal(routeRelation(suez, cape), "distinct");
  assert.equal(roundedRoutePath(suez), roundedRoutePath(eco));
});
test("direction marks stay inside the map with finite bearings", () => {
  for (const route of ROUTES)
    for (const mark of routeDirections(route)) {
      assert.ok(mark.x >= 0 && mark.x <= 1000 && mark.y >= 0 && mark.y <= 610);
      assert.ok(Number.isFinite(mark.angle));
    }
});
test("case-study maps remain static and duplicate baseline paths are not drawn", () => {
  const suez = ROUTES.find((r) => r.id === "suez");
  const example = routeMap(suez, "cape", { interactive: false });
  assert.ok(!example.includes("tabindex"));
  assert.ok(!example.includes("data-action"));
  assert.ok(example.includes("baseline-path"));
  const shared = routeMap(suez, "eco", { interactive: false });
  assert.ok(!shared.includes('class="baseline-path"'));
  assert.ok(shared.includes("baseline service shares this path"));
});
