import { updateMapAnnotations, moveMapAnnotations } from './map-annotations.mjs?v=mobile-2';
import { FIT_CAMERA, constrainCamera, zoomAt, wheelScale, cameraTransform } from './map-camera.mjs';
import { createMapGesture, createFrameBatch } from './map-gesture.mjs?v=mobile-2';

export function createMapNavigation(getMap, getActiveLocation = () => null, onFit = () => {}) {
  let current = { ...FIT_CAMERA }, target = { ...FIT_CAMERA }, frame = 0;
  let observedMap = null, nodes = null, gestureMap = null, inverse = null, suppressClickUntil = 0;
  let wheelFrame = 0, wheelTime = 0;
  const gesture = createMapGesture();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const staticMaps = new Set();
  const batch = createFrameBatch(camera => { current = camera; paint(true); });
  const resizeObserver = new ResizeObserver(() => { cancelGesture(); sync(); });

  function bind(map) {
    if (observedMap !== map) {
      cancelGesture(); stop();
      if (observedMap) resizeObserver.unobserve(observedMap);
      observedMap = map;
      if (map) resizeObserver.observe(map);
    }
    if (!map) { nodes = null; return; }
    const stage = map.closest('.map-stage');
    nodes = { map, zoom: map.querySelector('.map-zoom'), output: stage?.querySelector('[data-map-scale]'),
      out: stage?.querySelector('[data-action="zoom-out"]'), into: stage?.querySelector('[data-action="zoom-in"]') };
  }
  function paint(moving = false) {
    if (!nodes?.map.isConnected) return;
    const { map, zoom, output, out, into } = nodes;
    zoom?.setAttribute('transform', `translate(${current.x} ${current.y}) scale(${current.scale})`);
    map.dataset.zoomed = String(current.scale > 1.01);
    map.dataset.zoom = current.scale.toFixed(3);
    map.classList.toggle('is-navigating', moving);
    if (moving) moveMapAnnotations(map, current);
    else updateMapAnnotations(map, current, getActiveLocation());
    const value = `${Math.round(current.scale * 100)}%`;
    if (output && output.textContent !== value) output.textContent = value;
    if (out) out.disabled = target.scale <= 1.001;
    if (into) into.disabled = target.scale >= 5.999;
  }
  function sync() {
    for (const map of staticMaps) if (!map.isConnected) { resizeObserver.unobserve(map); staticMaps.delete(map); }
    for (const map of document.querySelectorAll('.case-map > .route-map')) {
      if (!staticMaps.has(map)) { staticMaps.add(map); resizeObserver.observe(map); }
      updateMapAnnotations(map, FIT_CAMERA);
    }
    bind(getMap());
    if (observedMap) paint(gesture.ids().length > 0 || Boolean(wheelFrame || frame));
  }
  function stop() {
    cancelAnimationFrame(frame); frame = 0;
    cancelAnimationFrame(wheelFrame); wheelFrame = 0;
  }
  function move(next, animated = true, duration = 260) {
    stop(); batch.flush();
    target = constrainCamera(next);
    if (!animated || reduced.matches) { current = { ...target }; paint(); return; }
    const start = { ...current }, destination = { ...target }, began = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - began) / duration), eased = 1 - (1 - progress) ** 3;
      current = Object.fromEntries(['scale', 'x', 'y'].map(key => [key, start[key] + (destination[key] - start[key]) * eased]));
      if (progress < 1) { paint(true); frame = requestAnimationFrame(tick); }
      else { frame = 0; paint(); }
    }
    frame = requestAnimationFrame(tick);
  }
  function pointInMap(map, x, y) {
    const matrix = inverse || map.getScreenCTM()?.inverse();
    return matrix ? new DOMPoint(x, y).matrixTransform(matrix) : { x: 500, y: 305 };
  }
  function zoomBy(factor, point) { cancelGesture(); move(zoomAt(target, target.scale * factor, point)); }
  function fit() { cancelGesture(); onFit(); move(FIT_CAMERA, true, 300); }
  function focusAt(point) { cancelGesture(); const scale = Math.max(2.1, target.scale); move({ scale, x: 500 - point[0] * scale, y: 305 - point[1] * scale }, true, 320); }
  function wheelTick(now) {
    const dt = Math.min(48, Math.max(1, now - wheelTime)); wheelTime = now;
    const amount = 1 - Math.exp(-dt / 72);
    for (const key of ['scale', 'x', 'y']) current[key] += (target[key] - current[key]) * amount;
    const remaining = Math.abs(current.x - target.x) + Math.abs(current.y - target.y) + Math.abs(current.scale - target.scale) * 100;
    if (remaining < .035) { current = { ...target }; wheelFrame = 0; paint(); return; }
    paint(true); wheelFrame = requestAnimationFrame(wheelTick);
  }
  document.addEventListener('dblclick', event => {
    const map = getMap();
    if (!map?.contains(event.target) || event.target.closest('[data-action]') || event.ctrlKey || event.metaKey) return;
    event.preventDefault(); zoomBy(event.shiftKey ? 1 / 1.5 : 1.5, pointInMap(map, event.clientX, event.clientY));
  });
  document.addEventListener('wheel', event => {
    const map = getMap();
    if (!map?.contains(event.target) || event.ctrlKey || event.metaKey || !event.deltaY) return;
    const scale = wheelScale(target.scale, event.deltaY, event.deltaMode);
    if (Math.abs(scale - target.scale) < .0001) return;
    event.preventDefault(); cancelGesture(); cancelAnimationFrame(frame); frame = 0;
    target = zoomAt(target, scale, pointInMap(map, event.clientX, event.clientY));
    if (reduced.matches) { current = { ...target }; paint(); return; }
    if (!wheelFrame) { wheelTime = performance.now(); wheelFrame = requestAnimationFrame(wheelTick); }
  }, { passive: false });

  document.addEventListener('pointerdown', event => {
    const map = getMap();
    if (!map?.contains(event.target) || event.button !== 0 || (event.pointerType !== 'touch' && current.scale <= 1.01)) return;
    if (gestureMap && gestureMap !== map) return;
    batch.flush(); stop(); target = { ...current };
    if (!gestureMap) { gestureMap = map; inverse = map.getScreenCTM()?.inverse(); }
    if (!gesture.begin(event.pointerId, pointInMap(map, event.clientX, event.clientY), target)) return;
    if (gesture.ids().length === 2) {
      for (const id of gesture.ids()) map.setPointerCapture(id);
      map.classList.add('is-dragging'); event.preventDefault();
    }
  });
  document.addEventListener('pointermove', event => {
    if (!gestureMap?.isConnected || !gesture.has(event.pointerId)) return;
    const next = gesture.update(event.pointerId, pointInMap(gestureMap, event.clientX, event.clientY));
    if (!next) return;
    gestureMap.setPointerCapture(event.pointerId); gestureMap.classList.add('is-dragging');
    target = next; batch.push(next); event.preventDefault();
  }, { passive: false });
  function endGesture(event) {
    if (!gesture.has(event.pointerId)) return;
    batch.flush();
    const map = gestureMap, result = gesture.end(event.pointerId, target);
    if (map?.hasPointerCapture(event.pointerId)) map.releasePointerCapture(event.pointerId);
    if (result?.moved) suppressClickUntil = performance.now() + 250;
    if (!result?.remaining.length) {
      map?.classList.remove('is-dragging'); gestureMap = null; inverse = null; paint();
    }
  }
  function cancelGesture() {
    if (!gestureMap) return;
    batch.flush();
    const map = gestureMap, ids = gesture.ids();
    gesture.clear(); gestureMap = null; inverse = null;
    for (const id of ids) if (map.hasPointerCapture(id)) map.releasePointerCapture(id);
    map.classList.remove('is-dragging', 'is-navigating');
  }
  document.addEventListener('pointerup', endGesture);
  document.addEventListener('pointercancel', event => { if (gesture.has(event.pointerId)) { suppressClickUntil = performance.now() + 250; cancelGesture(); paint(); } });
  document.addEventListener('lostpointercapture', endGesture);
  window.addEventListener('blur', () => { cancelGesture(); stop(); target = { ...current }; paint(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelGesture(); stop(); target = { ...current }; } });
  document.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil && getMap()?.contains(event.target)) { event.stopImmediatePropagation(); event.preventDefault(); }
  }, true);
  document.addEventListener('keydown', event => {
    const map = getMap();
    if (!map?.contains(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
    if (['+', '=', '-', '0', 'Home'].includes(event.key)) map.focus({ preventScroll: true });
    if (event.key === '+' || event.key === '=') zoomBy(1.2);
    else if (event.key === '-') zoomBy(1 / 1.2);
    else if (event.key === '0' || event.key === 'Home') fit();
    else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && target.scale > 1) {
      map.focus({ preventScroll: true }); cancelGesture();
      const [x, y] = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] }[event.key];
      move({ ...target, x: target.x + x, y: target.y + y });
    } else return;
    event.preventDefault();
  });
  return { sync, zoomBy, fit, focusAt, transform: () => cameraTransform(current) };
}
