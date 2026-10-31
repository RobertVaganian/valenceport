import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {MARITIME_DATA} from '../dist/maritime-data.mjs';
import {TERMINALS} from '../dist/maritime-paths.mjs';
import { ROUTES } from '../dist/model.mjs';
import { projectPoint, roundedRoutePath } from '../dist/route-geometry.mjs';
import { landMask, samplePath } from './helpers/land-mask.mjs';

const land=landMask(readFileSync(new URL('../dist/assets/land.svg',import.meta.url),'utf8'));
test('the coast check distinguishes African land from the offshore Atlantic corridor',()=>{
 assert.equal(land(...projectPoint([-15,15])),true);
 assert.equal(land(...projectPoint([-22,15])),false);
});
for(const id of ['suez','cape','seaair'])test(`${id} sea legs avoid displayed land outside named port and canal approaches`,()=>{
 let route=ROUTES.find(r=>r.id===id);
 if(id==='seaair')route={...route,points:MARITIME_DATA.seaair.points};
 const ports=[TERMINALS.yangshan,TERMINALS.rwg,TERMINALS.singapore,TERMINALS.jebelAli].map(projectPoint),collisions=[];
 for(const [x,y] of samplePath(roundedRoutePath(route),.5)){
  const longitude=x/1000*170-25,latitude=70-y/610*115;
  if(ports.some(p=>Math.hypot(x-p[0],y-p[1])<1.5))continue;
  if(longitude>31.9&&longitude<32.9&&latitude>29.3&&latitude<31.5)continue;
  if(longitude>-6.2&&longitude<-5.25&&latitude>35.75&&latitude<36.2)continue;
  if(land(x,y))collisions.push([+longitude.toFixed(3),+latitude.toFixed(3)]);
 }
 assert.deepEqual(collisions,[]);
});
