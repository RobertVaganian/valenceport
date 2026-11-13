export const MAP_BOUNDS = { width: 1000, height: 610, min: 1, max: 6 };
export const FIT_CAMERA = Object.freeze({ scale: 1, x: 0, y: 0 });

export function constrainCamera(camera) {
  const scale = Math.max(
    MAP_BOUNDS.min,
    Math.min(MAP_BOUNDS.max, camera.scale),
  );
  return {
    scale,
    x: Math.max(MAP_BOUNDS.width * (1 - scale), Math.min(0, camera.x)),
    y: Math.max(MAP_BOUNDS.height * (1 - scale), Math.min(0, camera.y)),
  };
}

// Preserve the geographic coordinate beneath the pointer while zooming.
export function zoomAt(camera, scale, point = { x: 500, y: 305 }) {
  const next = Math.max(MAP_BOUNDS.min, Math.min(MAP_BOUNDS.max, scale));
  const ratio = next / camera.scale;
  return constrainCamera({
    scale: next,
    x: point.x - (point.x - camera.x) * ratio,
    y: point.y - (point.y - camera.y) * ratio,
  });
}

export function wheelScale(scale, delta, mode = 0) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? 610 : 1);
  return Math.max(
    1,
    Math.min(
      MAP_BOUNDS.max,
      scale * Math.exp(-Math.max(-80, Math.min(80, pixels)) * 0.0014),
    ),
  );
}
export function cameraTransform(camera) {
  return `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
}

// Follow both the distance and midpoint of a two-finger gesture.
export function pinchAt(camera, scale, start, midpoint) {
  const next = Math.max(MAP_BOUNDS.min, Math.min(MAP_BOUNDS.max, scale));
  const ratio = next / camera.scale;
  return constrainCamera({
    scale: next,
    x: midpoint.x - (start.x - camera.x) * ratio,
    y: midpoint.y - (start.y - camera.y) * ratio,
  });
}
