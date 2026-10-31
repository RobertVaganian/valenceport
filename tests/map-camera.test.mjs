import test from "node:test";
import assert from "node:assert/strict";
import {
  FIT_CAMERA,
  zoomAt,
  constrainCamera,
  wheelScale,
} from "../dist/map-camera.mjs";

test("zoom keeps the geographic coordinate under the pointer stable", () => {
  const before = { scale: 1.2, x: -75, y: -40 },
    pointer = { x: 680, y: 340 },
    after = zoomAt(before, 2.4, pointer);
  assert.equal(
    (pointer.x - before.x) / before.scale,
    (pointer.x - after.x) / after.scale,
  );
  assert.equal(
    (pointer.y - before.y) / before.scale,
    (pointer.y - after.y) / after.scale,
  );
});
test("a full zoom-out restores the whole map without empty edges", () => {
  assert.deepEqual(
    zoomAt({ scale: 3, x: -980, y: -600 }, 0.5, { x: 820, y: 20 }),
    FIT_CAMERA,
  );
  assert.deepEqual(constrainCamera({ scale: 2, x: 400, y: -900 }), {
    scale: 2,
    x: 0,
    y: -610,
  });
});
test("wheel zoom accepts pixel, line and page deltas and obeys limits", () => {
  assert.equal(wheelScale(1.5, 16, 0), wheelScale(1.5, 1, 1));
  assert.ok(wheelScale(2, -3) > 2);
  assert.ok(wheelScale(2, 1, 2) < 2);
  assert.equal(wheelScale(1, 1000), 1);
  assert.equal(wheelScale(6, -1000), 6);
});
