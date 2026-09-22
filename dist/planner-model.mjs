import {ROUTES,rankRoutes} from './model.mjs';
import {geometryId} from './route-geometry.mjs';
export function routeGroups(settings) {
  const routes=rankRoutes(settings);
  if(settings.sort!=='score')routes.sort((a,b)=>(settings.order==='desc'?-1:1)*(a[settings.sort==='arrival'?'days':settings.sort]-b[settings.sort==='arrival'?'days':settings.sort]));
  return [{id:'eligible',label:'Within limits',routes:routes.filter(r=>r.feasible)},{id:'outside',label:'Outside limits',routes:routes.filter(r=>!r.feasible)}];
}
export function mapReference(settings) {
  const selected=ROUTES.find(r=>r.id===settings.selected),baseline=ROUTES.find(r=>r.id===settings.baseline);
  if(geometryId(selected)!==geometryId(baseline))return {id:baseline.id,label:'Baseline'};
  const alternative=rankRoutes(settings).find(r=>geometryId(r)!==geometryId(selected));
  return alternative?{id:alternative.id,label:alternative.feasible?'Best alternative':'Alternative'}:{id:baseline.id,label:'Baseline'};
}
export function priorityLabel(settings) {
  if(settings.sort!=='score')return {cost:'cost',days:'transit time',co2:'emissions',arrival:'arrival'}[settings.sort]+(settings.order==='desc'?' · High to low':' · Low to high');
  return {balanced:'balanced trade-off',cost:'lowest cost',time:'fastest arrival',carbon:'lowest emissions'}[settings.priority];
}

// Start by reversing the visible eligible group when it is already ascending.
// This avoids an apparently ignored first click in a six-row comparison.
export function nextTableSort(settings,key){
 const metric=key==='arrival'?'days':key;
 if(!['cost','days','co2','arrival'].includes(key))return settings;
 let order='asc';
 if(settings.sort===key)order=settings.order==='desc'?'asc':'desc';
 else{
  const groups=routeGroups(settings),shown=groups.find(g=>g.routes.length>1)?.routes||[];
  const ascending=shown.length>1&&shown.every((r,i)=>!i||shown[i-1][metric]<=r[metric]);
  const hasDifference=shown.some(r=>r[metric]!==shown[0]?.[metric]);
  if(ascending&&hasDifference)order='desc';
 }
 return {...settings,sort:key,order};
}
export function columnSortState(settings,key){
 return settings.sort===key?(settings.order==='desc'?'descending':'ascending'):'none';
}
