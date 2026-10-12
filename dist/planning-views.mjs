import { DEPARTURE, dateLabel, dateAfter, money } from "./model.mjs";
import { timelineFor, comparisonFor } from "./planning.mjs";

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const dayDistance = (date) =>
  Math.round(
    (new Date(date + "T12:00:00Z") - new Date(DEPARTURE + "T12:00:00Z")) /
      86400000,
  );
const typeIcon = (mode) =>
  ({ ocean: "ship", rail: "train", multimodal: "mixed", air: "plane" })[mode];
const currencyDelta = (n) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n))}`;
const color = (kind) =>
  ({
    origin: "#9aaeb1",
    destination: "#6f8f9a",
    ocean: "#3f7181",
    rail: "#7182a0",
    multimodal: "#8b7897",
    air: "#a0788a",
    delay: "#a66b7c",
  })[kind] || "#3f7181";

export function statusPill(route, icon) {
  const label = route.feasible ? "Within limits" : route.failures[0];
  return `<span class="pill ${route.feasible ? "positive" : "warning"}"><span class="pill-icon">${icon(route.feasible ? "check" : "alert", 14)}</span><span class="pill-label">${escape(label)}</span></span>`;
}

export function arrivalComparison(items, settings) {
  const deadline = dayDistance(settings.deadline),
    cap =
      Math.ceil(Math.max(deadline, ...items.map((r) => r.days)) / 10) * 10 + 5;
  const x = (day) => 218 + (day / cap) * 690,
    height = 86 + items.length * 51;
  return `<svg class="arrival-comparison" viewBox="0 0 1000 ${height}" role="img" aria-label="All selected routes against the same delivery deadline"><g class="arrival-grid">${Array.from(
    { length: Math.floor(cap / 10) + 1 },
    (_, i) => i * 10,
  )
    .map(
      (day) =>
        `<path d="M${x(day)} 28V${height - 35}"/><text x="${x(day)}" y="${height - 12}" text-anchor="middle">${dateLabel(dateAfter(day))}</text>`,
    )
    .join(
      "",
    )}</g><path d="M${x(deadline)} 20V${height - 35}" class="journey-deadline"/><text x="${x(deadline)}" y="13" class="journey-deadline-label" text-anchor="middle">Deadline · ${dateLabel(settings.deadline)}</text>${items
    .map((route, index) => {
      const timeline = timelineFor(route.id, settings),
        y = 42 + index * 51;
      return `<text x="0" y="${y + 15}" class="arrival-route-label">${escape(route.short.replace("Via ", "").replace("the ", ""))}</text>${timeline.segments.map((segment) => `<rect x="${x(segment.startDay)}" y="${y}" width="${Math.max(2, x(segment.endDay) - x(segment.startDay) - 1.2)}" height="23" rx="3" fill="${color(segment.kind)}"/>`).join("")}<text x="${x(route.days) + 9}" y="${y + 16}" class="arrival-day-label">${route.days}d</text>`;
    })
    .join("")}</svg>`;
}

export function comparisonWorkbench(ids, settings, selectedId, icon) {
  const { items, reference } = comparisonFor(ids, settings),
    maxCost = Math.max(...items.map((r) => r.cost));
  const status = (route) => statusPill(route, icon);
  return `<div class="dialog-content workbench-content"><div class="workbench-context"><div><span class="overline">SHIPMENT SHP-2026-0842</span><strong>Shanghai → Rotterdam</strong><span>4 containers · 72 tonnes</span></div><span class="workbench-reference">${icon("pin", 13)} Baseline: ${escape(reference.short)}</span></div><p class="matrix-hint">Swipe horizontally to compare every column.</p><div class="comparison-table-scroll"><table class="comparison-table"><thead><tr><th scope="col"><span class="micro-label">${items.length} ROUTES</span><h3>See the whole<br>trade-off.</h3></th>${items.map((route) => `<th scope="col"><div class="comparison-route-title"><span class="mode-tile">${icon(typeIcon(route.mode), 20)}</span><span>${route.id === settings.baseline ? "PINNED BASELINE" : route.service.toUpperCase()}</span></div><h3>${escape(route.short)}</h3>${status(route)}</th>`).join("")}</tr></thead><tbody><tr class="matrix-cost-row"><th scope="row">Total logistics cost<small>Handling, insurance & contingency included</small></th>${items.map((route) => `<td><div class="matrix-amount">${money(route.cost)}${route.lowestCost ? '<span class="metric-best">Lowest cost</span>' : ""}</div><div class="cost-track"><i style="width:${(route.cost / maxCost) * 100}%"></i></div><small>${currencyDelta(route.costDelta)} vs. baseline</small></td>`).join("")}</tr><tr><th scope="row">Transit time<small>Calendar days</small></th>${items.map((route) => `<td><strong class="matrix-number">${route.days}<em>days</em></strong>${route.fastest ? '<span class="metric-best">Fastest</span>' : ""}</td>`).join("")}</tr><tr><th scope="row">Estimated arrival<small>Deadline ${dateLabel(settings.deadline)}</small></th>${items.map((route) => `<td><strong class="matrix-date ${route.buffer < 0 ? "caution" : ""}">${dateLabel(route.arrival)}</strong><small class="${route.buffer < 0 ? "caution" : "muted"}">${route.buffer === 0 ? "On the deadline" : route.buffer > 0 ? `${route.buffer}d before deadline` : `${-route.buffer}d after deadline`}</small></td>`).join("")}</tr><tr><th scope="row">Transport emissions<small>Illustrative estimate & range</small></th>${items.map((route) => `<td><strong class="matrix-number">${route.co2.toFixed(1)}<em>t CO₂e</em></strong><small>±${route.uncertainty}% ${route.lowestCarbon ? '<span class="metric-best">Lowest footprint</span>' : ""}</small></td>`).join("")}</tr></tbody><tfoot><tr><th><span class="matrix-footnote">Lowest cost does not imply that a route meets your limits.</span></th>${items.map((route) => `<td><button class="button ${route.id === selectedId ? "primary" : "outline"} full" data-action="choose-compared" data-value="${route.id}">${route.id === selectedId ? "Selected route" : "Choose route"} ${icon("arrow", 14)}</button><button class="pin-comparison" data-action="compare-pin" data-value="${route.id}" aria-pressed="${route.id === settings.baseline}">${icon("pin", 12)} ${route.id === settings.baseline ? "Pinned baseline" : "Use as baseline"}</button></td>`).join("")}</tr></tfoot></table></div><section class="arrival-panel"><div><h3>Arrival window</h3><p>Same departure. Same deadline. Different handovers.</p></div>${arrivalComparison(items, settings)}<div class="arrival-legend"><span><i></i> Planned stage</span><span><i class="delay-key"></i> Added delay</span><span><i class="deadline-key"></i> Delivery deadline</span></div></section></div><footer class="dialog-footer workbench-footer"><span>Illustrative planning comparison · No booking or carrier confirmation.</span><div><button class="button outline" data-action="export-selected">${icon("download", 14)} Export comparison</button><button class="button quiet" data-action="close">Back to planner</button></div></footer>`;
}

export function chartTooltip(route, icon) {
  return `<div class="tooltip-heading"><span class="mode-tile">${icon(typeIcon(route.mode), 16)}</span><strong>${escape(route.short)}</strong></div><div class="tooltip-stats"><span><small>Cost</small><b>${money(route.cost)}</b></span><span><small>Transit</small><b>${route.days}d</b></span><span><small>CO₂e</small><b>${route.co2.toFixed(1)} t</b><em>±${route.uncertainty}%</em></span></div><p class="${route.feasible ? "good" : "caution"}">${icon(route.feasible ? "check" : "alert", 12)} ${route.feasible ? "Within all planning limits" : route.failures.join(" · ")}</p>`;
}
