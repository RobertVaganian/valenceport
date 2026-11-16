import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapGesture, createFrameBatch } from '../dist/map-gesture.mjs';
import { FIT_CAMERA } from '../dist/map-camera.mjs';

const camera = { scale: 2, x: -500, y: -250 };
test('one finger pans a zoomed map and respects geographic bounds', () => {
  const gesture = createMapGesture();
  gesture.begin(1, { x: 300, y: 200 }, camera);
  assert.deepEqual(gesture.update(1, { x: 400, y: 250 }), { scale: 2, x: -400, y: -200 });
  assert.deepEqual(gesture.update(1, { x: 9999, y: -9999 }), { scale: 2, x: 0, y: -610 });
});
test('a tap stays a tap while a completed drag is identified for click suppression', () => {
  const gesture = createMapGesture();
  gesture.begin(1, { x: 100, y: 100 }, camera);
  assert.equal(gesture.update(1, { x: 102, y: 101 }), null);
  assert.equal(gesture.end(1, camera).moved, false);
  gesture.begin(2, { x: 100, y: 100 }, camera);
  const next = gesture.update(2, { x: 150, y: 140 });
  assert.equal(gesture.end(2, next).moved, true);
});
test('pinch follows both the changing distance and the midpoint', () => {
  const gesture = createMapGesture();
  gesture.begin(1, { x: 300, y: 200 }, camera);
  gesture.begin(2, { x: 500, y: 200 }, camera);
  const next = gesture.update(1, { x: 200, y: 200 });
  assert.equal(next.scale, 3);
  assert.equal((350 - next.x) / next.scale, (400 - camera.x) / camera.scale);
  assert.equal((200 - next.y) / next.scale, (200 - camera.y) / camera.scale);
});
test('a pinch can start at fit without requiring an expanded map', () => {
  const gesture = createMapGesture();
  gesture.begin(1, { x: 400, y: 300 }, FIT_CAMERA);
  gesture.begin(2, { x: 600, y: 300 }, FIT_CAMERA);
  assert.equal(gesture.update(2, { x: 800, y: 300 }).scale, 2);
});
test('lifting one finger after a pinch continues a pan without a camera jump', () => {
  const gesture = createMapGesture();
  gesture.begin(1, { x: 300, y: 200 }, camera);
  gesture.begin(2, { x: 500, y: 200 }, camera);
  const next = gesture.update(1, { x: 200, y: 200 });
  assert.deepEqual(gesture.end(1, next), { moved: true, remaining: [2] });
  assert.deepEqual(gesture.update(2, { x: 500, y: 200 }), next);
  assert.deepEqual(gesture.update(2, { x: 530, y: 220 }), { ...next, x: next.x + 30, y: next.y + 20 });
});
test('cancellation discards all old pointers, and a third finger cannot replace an anchor', () => {
  const gesture = createMapGesture();
  gesture.begin(1, { x: 300, y: 200 }, camera);
  gesture.begin(2, { x: 500, y: 200 }, camera);
  assert.equal(gesture.begin(3, { x: 600, y: 200 }, camera), false);
  assert.deepEqual(gesture.ids(), [1, 2]);
  gesture.clear();
  assert.equal(gesture.update(1, { x: 200, y: 200 }), null);
  assert.equal(gesture.end(2, camera), null);
  gesture.begin(4, { x: 300, y: 200 }, camera);
  assert.deepEqual(gesture.update(4, { x: 330, y: 200 }), { ...camera, x: -470 });
});
function frameHarness() {
  let id = 0;
  const pending = new Map(), painted = [];
  const batch = createFrameBatch(value => painted.push(value), fn => { pending.set(++id, fn); return id; }, key => pending.delete(key));
  return { batch, pending, painted, tick() { const jobs = [...pending.values()]; pending.clear(); jobs.forEach(fn => fn()); } };
}
test('a burst of pointer samples paints only its latest camera in one frame', () => {
  const h = frameHarness();
  for (let i = 0; i < 40; i++) h.batch.push({ x: i });
  assert.equal(h.pending.size, 1);
  assert.equal(h.painted.length, 0);
  h.tick();
  assert.deepEqual(h.painted, [{ x: 39 }]);
  assert.equal(h.pending.size, 0);
});
test('pointer release flushes its final sample and cancellation cannot repaint a removed map', () => {
  const h = frameHarness();
  h.batch.push(camera); h.batch.flush(); h.tick();
  assert.deepEqual(h.painted, [camera]);
  h.batch.push(FIT_CAMERA); h.batch.cancel(); h.tick();
  assert.deepEqual(h.painted, [camera]);
});

test('DOMPoint-style inherited coordinates survive gesture anchoring', () => {
  const gesture = createMapGesture();
  const point = Object.create({ x: 300, y: 200 });
  gesture.begin(1, point, camera);
  assert.deepEqual(gesture.update(1, Object.create({ x: 400, y: 250 })), { scale: 2, x: -400, y: -200 });
  assert.equal(gesture.update(1, { x: NaN, y: 250 }), null);
  assert.equal(gesture.begin(2, { x: Infinity, y: 200 }, camera), false);
});
