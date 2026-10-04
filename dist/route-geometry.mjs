import {MARITIME_DATA} from "./maritime-data.mjs";
import { ROUTES } from "./model.mjs";

export function projectPoint([longitude, latitude]) {
  return [((longitude + 25) / 170) * 1000, ((70 - latitude) / 115) * 610];
}
export function geometryId(route) {
  return route.samePath || route.id;
}
export function routePoints(route) {
  const source = route.points
    ? route
    : ROUTES.find((item) => item.id === route.samePath);
  if (!source?.points) throw new Error("Route geometry is unavailable.");
  return source.points.map(projectPoint);
}
export function routeRelation(route, baseline) {
  return route.id === baseline.id
    ? "same-route"
    : geometryId(route) === geometryId(baseline)
      ? "shared-path"
      : "distinct";
}

const stops = [
  [103.8, 1.3],
  [32.5, 30],
  [19, -36],
  [51.2, 43.6],
  [29, 41],
  [55.3, 25.2],
  [4.8, 52.3],
].map(projectPoint);
const coordinate = (point) => point.map((n) => Number(n.toFixed(4))).join(",");
const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// Ease only local bends. Named handovers remain exact, and the endpoints never move.
export function roundedRoutePath(route, radius = 4) {
  const points = routePoints(route);
  let path = `M${coordinate(points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1],
      point = points[i],
      after = points[i + 1];
    const incoming = distance(before, point),
      outgoing = distance(point, after);
    const longitude=point[0]/1000*170-25, latitude=70-point[1]/610*115;
    const narrowPassage=(longitude>98&&longitude<104.5&&latitude>.5&&latitude<7)||(longitude>32&&longitude<34.5&&latitude>27&&latitude<31.5)||(longitude>-6.5&&longitude<-4.5&&latitude>35.5&&latitude<36.5)||(longitude>53&&longitude<58&&latitude>24&&latitude<27);
    const coastal=MARITIME_DATA[geometryId(route)]?.protected.includes(i);
    const protectedStop = coastal || narrowPassage || stops.some((stop) => distance(stop, point) < 0.01);
    const cut = route.mode==='rail'||route.mode==='air'||route.mode==='multimodal'?0:protectedStop
      ? 0
      : Math.min(Math.max(0, radius), incoming * 0.3, outgoing * 0.3);
    if (cut < 0.01 || incoming === 0 || outgoing === 0) {
      path += `L${coordinate(point)}`;
      continue;
    }
    const entry = [
      point[0] + ((before[0] - point[0]) * cut) / incoming,
      point[1] + ((before[1] - point[1]) * cut) / incoming,
    ];
    const exit = [
      point[0] + ((after[0] - point[0]) * cut) / outgoing,
      point[1] + ((after[1] - point[1]) * cut) / outgoing,
    ];
    path += `L${coordinate(entry)}Q${coordinate(point)} ${coordinate(exit)}`;
  }
  return path + `L${coordinate(points.at(-1))}`;
}

export function routeDirections(route) {
  const points = routePoints(route),
    lengths = points.slice(1).map((p, i) => distance(points[i], p));
  const total = lengths.reduce((a, b) => a + b, 0);
  return [0.24, 0.52, 0.78].map((fraction) => {
    const wanted = total * fraction;
    let passed = 0;
    for (let i = 0; i < lengths.length; i++) {
      if (passed + lengths[i] >= wanted && lengths[i] > 0) {
        const t = (wanted - passed) / lengths[i],
          a = points[i],
          b = points[i + 1];
        return {
          x: a[0] + (b[0] - a[0]) * t,
          y: a[1] + (b[1] - a[1]) * t,
          angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
        };
      }
      passed += lengths[i];
    }
    return { x: points.at(-1)[0], y: points.at(-1)[1], angle: 0 };
  });
}
