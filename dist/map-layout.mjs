import {TERMINALS} from './maritime-paths.mjs';
import {MARITIME_DATA} from './maritime-data.mjs';
import { projectPoint } from './route-geometry.mjs';

export const LOCATION_COORDINATES = Object.freeze({
  Shanghai: [121.5, 31.2], Singapore: [103.8, 1.3],
  'Suez Canal': [32.5, 30], 'Cape of Good Hope': [19, -36],
  Kuryk: [51.442548, 43.162529], Aktau: [51.2, 43.6], Istanbul: [28.775283, 40.979839], Dubai: [55.3, 25.2],
  Amsterdam: [4.8, 52.3], Rotterdam: [4.5, 51.9],
});

export function routeLocations(route) {
  return route.legs.flatMap(([name, task, days], index) => {
    const source=route.points?route:MARITIME_DATA[route.samePath];
    let coordinates = LOCATION_COORDINATES[name];
    if(index===0)coordinates=source.points[0];
    else if(index===route.legs.length-1)coordinates=source.points.at(-1);
    else if(name==='Singapore')coordinates=TERMINALS.singapore;
    else if(name==='Dubai')coordinates=TERMINALS.jebelAli;
    else if(name==='Amsterdam')coordinates=TERMINALS.ams;
    else if(name==='Suez Canal')coordinates=MARITIME_DATA.suez.points.filter(p=>p[0]>32&&p[0]<33&&p[1]>29.7&&p[1]<31.3).sort((a,b)=>Math.abs(a[1]-30.5)-Math.abs(b[1]-30.5))[0]||coordinates;
    else if(name==='Cape of Good Hope')coordinates=MARITIME_DATA.cape.points.toSorted((a,b)=>a[1]-b[1])[0];
    if (!coordinates) return [];
    const endpoint = index === 0 || index === route.legs.length - 1;
    return [{name, task, days, index, endpoint,
      role:index===0?'Origin':endpoint?'Destination':['Suez Canal','Cape of Good Hope'].includes(name)?'Passage':'Handover',
      code:index===0?(route.mode==='air'?'PVG':route.mode==='rail'?'Rail':'SGICT'):endpoint?(route.mode==='ocean'?'RWG':'RSC'):'',
      point: projectPoint(coordinates),
      width: endpoint ? 132 : Math.max(86, name.length * 6.6 + 20),
      height: endpoint ? 46 : 28,
    }];
  });
}

const overlap = (a, b) => Math.max(0, Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)) * Math.max(0, Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

// Place constant-size labels in screen pixels, independently of geographic zoom.
// Endpoints and the inspected handover take priority. Suppressed labels remain
// available in the route-stop controls below the map.
export function layoutMapLabels(locations, camera, pixelScale, active = null, previousSlots = {}) {
  const width = 1000 * pixelScale, height = 610 * pixelScale;
  const placed = [], reserved = [
    {x:Math.max(0,width-210),y:height-65,width:210,height:65},
    {x:8,y:Math.max(8,height-106),width:Math.min(235,width*.62),height:78},
    ...(active && width>=500 ? [{x:10,y:Math.max(10,height-210),width:260,height:158}] : []),
  ];
  const anchors = locations.map(location => ({...location,
    anchorX: (camera.x + location.point[0]*camera.scale)*pixelScale,
    anchorY: (camera.y + location.point[1]*camera.scale)*pixelScale,
  }));
  const ordered = [...anchors].sort((a,b) => Number(b.endpoint)-Number(a.endpoint) || Number(b.name===active)-Number(a.name===active) || a.index-b.index);
  for (const item of ordered) {
    const {anchorX:ax,anchorY:ay,width:nominalWidth,height:h}=item;
    const w=item.endpoint&&width<420?Math.min(114,nominalWidth):nominalWidth;
    if (ax < 6 || ax > width-6 || ay < 6 || ay > height-6) {
      placed.push({...item,visible:false,pointVisible:false}); continue;
    }
    const offsets = item.role==='Origin'
      ? [[-w-13,-h-12],[13,12],[-w-13,12],[13,-h-12],[-w/2,18],[-w/2,-h-18]]
      : [[13,12],[13,-h-12],[-w-13,12],[-w-13,-h-12],[-w/2,18],[-w/2,-h-18]];
    const candidates = offsets.map(([dx,dy],slot)=>({x:clamp(ax+dx,10,width-w-10),y:clamp(ay+dy,10,height-h-16),width:w,height:h,slot}));
    if(item.endpoint)for(const x of [10,width-w-10])for(const y of [10,(height-h)/2,height-h-16])candidates.push({x,y,width:w,height:h,slot:candidates.length});
    const score = rect => {
      const expanded={...rect,x:rect.x-5,y:rect.y-5,width:w+10,height:h+10};
      return reserved.reduce((s,other)=>s+overlap(expanded,other)*100,0)
        + placed.filter(p=>p.visible).reduce((s,other)=>s+overlap(expanded,other)*1000,0)
        + anchors.reduce((s,other)=>s+overlap(rect,{x:other.anchorX-7,y:other.anchorY-7,width:14,height:14})*30,0)
        + Math.hypot(rect.x+w/2-ax,rect.y+h/2-ay) - (previousSlots[item.name]===rect.slot?28:0);
    };
    candidates.sort((a,b)=>score(a)-score(b));
    const best=candidates[0],collides=[...reserved,...placed.filter(p=>p.visible)].some(other=>overlap(best,other)>0);
    placed.push({...item,...best,visible:item.endpoint||item.name===active||!collides,pointVisible:true});
  }
  return placed;
}
