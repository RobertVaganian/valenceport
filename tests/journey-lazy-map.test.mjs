import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyPreview } from '../dist/journey-preview.mjs';
import { DEFAULTS } from '../dist/model.mjs';

test('a hidden journey player never samples the SVG path while the map is being used', () => {
  let samples = 0;
  const previous = { document: globalThis.document, matchMedia: globalThis.matchMedia, cancelAnimationFrame: globalThis.cancelAnimationFrame };
  globalThis.cancelAnimationFrame = () => {};
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
  globalThis.document = {
    querySelector(selector) {
      if (selector === '.map-stage > .route-map') return { querySelector() { return { getTotalLength() { samples++; throw new Error('Unnecessary route sampling'); } }; } };
      return null;
    },
  };
  try {
    const preview = createJourneyPreview(() => DEFAULTS, () => '');
    preview.sync(); preview.sync();
    assert.equal(samples, 0);
  } finally {
    for (const [key, value] of Object.entries(previous)) value === undefined ? delete globalThis[key] : globalThis[key] = value;
  }
});
