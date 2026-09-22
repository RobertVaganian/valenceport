import {ROUTES,evaluate,rankRoutes} from './model.mjs';

// Scenario impact compares a route with itself under the same planning limits.
// The pinned comparison route has no influence on this calculation.
export function scenarioImpact(settings) {
  const baseSettings={...settings,fuel:0,delay:0};
  const source=ROUTES.find(route=>route.id===settings.selected);
  const before=evaluate(source,baseSettings),after=evaluate(source,settings);
  const eligibleBefore=rankRoutes(baseSettings).filter(route=>route.feasible);
  const eligibleAfter=rankRoutes(settings).filter(route=>route.feasible);
  return {before,after,costChange:after.cost-before.cost,daysChange:after.days-before.days,
    eligibleBefore:eligibleBefore.length,eligibleAfter:eligibleAfter.length,
    best:eligibleAfter[0]||null,changed:settings.fuel!==0||settings.delay!==0,
  };
}
