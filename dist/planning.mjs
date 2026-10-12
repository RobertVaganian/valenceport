import {
  ROUTES,
  DEPARTURE,
  evaluate,
  dateAfter,
  referenceRoute,
} from "./model.mjs";

export function timelineFor(routeId, settings) {
  const source = ROUTES.find((r) => r.id === routeId);
  if (!source) throw new Error("Unknown route.");
  const route = evaluate(source, settings),
    segments = [];
  let cursor = 0;
  function add(place, task, days, kind) {
    const startDay = cursor;
    cursor += days;
    segments.push({
      id: segments.length,
      place,
      task,
      days,
      kind,
      startDay,
      endDay: cursor,
      startDate: dateAfter(startDay),
      endDate: dateAfter(cursor),
    });
  }
  source.legs.forEach(([place, task, days], index) => {
    if (
      index === source.legs.length - 1 &&
      route.mode !== "air" &&
      settings.delay > 0
    )
      add(
        "Additional port delay",
        "Stress-test assumption",
        settings.delay,
        "delay",
      );
    add(
      place,
      task,
      days,
      index === 0
        ? "origin"
        : index === source.legs.length - 1
          ? "destination"
          : route.mode,
    );
  });
  return {
    route,
    segments,
    totalDays: cursor,
    departure: DEPARTURE,
    arrival: dateAfter(cursor),
  };
}

export function comparisonFor(ids, settings) {
  const unique = [...new Set(ids)];
  if (unique.length < 2 || unique.length > 3)
    throw new Error("Choose two or three routes.");
  const items = unique.map((id) => {
    const route = ROUTES.find((r) => r.id === id);
    if (!route) throw new Error("Unknown route.");
    return evaluate(route, settings);
  });
  const minima = Object.fromEntries(
    ["cost", "days", "co2"].map((metric) => [
      metric,
      Math.min(...items.map((r) => r[metric])),
    ]),
  );
  const reference = referenceRoute(settings);
  return {
    items: items.map((r) => ({
      ...r,
      lowestCost: r.cost === minima.cost,
      fastest: r.days === minima.days,
      lowestCarbon: r.co2 === minima.co2,
      costDelta: r.cost - reference.cost,
    })),
    reference,
    minima,
  };
}

export function routeComparisonCsv(ids, settings) {
  const routes = [...new Set(ids)].map((id) => {
    const source = ROUTES.find((r) => r.id === id);
    if (!source) throw new Error("Unknown route.");
    return evaluate(source, settings);
  });
  const ref = referenceRoute(settings);
  const rows = [
    [
      "Route",
      "Logistics cost EUR",
      "Transit calendar days",
      "Arrival",
      "Transport emissions tCO2e",
      "Uncertainty percent",
      "Planning status",
      "Comparison baseline",
      "Cost difference EUR",
      "Transit difference days",
      "Fuel adjustment percent",
      "Port delay days",
      "Budget EUR",
      "Delivery deadline",
      "Emissions limit tCO2e",
    ],
    ...routes.map((r) => [
      r.name,
      r.cost,
      r.days,
      r.arrival,
      r.co2,
      r.uncertainty,
      r.feasible ? "Within limits" : r.failures.join("; "),
      ref.name,
      r.cost - ref.cost,
      r.days - ref.days,
      settings.fuel,
      settings.delay,
      settings.budget,
      settings.deadline,
      settings.emissions,
    ]),
  ];
  const cell = (value) => '"' + String(value).replaceAll('"', '""') + '"';
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
