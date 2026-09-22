import {RAIL_POINTS} from './network-tracks.mjs';
import {ROAD_TO_ROTTERDAM,TERMINALS,greatCircle} from "./maritime-paths.mjs";
import { MARITIME_PATHS } from "./maritime-paths.mjs";

export const DEPARTURE = "2026-11-09";
export const DEFAULTS = Object.freeze({
  budget: 22000,
  deadline: "2026-12-14",
  emissions: 40,
  fuel: 0,
  delay: 0,
  priority: "balanced",
  mode: "all",
  query: "",
  sort: "score",
  order: "asc",
  selected: "suez",
  baseline: "cape",
});
export const ROUTES = Object.freeze([
  {
    id: "suez",
    name: "Ocean · Suez Canal",
    short: "Via Suez Canal",
    mode: "ocean",
    service: "Standard ocean",
    days: 31,
    co2: 24.8,
    uncertainty: 12,
    freight: 14400,
    origin: 720,
    destination: 1180,
    insurance: 280,
    reserve: 1840,
    quality: "Modelled",
    color: "#2d6957",
    legs: [
      ["Shanghai", "Origin handling", 2],
      ["Singapore", "Ocean transit", 8],
      ["Suez Canal", "Main ocean leg", 13],
      ["Rotterdam", "Arrival & handling", 8],
    ],
    note: "A shorter sea passage balances arrival time and freight cost. Canal access is assumed available in this scenario.",
    points: MARITIME_PATHS.suez,
  },
  {
    id: "cape",
    name: "Ocean · Cape of Good Hope",
    short: "Via Cape of Good Hope",
    mode: "ocean",
    service: "Current plan",
    days: 40,
    co2: 33.6,
    uncertainty: 12,
    freight: 12400,
    origin: 720,
    destination: 1180,
    insurance: 280,
    reserve: 2300,
    quality: "Modelled",
    color: "#ac8450",
    legs: [
      ["Shanghai", "Origin handling", 2],
      ["Singapore", "Ocean transit", 8],
      ["Cape of Good Hope", "Main ocean leg", 22],
      ["Rotterdam", "Arrival & handling", 8],
    ],
    note: "The baseline avoids the Suez Canal. Its longer passage exceeds the delivery deadline under the current assumptions.",
    points: MARITIME_PATHS.cape,
  },
  {
    id: "rail",
    name: "Rail · Middle Corridor",
    short: "Via the Middle Corridor",
    mode: "rail",
    service: "Rail + short-sea",
    days: 23,
    co2: 15.2,
    uncertainty: 22,
    freight: 16800,
    origin: 720,
    destination: 1540,
    insurance: 280,
    reserve: 2520,
    quality: "Estimated",
    color: "#657a92",
    legs: [
      ["Shanghai", "Inland rail", 5],
      ["Kuryk", "Rail & Caspian crossing", 8],
      ["Istanbul", "Baku–Tbilisi–Kars rail", 5],
      ["Rotterdam", "European rail & handling", 5],
    ],
    note: "Lower estimated emissions, with more handovers. The wider emissions range reflects limited carrier-specific data.",
    points: RAIL_POINTS,
  },
  {
    id: "eco",
    name: "Ocean · Slow steaming",
    short: "Reduced-speed Suez service",
    mode: "ocean",
    service: "Economy ocean",
    days: 39,
    co2: 20.6,
    uncertainty: 18,
    freight: 13200,
    origin: 720,
    destination: 1180,
    insurance: 280,
    reserve: 1860,
    quality: "Estimated",
    color: "#78895d",
    legs: [
      ["Shanghai", "Origin handling", 3],
      ["Singapore", "Ocean transit", 10],
      ["Suez Canal", "Reduced-speed passage", 18],
      ["Rotterdam", "Arrival & handling", 8],
    ],
    note: "A reduced-speed planning alternative. It lowers estimated transport emissions but arrives after the current deadline.",
    samePath: "suez",
  },
  {
    id: "seaair",
    name: "Sea–air · Dubai",
    short: "Ocean to Dubai, air to Europe",
    mode: "multimodal",
    service: "Sea + air",
    days: 18,
    co2: 86.4,
    uncertainty: 20,
    freight: 34600,
    origin: 920,
    destination: 1940,
    insurance: 440,
    reserve: 3220,
    quality: "Estimated",
    color: "#a2788a",
    legs: [
      ["Shanghai", "Origin handling", 2],
      ["Dubai", "Jebel Ali port & bonded transfer to DWC", 11],
      ["Amsterdam", "Air freight & customs", 3],
      ["Rotterdam", "Road & handling", 2],
    ],
    note: "A sea–air corridor via Jebel Ali, bonded transfer to DWC and Schiphol. Cargo is assumed repacked for air transport; ocean containers do not fly. Capacity and prices are illustrative.",
    points: MARITIME_PATHS.seaair,
  },
  {
    id: "air",
    name: "Air · Direct freight",
    short: "Shanghai to Amsterdam",
    mode: "air",
    service: "Priority air",
    days: 7,
    co2: 354.8,
    uncertainty: 15,
    freight: 69800,
    origin: 1280,
    destination: 2120,
    insurance: 620,
    reserve: 4980,
    quality: "Modelled",
    color: "#b47e62",
    legs: [
      ["Shanghai", "Origin handling", 2],
      ["Amsterdam", "Air freight & customs", 3],
      ["Rotterdam", "Road & handling", 2],
    ],
    note: "PVG–AMS airport connection with road delivery to Rotterdam. Cargo is assumed repacked into air-compatible units. The flight track and carrier capacity are not confirmed. It exceeds the current budget and emissions limit.",
    points:[...greatCircle(TERMINALS.pvg,TERMINALS.ams),...ROAD_TO_ROTTERDAM.slice(1)],
  },
]);
export function dateAfter(days) {
  const d = new Date(DEPARTURE + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function dateLabel(date, year = false) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}
export function money(n) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}
export function evaluate(route, settings = DEFAULTS) {
  const fuel = Number(settings.fuel) || 0,
    delay = Number(settings.delay) || 0;
  const surcharge = Math.round((route.freight * fuel) / 100);
  const cost =
    route.freight +
    surcharge +
    route.origin +
    route.destination +
    route.insurance +
    route.reserve;
  const days = route.days + (route.mode === "air" ? 0 : delay),
    arrival = dateAfter(days);
  const buffer = Math.round(
    (new Date(settings.deadline + "T12:00:00Z") -
      new Date(arrival + "T12:00:00Z")) /
      86400000,
  );
  const failures = [];
  if (cost > settings.budget) failures.push("Over budget");
  if (buffer < 0) failures.push("Late arrival");
  if (route.co2 > settings.emissions) failures.push("Above CO₂e limit");
  return {
    ...route,
    cost,
    surcharge,
    days,
    arrival,
    buffer,
    failures,
    feasible: !failures.length,
  };
}
export function rankRoutes(settings = DEFAULTS) {
  const all = ROUTES.map((r) => evaluate(r, settings));
  const weights = {
    balanced: [0.55, 0.3, 0.15],
    cost: [0.75, 0.15, 0.1],
    time: [0.15, 0.75, 0.1],
    carbon: [0.15, 0.15, 0.7],
  }[settings.priority] || [0.55, 0.3, 0.15];
  const axes = ["cost", "days", "co2"];
  const feasible = all.filter((r) => r.feasible);
  const pool = feasible.length ? feasible : all;
  const ranges = axes.map((a) => [
    Math.min(...pool.map((r) => r[a])),
    Math.max(...pool.map((r) => r[a])),
  ]);
  for (const r of all)
    r.score = axes.reduce(
      (sum, a, i) =>
        sum +
        (weights[i] * (r[a] - ranges[i][0])) /
          (ranges[i][1] - ranges[i][0] || 1),
      0,
    );
  const primary={cost:'cost',time:'days',carbon:'co2'}[settings.priority];
  return all.sort((a,b)=>Number(b.feasible)-Number(a.feasible)||(primary?a[primary]-b[primary]:0)||a.score-b.score);

}
export function visibleRoutes(settings = DEFAULTS) {
  const list = rankRoutes(settings).filter(
    (r) =>
      (settings.mode === "all" || r.mode === settings.mode) &&
      (!settings.query ||
        `${r.name} ${r.service}`
          .toLowerCase()
          .includes(settings.query.toLowerCase())),
  );
  if (settings.sort !== "score")
    list.sort(
      (a, b) =>
        (settings.order === "desc" ? -1 : 1) *
        (a[settings.sort] - b[settings.sort]),
    );
  return list;
}
export function validateSettings(value) {
  if (!value || typeof value !== "object") return { ...DEFAULTS };
  const n = (key, min, max) =>
    Number.isFinite(Number(value[key]))
      ? Math.min(max, Math.max(min, Number(value[key])))
      : DEFAULTS[key];
  const parsed =
    typeof value.deadline === "string"
      ? new Date(value.deadline + "T12:00:00Z")
      : null;
  const deadline =
    parsed &&
    !Number.isNaN(+parsed) &&
    parsed.toISOString().slice(0, 10) === value.deadline &&
    value.deadline >= "2026-11-10" &&
    value.deadline <= "2026-12-31"
      ? value.deadline
      : DEFAULTS.deadline;
  return {
    ...DEFAULTS,
    budget: n("budget", 15000, 100000),
    deadline,
    emissions: n("emissions", 10, 400),
    fuel: n("fuel", -20, 40),
    delay: Math.round(n("delay", 0, 14)),
    sort: ["score","cost","days","co2","arrival"].includes(value.sort)?value.sort:"score",
    order: value.order==="desc"?"desc":"asc",
    priority: ["balanced", "cost", "time", "carbon"].includes(value.priority)
      ? value.priority
      : "balanced",
    baseline: ROUTES.some((r) => r.id === value.baseline)
      ? value.baseline
      : "cape",
    selected: ROUTES.some((r) => r.id === value.selected)
      ? value.selected
      : "suez",
  };
}
export function snapshotDecision(
  routeId,
  settings,
  reason,
  now = new Date().toISOString(),
) {
  if (
    typeof reason !== "string" ||
    reason.trim().length < 12 ||
    reason.trim().length > 500
  )
    throw new Error("Add a reason between 12 and 500 characters.");
  const route = rankRoutes(settings).find((r) => r.id === routeId);
  if (!route) throw new Error("Choose an available route.");
  if (!route.feasible)
    throw new Error(
      "This route does not meet the current limits. Adjust the limits or choose another route.",
    );
  return {
    id: globalThis.crypto.randomUUID(),
    createdAt: now,
    routeId,
    routeName: route.name,
    cost: route.cost,
    days: route.days,
    co2: route.co2,
    arrival: route.arrival,
    reason: reason.trim(),
    settings: { ...settings },
    status: "Saved for review",
  };
}
export function validDecisions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (d) =>
        d &&
        typeof d.id === "string" &&
        ROUTES.some((r) => r.id === d.routeId) &&
        typeof d.routeName === "string" &&
        Number.isFinite(d.cost) &&
        d.cost > 0 &&
        Number.isFinite(d.co2) &&
        d.co2 > 0 &&
        Number.isFinite(d.days) &&
        d.days > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(d.arrival) &&
        !Number.isNaN(Date.parse(d.arrival)) &&
        typeof d.createdAt === "string" &&
        !Number.isNaN(Date.parse(d.createdAt)) &&
        d.settings &&
        typeof d.settings === "object" &&
        typeof d.reason === "string" &&
        d.reason.length >= 12 &&
        d.reason.length <= 500,
    )
    .slice(-50);
}

export const STRESS_PRESETS = Object.freeze([
  { id: "base", label: "Base case", fuel: 0, delay: 0 },
  { id: "fuel", label: "Fuel +15%", fuel: 15, delay: 0 },
  { id: "delay", label: "Port +7 days", fuel: 0, delay: 7 },
  { id: "combined", label: "Combined", fuel: 15, delay: 7 },
]);
export function applyStressPreset(settings, id) {
  const preset = STRESS_PRESETS.find((p) => p.id === id);
  if (!preset) return { ...settings };
  return { ...settings, fuel: preset.fuel, delay: preset.delay };
}
export function referenceRoute(settings) {
  return evaluate(
    ROUTES.find((r) => r.id === settings.baseline) ||
      ROUTES.find((r) => r.id === "cape"),
    settings,
  );
}
