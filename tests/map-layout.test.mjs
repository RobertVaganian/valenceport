import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUTES} from '../dist/model.mjs';
import {routeLocations,layoutMapLabels} from '../dist/map-layout.mjs';
import {constrainCamera,FIT_CAMERA} from '../dist/map-camera.mjs';
const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
test('route locations preserve the order and real endpoints of each scenario',()=>{
 for(const route of ROUTES){const places=routeLocations(route);assert.equal(places[0].name,'Shanghai');assert.equal(places.at(-1).name,'Rotterdam');assert.deepEqual(places.filter(p=>p.endpoint).map(p=>p.role),['Origin','Destination']);assert.ok(places.every(p=>p.point.every(Number.isFinite)));}
});
test('fitted endpoint labels stay inside the map and do not overlap at supported widths',()=>{
 for(const width of [300,320,360,600,765,1073])for(const route of ROUTES){const labels=layoutMapLabels(routeLocations(route),FIT_CAMERA,width/1000).filter(l=>l.visible);for(const label of labels){assert.ok(label.x>=0&&label.x+label.width<=width);assert.ok(label.y>=0&&label.y+label.height<=610*width/1000);}
 const endpoints=labels.filter(l=>l.endpoint);assert.equal(endpoints.length,2);assert.equal(overlap(...endpoints),0);}
});
test('label size stays constant while camera coordinates move with zoom',()=>{
 const route=ROUTES[0],locations=routeLocations(route),first=layoutMapLabels(locations,FIT_CAMERA,.765),camera=constrainCamera({scale:2.1,x:-900,y:-400}),second=layoutMapLabels(locations,camera,.765);
 for(const label of second){const before=first.find(p=>p.name===label.name);assert.equal(label.width,before.width);assert.equal(label.height,before.height);assert.equal(label.anchorX,(camera.x+label.point[0]*camera.scale)*.765);}
});
test('offscreen locations hide their labels and visible intermediates avoid endpoint labels',()=>{
 for(const route of ROUTES){const layout=layoutMapLabels(routeLocations(route),constrainCamera({scale:3,x:-1100,y:-500}),.765);for(const label of layout){if(!label.pointVisible)assert.equal(label.visible,false);if(label.visible&&!label.endpoint)for(const endpoint of layout.filter(p=>p.visible&&p.endpoint))assert.equal(overlap(label,endpoint),0);}}
});
