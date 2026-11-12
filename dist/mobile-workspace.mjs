import { money, dateLabel, rankRoutes, referenceRoute } from './model.mjs';
import { routeGroups } from './planner-model.mjs';
import { comparisonFor } from './planning.mjs';
import { statusPill } from './planning-views.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modeIcon = mode => ({ocean:'ship', rail:'train', multimodal:'mixed', air:'plane'})[mode];
const difference = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${money(Math.abs(value))}`;
const buffer = route => route.buffer < 0 ? `${-route.buffer} days late` : route.buffer === 0 ? 'On deadline' : `${route.buffer} days to spare`;

export function mapFocusSummary(route, icon) {
  return `<section class="map-focus-summary" aria-label="Selected route summary"><span class="overline">SELECTED ROUTE</span><h2>${escape(route.short)}</h2><div class="map-focus-metrics"><div><span>Logistics cost</span><strong>${money(route.cost)}</strong></div><div><span>Estimated arrival</span><strong>${dateLabel(route.arrival)}</strong></div></div><p>${icon('clock',15)} ${route.days} days <span>·</span> ${route.co2.toFixed(1)} t CO₂e</p><div class="map-focus-status">${statusPill(route,icon)}<small class="${route.buffer<0?'caution':''}">${buffer(route)}</small></div><button class="button outline" data-action="map-wide">Back to planner ${icon('arrow',16)}</button></section>`;
}

// The compact view uses the same ranked groups and comparison state as the table.
export function routeCards(settings, compare, icon) {
  const best = rankRoutes(settings).find(route => route.feasible);
  const baseline = referenceRoute(settings);
  return `<div class="route-cards">${routeGroups(settings).map(group => `
    <section class="route-card-group" aria-labelledby="group-${group.id}">
      <header class="route-card-group-heading" id="group-${group.id}" tabindex="-1">
        <span class="group-indicator ${group.id}" aria-hidden="true"></span>
        <h3>${group.label}</h3><span class="count">${group.routes.length}</span>
      </header>
      ${group.routes.length ? group.routes.map(route => `
        <article class="route-card ${route.id === settings.selected ? 'is-selected' : ''}" data-route-card="${route.id}">
          <button class="route-card-select" data-action="select" data-value="${route.id}" data-focus="route-${route.id}" aria-label="Inspect ${escape(route.name)}" ${route.id === settings.selected ? 'aria-current="true"' : ''}>
            <span class="table-mode">${icon(modeIcon(route.mode), 21)}</span>
            <span class="route-card-title"><strong>${escape(route.name)}</strong><small>${escape(route.service)}${route.id === best?.id ? '<span class="best-fit">Recommended</span>' : ''}</small></span>
            ${route.id === settings.selected ? '<span class="route-card-selected">Selected</span>' : icon('arrow', 16)}
          </button>
          <div class="route-card-metrics">
            <div><span>Logistics cost</span><strong>${money(route.cost)}</strong><small>${route.id === settings.baseline ? 'Baseline' : `${difference(route.cost - baseline.cost)} vs base`}</small></div>
            <div><span>Arrival</span><strong>${dateLabel(route.arrival)}</strong><small class="${route.buffer < 0 ? 'caution' : ''}">${buffer(route)}</small></div>
          </div>
          <div class="route-card-facts"><span>${icon('clock', 15)} ${route.days} days</span><span>${icon('leaf', 15)} ${route.co2.toFixed(1)} t CO₂e <small>±${route.uncertainty}%</small></span></div>
          <div class="route-card-status">${statusPill(route, icon)}${route.id === 'seaair' ? '<button class="text-button" data-action="corridor-advisory">Hormuz notice</button>' : ''}${route.id === settings.selected ? '<button class="text-button" data-action="planner-jump" data-value="overview">View route ↑</button>' : ''}</div>
          <footer class="route-card-actions">
            <label class="route-compare-toggle"><input type="checkbox" data-compare="${route.id}" data-focus="compare-${route.id}" aria-label="Add ${escape(route.name)} to comparison" ${compare.has(route.id) ? 'checked' : ''}><span>Compare</span></label>
            <button class="route-card-baseline" data-action="pin-baseline" data-value="${route.id}" data-focus="pin-${route.id}" aria-label="Use ${escape(route.name)} as baseline" aria-pressed="${route.id === settings.baseline}">${icon('pin', 15)} ${route.id === settings.baseline ? 'Baseline' : 'Set baseline'}</button>
          </footer>
        </article>`).join('') : '<div class="route-card-empty">No routes meet all three limits.<button class="text-button" data-action="constraints">Review planning limits</button></div>'}
    </section>`).join('')}</div>`;
}

export function compactComparison(ids, settings, selectedId, icon) {
  const {items, reference} = comparisonFor(ids, settings);
  return `<div class="dialog-content compact-comparison">
    <p class="compact-comparison-context">Shanghai → Rotterdam <span>Same shipment. Same assumptions.</span></p>
    <p class="compact-comparison-reference">${icon('pin', 15)} Baseline: ${escape(reference.short)}</p>
    <div class="compact-comparison-list">${items.map(route => `<article class="compact-comparison-card">
      <header><span class="table-mode">${icon(modeIcon(route.mode), 20)}</span><div><h3>${escape(route.short)}</h3><small>${escape(route.service)}</small></div>${statusPill(route, icon)}</header>
      <dl><div><dt>Logistics cost</dt><dd>${money(route.cost)}<small>${difference(route.costDelta)} vs base${route.lowestCost ? ' · Lowest cost' : ''}</small></dd></div><div><dt>Arrival</dt><dd>${dateLabel(route.arrival)}<small class="${route.buffer < 0 ? 'caution' : ''}">${buffer(route)}</small></dd></div><div><dt>Transit</dt><dd>${route.days} <em>days</em>${route.fastest ? '<small>Fastest</small>' : ''}</dd></div><div><dt>Emissions</dt><dd>${route.co2.toFixed(1)} <em>t CO₂e</em><small>±${route.uncertainty}%${route.lowestCarbon ? ' · Lowest emissions' : ''}</small></dd></div></dl>
      <footer><button class="button ${route.id === selectedId ? 'primary' : 'outline'}" data-action="choose-compared" data-value="${route.id}">${route.id === selectedId ? 'Selected route' : 'Choose route'} ${icon('arrow', 15)}</button><button class="route-card-baseline" data-action="compare-pin" data-value="${route.id}" aria-pressed="${route.id === settings.baseline}">${icon('pin', 15)} ${route.id === settings.baseline ? 'Baseline' : 'Set baseline'}</button></footer>
    </article>`).join('')}</div></div>
    <footer class="dialog-footer compact-comparison-footer"><button class="button outline" data-action="export-selected">${icon('download', 16)} Export comparison</button><button class="button quiet" data-action="close">Back to planner</button></footer>`;
}
