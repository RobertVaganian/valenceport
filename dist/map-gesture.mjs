import { constrainCamera, pinchAt } from './map-camera.mjs';

// All points are in the SVG viewport, so a gesture survives page offsets and zoom.
export function createMapGesture(threshold = 8) {
  const pointers = new Map();
  let origin = null, moved = false;
  const anchor = camera => {
    const entries = [...pointers.values()];
    origin = entries.length === 2
      ? { camera: { ...camera }, midpoint: midpoint(...entries), distance: Math.max(1, distance(...entries)) }
      : entries.length ? { camera: { ...camera }, point: { ...entries[0] } } : null;
  };
  return {
    begin(id, point, camera) {
      if (pointers.has(id) || pointers.size === 2 || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return false;
      pointers.set(id, { x: point.x, y: point.y }); anchor(camera);
      if (pointers.size === 2) moved = true;
      return true;
    },
    update(id, point) {
      if (!pointers.has(id) || !origin || !Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return null;
      pointers.set(id, { x: point.x, y: point.y });
      const entries = [...pointers.values()];
      if (entries.length === 2) return pinchAt(origin.camera, origin.camera.scale * distance(...entries) / origin.distance, origin.midpoint, midpoint(...entries));
      const dx = point.x - origin.point.x, dy = point.y - origin.point.y;
      if (!moved && Math.hypot(dx, dy) < threshold) return null;
      moved = true;
      return constrainCamera({ ...origin.camera, x: origin.camera.x + dx, y: origin.camera.y + dy });
    },
    end(id, camera) {
      if (!pointers.has(id)) return null;
      pointers.delete(id);
      const result = { moved, remaining: [...pointers.keys()] };
      anchor(camera);
      if (!pointers.size) moved = false;
      return result;
    },
    clear() { pointers.clear(); origin = null; moved = false; },
    has: id => pointers.has(id),
    ids: () => [...pointers.keys()],
  };
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Pointer streams can outpace the screen. Paint only their latest camera once per frame.
export function createFrameBatch(paint, request = requestAnimationFrame, cancel = cancelAnimationFrame) {
  let frame = 0, latest;
  const flush = () => { if (frame) cancel(frame); frame = 0; if (latest !== undefined) { const value = latest; latest = undefined; paint(value); } };
  return {
    push(value) { latest = value; if (!frame) frame = request(() => { frame = 0; flush(); }); },
    flush,
    cancel() { if (frame) cancel(frame); frame = 0; latest = undefined; },
  };
}
