import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RAIL_PARTS,CASPIAN_FERRY,RAIL_POINTS,AMS_ROAD,DUBAI_ROAD,OBSERVED_KL896} from '../dist/network-tracks.mjs';
import {ROUTES} from '../dist/model.mjs';
import {roundedRoutePath} from '../dist/route-geometry.mjs';
import {routeMap} from '../dist/route-map.mjs';
const asset=name=>JSON.parse(readFileSync(new URL('../dist/assets/tracks/'+name,import.meta.url),'utf8'));
const km=(a,b)=>{const r=x=>x*Math.PI/180,dlat=r(b[1]-a[1]),dlon=r(b[0]-a[0]);return 6371*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(r(a[1]))*Math.cos(r(b[1]))*Math.sin(dlon/2)**2));};
test('rail geometry joins exact network endpoints and reserves only the Caspian gap',()=>{
 const f=asset('rail.geojson').features;let gaps=[];
 for(let i=1;i<f.length;i++){const a=f[i-1].geometry.coordinates.at(-1),b=f[i].geometry.coordinates[0];if(km(a,b)>.001)gaps.push([a,b]);}
 assert.deepEqual(gaps,[CASPIAN_FERRY]);assert.equal(RAIL_PARTS.length,2);assert.ok(km(...CASPIAN_FERRY)>380&&km(...CASPIAN_FERRY)<410);
 assert.deepEqual(RAIL_POINTS[0],f[0].geometry.coordinates[0]);assert.deepEqual(RAIL_POINTS.at(-1),f.at(-1).geometry.coordinates.at(-1));
 assert.ok(!f.some(x=>/Aktau/.test(x.properties.name)));
});
test('road display retains returned snapped endpoints and realistic road lengths',()=>{
 for(const [file,points,range] of [['ams_rsc.json',AMS_ROAD,[68000,71000]],['jebel_dwc.json',DUBAI_ROAD,[27000,30000]]]){
 const raw=asset(file),route=raw.routes[0];assert.equal(raw.code,'Ok');assert.ok(route.distance>range[0]&&route.distance<range[1]);assert.deepEqual(points[0],route.geometry.coordinates[0]);assert.deepEqual(points.at(-1),route.geometry.coordinates.at(-1));
 for(const p of route.geometry.coordinates){
  const deviation=Math.min(...points.slice(1).map((b,i)=>{const a=points[i],dx=b[0]-a[0],dy=b[1]-a[1],n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/n)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}));
  assert.ok(deviation<=.00003001,'Display must stay within simplification tolerance of returned roads');
 }
 }
});
test('rail and road-derived routes never acquire Bezier shortcuts',()=>{
 for(const id of ['rail','air','seaair'])assert.ok(!roundedRoutePath(ROUTES.find(r=>r.id===id)).includes('Q'));
});
test('recorded flight keeps coverage gaps separate and is opt-in',()=>{
 const raw=asset('kl896-2026-11-04.json');assert.equal(raw.registration,'PH-BKG');assert.equal(raw.date,'2026-11-04');assert.equal(raw.segments.length,8);assert.equal(raw.segments.flat().length,2901);assert.equal(OBSERVED_KL896.length,8);
 for(const seg of raw.segments)for(let i=1;i<seg.length;i++)assert.ok(seg[i].timestamp-seg[i-1].timestamp<=60);
 const r=ROUTES.find(r=>r.id==='air'),off=routeMap(r,'cape'),on=routeMap(r,'cape',{showRecorded:true});assert.ok(!off.includes('class="observed-flight"'));assert.equal((on.match(/class="observed-flight"/g)||[]).length,8);
 assert.ok(on.includes('class="flight-connection"'));assert.ok(on.includes('class="access-connector"'));
});
