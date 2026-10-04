import {COUNTRIES,CITIES} from './geographic-labels.mjs';
const caches=new WeakMap();
const overlap=(a,b)=>a.x<b.x+b.width+4&&a.x+a.width>b.x-4&&a.y<b.y+b.height+4&&a.y+a.height>b.y-4;
export function contextLabels(camera,pixelScale,cards=[]) {
 const width=1000*pixelScale,height=610*pixelScale,placed=[];
 const reserved=[...cards,...cards.filter(card=>Number.isFinite(card.anchorX)).map(card=>({x:card.anchorX-15,y:card.anchorY-15,width:30,height:30})),{x:8,y:height-108,width:Math.min(245,width*.62),height:80},{x:width-160,y:0,width:160,height:116},{x:width-220,y:height-75,width:220,height:75}];
 const major=['China','India','Russia','Kazakhstan','Mongolia','Iran','Saudi Arabia','Algeria','South Africa','Indonesia','Turkey','Pakistan','Egypt'];
 const medium=['France','Germany','Spain','Italy','United Kingdom','Ukraine','Poland','Romania','Uzbekistan','Turkmenistan','Sudan','Ethiopia','Kenya','Tanzania','Namibia','Mozambique','Madagascar','Thailand','Vietnam','Malaysia','South Korea','Japan','Iraq','Syria','Afghanistan'];
 const countries=COUNTRIES.filter(p=>major.includes(p.name)||(camera.scale>=1.8&&medium.includes(p.name))||(camera.scale>=3.5&&p.name.length<24&&!['Puntland','Somaliland','Pante Makasar'].includes(p.name))).map(p=>({...p,rank:major.includes(p.name)?0:medium.includes(p.name)?1:2,type:'country'}));
 const cities=camera.scale>=1.8?CITIES.filter(p=>p.rank<=(camera.scale<3?1:camera.scale<4.5?2:4)).map(p=>({...p,type:'city'})):[];
 for(const item of [...countries,...cities].sort((a,b)=>a.rank-b.rank)) {
  const x=(camera.x+item.point[0]*camera.scale)*pixelScale,y=(camera.y+item.point[1]*camera.scale)*pixelScale;
  const text=item.type==='country'?item.name.toUpperCase():item.name,w=text.length*(item.type==='country'?7.5:6.7),h=13;
  const rect={x:item.type==='country'?x-w/2:x+5,y:y-h+3,width:w,height:h};
  if(rect.x<8||rect.x+w>width-8||rect.y<8||rect.y+h>height-12||[...reserved,...placed].some(other=>overlap(rect,other)))continue;
  placed.push({...rect,...item,text,anchorX:x,anchorY:y});if(placed.length>=(camera.scale<1.8?11:35))break;
 }
 return placed;
}
export function updateGeographicContext(map,camera,pixelScale,cards) {
 const root=map.querySelector('.geographic-annotations');if(!root)return;
 if(map.dataset.details==='false'){root.replaceChildren();caches.delete(map);return;}
 const labels=contextLabels(camera,pixelScale,cards),cache=caches.get(map)||new Map(),needed=new Set();
 for(const label of labels){const key=label.type+label.name;needed.add(key);let group=cache.get(key);
  if(!group){group=document.createElementNS('http://www.w3.org/2000/svg','g');if(label.type==='city'){const dot=document.createElementNS(group.namespaceURI,'circle');dot.setAttribute('class','geo-city-dot');group.append(dot);}const text=document.createElementNS(group.namespaceURI,'text');text.setAttribute('class','geo-'+label.type);text.textContent=label.text;group.append(text);root.append(group);cache.set(key,group);}
  const text=group.querySelector('text');text.setAttribute('x',label.x/pixelScale);text.setAttribute('y',(label.y+11)/pixelScale);text.style.fontSize=`${11/pixelScale}px`;text.style.letterSpacing=label.type==='country'?`${.7/pixelScale}px`:'0';
  const dot=group.querySelector('circle');if(dot){dot.setAttribute('cx',label.anchorX/pixelScale);dot.setAttribute('cy',label.anchorY/pixelScale);dot.setAttribute('r',1.6/pixelScale);}
 }
 for(const [key,group] of cache)if(!needed.has(key)){group.remove();cache.delete(key);}caches.set(map,cache);
}
