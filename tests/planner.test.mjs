import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,rankRoutes,ROUTES,validateSettings} from '../dist/model.mjs';
import {routeGroups,mapReference,nextTableSort,columnSortState} from '../dist/planner-model.mjs';
import {geometryId} from '../dist/route-geometry.mjs';
import {contextLabels} from '../dist/geographic-context.mjs';
test('planner groups account for all routes and distinguish eligibility from active selection',()=>{
 const groups=routeGroups(DEFAULTS);assert.deepEqual(groups.map(g=>g.routes.length),[2,4]);
 assert.equal(new Set(groups.flatMap(g=>g.routes.map(r=>r.id))).size,6);
 for(const g of groups)assert.ok(g.routes.every(r=>r.feasible===(g.id==='eligible')));
});
test('Fastest puts direct air first in the outside-limits group without promoting it as eligible',()=>{
 const groups=routeGroups({...DEFAULTS,priority:'time'});assert.equal(groups[0].routes[0].id,'rail');assert.equal(groups[1].routes[0].id,'air');
 for(const group of groups)assert.deepEqual(group.routes.map(r=>r.days),group.routes.map(r=>r.days).toSorted((a,b)=>a-b));
});
test('explicit priorities order by the named metric when every route is eligible',()=>{
 for(const [priority,metric] of [['cost','cost'],['time','days'],['carbon','co2']]){
  const routes=rankRoutes({...DEFAULTS,budget:200000,emissions:400,deadline:'2027-02-01',priority});
  assert.ok(routes.every(r=>r.feasible));assert.deepEqual(routes.map(r=>r[metric]),routes.map(r=>r[metric]).toSorted((a,b)=>a-b));
 }
});
test('a selected baseline still gets a distinct alternative on the map',()=>{
 const settings={...DEFAULTS,selected:'cape'},reference=mapReference(settings);assert.equal(reference.id,'suez');assert.equal(reference.label,'Best alternative');
 const shared=mapReference({...DEFAULTS,selected:'eco',baseline:'suez'});assert.notEqual(geometryId(ROUTES.find(r=>r.id===shared.id)),'suez');
});
test('impossible constraints retain an empty eligible group and all six failing routes',()=>{
 const groups=routeGroups({...DEFAULTS,budget:1,emissions:1,deadline:'2026-11-10'});assert.equal(groups[0].routes.length,0);assert.equal(groups[1].routes.length,6);
});
test('context labels stay bounded and avoid ports and each other across zoom levels',()=>{
 for(const scale of [1,2,3,6])for(const pixelScale of [.34,.72,1.1]){
  const labels=contextLabels({scale,x:1000*(1-scale)/2,y:610*(1-scale)/2},pixelScale,[{x:70,y:70,width:132,height:46}]);
  for(const a of labels){assert.ok(a.x>=0&&a.x+a.width<=1000*pixelScale);assert.ok(a.y>=0&&a.y+a.height<=610*pixelScale);for(const b of labels)if(a!==b)assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);}
 }
});

test('the first header click changes visible order and subsequent clicks reverse it',()=>{
 for(const key of ['cost','days','arrival','co2']){
  const before=routeGroups(DEFAULTS)[0].routes.map(r=>r.id);
  const first=nextTableSort(DEFAULTS,key), second=nextTableSort(first,key);
  assert.notDeepEqual(routeGroups(first)[0].routes.map(r=>r.id),before);
  assert.deepEqual(routeGroups(second)[0].routes.map(r=>r.id),before);
  assert.notEqual(first.order,second.order);
  assert.equal(columnSortState(first,key),first.order==='asc'?'ascending':'descending');
  assert.equal(columnSortState(first,'unselected'),'none');
 }
});
test('manual sorting survives scenario validation and stays ordered inside both groups',()=>{
 const sorted=nextTableSort(DEFAULTS,'cost');
 const changed=validateSettings({...sorted,portDelay:3});
 assert.equal(changed.sort,'cost');assert.equal(changed.order,sorted.order);
 for(const group of routeGroups(changed)){
  const costs=group.routes.map(r=>r.cost);
  assert.deepEqual(costs,[...costs].sort((a,b)=>sorted.order==='desc'?b-a:a-b));
 }
});
