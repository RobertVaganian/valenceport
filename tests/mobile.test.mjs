import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, ROUTES, evaluate, money, dateLabel } from '../dist/model.mjs';
import { routeGroups } from '../dist/planner-model.mjs';
import { routeCards, compactComparison } from '../dist/mobile-workspace.mjs';
import { pinchAt, FIT_CAMERA } from '../dist/map-camera.mjs';

const icon = () => '<svg aria-hidden="true"></svg>';
const cards = html => [...html.matchAll(/<article class="route-card [^"]*" data-route-card="([^"]+)">([\s\S]*?)<\/article>/g)];

test('compact routes preserve eligibility grouping and priority order under disrupted and impossible plans', () => {
  for (const changes of [{}, {delay:7, priority:'time'}, {budget:1, emissions:1}]) {
    const settings = {...DEFAULTS, ...changes};
    const ids = cards(routeCards(settings, new Set(), icon)).map(match => match[1]);
    assert.deepEqual(ids, routeGroups(settings).flatMap(group => group.routes.map(route => route.id)));
    assert.equal(new Set(ids).size, 6);
  }
});

test('mobile cards retain selected, compared and baseline roles independently as assumptions change', () => {
  const settings = {...DEFAULTS, selected:'suez', baseline:'eco', fuel:15, delay:7};
  const html = routeCards(settings, new Set(['suez','rail']), icon);
  assert.equal((html.match(/aria-current="true"/g) || []).length, 1);
  assert.equal((html.match(/ checked/g) || []).length, 2);
  for (const [,id,body] of cards(html)) {
    const route = evaluate(ROUTES.find(route => route.id === id), settings);
    assert.ok(body.includes(money(route.cost)), id);
    assert.ok(body.includes(dateLabel(route.arrival)), id);
    assert.ok(body.includes(`aria-pressed="${id === 'eco'}"`), id);
  }
});

test('compact comparison uses the same stressed route values and pinned reference as the planner', () => {
  const settings = {...DEFAULTS, baseline:'eco', fuel:20, delay:7};
  const original = structuredClone(settings);
  const html = compactComparison(['suez','rail'], settings, 'suez', icon);
  for (const id of ['suez','rail']) {
    const route = evaluate(ROUTES.find(route => route.id === id), settings);
    assert.ok(html.includes(money(route.cost)));
    assert.ok(html.includes(dateLabel(route.arrival)));
  }
  assert.ok(html.includes('3 days late'));
  assert.deepEqual(settings, original);
});

test('pinching preserves the geographic point between the two moving fingers', () => {
  const camera = {scale:2, x:-500, y:-300};
  const start = {x:450, y:280}, midpoint = {x:480, y:310};
  const next = pinchAt(camera, 3, start, midpoint);
  assert.equal((start.x-camera.x)/camera.scale, (midpoint.x-next.x)/next.scale);
  assert.equal((start.y-camera.y)/camera.scale, (midpoint.y-next.y)/next.scale);
});

test('a same-distance two-finger gesture pans without changing zoom', () => {
  assert.deepEqual(pinchAt({scale:2,x:-400,y:-250},2,{x:500,y:300},{x:530,y:280}), {scale:2,x:-370,y:-270});
});

test('pinch gestures respect map bounds and fully restore the fitted view', () => {
  assert.deepEqual(pinchAt({scale:4,x:-1500,y:-900},.1,{x:500,y:300},{x:900,y:500}),FIT_CAMERA);
  const edge = pinchAt(FIT_CAMERA, 20, {x:0,y:0}, {x:2000,y:-9000});
  assert.deepEqual(edge,{scale:6,x:0,y:-3050});
});
