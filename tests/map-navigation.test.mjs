import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapNavigation } from '../dist/map-navigation.mjs';

test('transfer from the touched SVG child keeps both drag and pinch active', t => {
  const listeners = new Map();
  const setGlobal = (name, value) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    });
  };
  setGlobal('document', {
    addEventListener: (type, listener) => listeners.set(type, listener),
    querySelectorAll: () => [],
  });
  setGlobal('window', { matchMedia: () => ({ matches: true }), addEventListener() {} });
  setGlobal('ResizeObserver', class { observe() {} });
  setGlobal('DOMPoint', class {
    constructor(x, y) { this.x = x; this.y = y; }
    matrixTransform() { return this; }
  });
  setGlobal('requestAnimationFrame', () => 1);
  setGlobal('cancelAnimationFrame', () => {});

  const child = {}, capture = new Set();
  const map = {
    isConnected: true,
    contains: target => target === map || target === child,
    querySelector: () => null,
    closest: () => null,
    getBoundingClientRect: () => ({ width: 0, height: 0 }),
    getScreenCTM: () => ({ inverse: () => ({}) }),
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    hasPointerCapture: id => capture.has(id),
    setPointerCapture: id => capture.add(id),
    releasePointerCapture: id => capture.delete(id),
  };
  const send = (type, pointerId, clientX, target = child) => {
    listeners.get(type)({
      target, pointerId, clientX, clientY: 300, button: 0,
      pointerType: 'touch', preventDefault() {},
    });
  };

  const navigation = createMapNavigation(() => map);
  navigation.sync();
  send('pointerdown', 1, 400);
  send('pointerdown', 2, 600);
  send('lostpointercapture', 1, 400);
  send('lostpointercapture', 2, 600);
  send('pointermove', 2, 800, map);
  send('pointerup', 2, 800, map);
  assert.equal(map.dataset.zoom, '2.000');
  send('lostpointercapture', 2, 800, map);

  send('pointermove', 1, 510, map);
  send('pointerup', 1, 510, map);
  assert.equal(navigation.transform(), 'translate(-290px, -300px) scale(2)');

  send('pointerdown', 3, 500);
  send('pointermove', 3, 530);
  send('lostpointercapture', 3, 530);
  send('pointermove', 3, 590, map);
  send('pointerup', 3, 590, map);
  assert.equal(navigation.transform(), 'translate(-200px, -300px) scale(2)');
});
