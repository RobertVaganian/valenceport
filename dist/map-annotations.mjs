import {updateGeographicContext} from './geographic-context.mjs';
import { layoutMapLabels } from './map-layout.mjs';

export function updateMapAnnotations(map,camera,active=null) {
  const bounds=map.getBoundingClientRect(),pixelScale=Math.min(bounds.width/1000,bounds.height/610);
  if(pixelScale<=0)return;
  map.style.setProperty('--map-label-scale',String(1/(pixelScale*camera.scale)));
  map.querySelector('.route-reveal-mask')?.setAttribute('stroke-width',String(12/(pixelScale*camera.scale)));
  const compact = bounds.width < 600;
  map.classList.toggle('compact-labels', compact);
  const nodes=[...map.querySelectorAll('[data-map-location]')];
  const locations=nodes.map(node=>({name:node.dataset.mapLocation,
    point:[Number(node.dataset.mapX),Number(node.dataset.mapY)],
    width:compact ? Math.min(Number(node.dataset.width), Math.max(68, node.dataset.mapLocation.length * 6.6 + 20)) : Number(node.dataset.width),
    height:compact ? 30 : Number(node.dataset.height),
    endpoint:node.dataset.endpoint==='true',role:node.dataset.role,index:Number(node.dataset.index),
  }));
  const previousSlots=Object.fromEntries(nodes.filter(n=>n.dataset.labelSlot!==undefined).map(n=>[n.dataset.mapLocation,Number(n.dataset.labelSlot)]));
  const layout=layoutMapLabels(locations,camera,pixelScale,active,previousSlots);
  for(const item of layout){
    const node=nodes.find(n=>n.dataset.mapLocation===item.name);
    node.setAttribute('transform',`translate(${camera.x+item.point[0]*camera.scale},${camera.y+item.point[1]*camera.scale})`);
    node.querySelector('.map-symbol').setAttribute('transform',`scale(${1/pixelScale})`);
    node.classList.toggle('is-active',item.name===active);
    node.style.display=item.pointVisible?'':'none';
    if(node.hasAttribute('tabindex'))node.setAttribute('tabindex',item.pointVisible?'0':'-1');
    const label=node.querySelector('.geo-label');
    label.style.display=item.visible?'':'none';
    if(!item.visible)continue;
    node.dataset.labelSlot=String(item.slot);
    label.querySelector('rect').setAttribute('width',String(item.width));
    label.querySelector('rect').setAttribute('height',String(item.height));
    const dx=item.x-item.anchorX,dy=item.y-item.anchorY;
    label.setAttribute('transform',`translate(${dx/pixelScale},${dy/pixelScale}) scale(${1/pixelScale})`);
    const endX=Math.max(0,Math.min(item.width,-dx)),endY=Math.max(0,Math.min(item.height,-dy));
    label.querySelector('.label-leader').setAttribute('d',`M${-dx},${-dy} L${endX},${endY}`);
  }
  updateGeographicContext(map,camera,pixelScale,layout.filter(item=>item.visible));
  // Geographic context yields to the port cards when the two would overlap.
  const cards=layout.filter(item=>item.visible);
  const geographicLabels=[...map.querySelectorAll('.map-labels text')].map(text=>({text,box:text.getBBox()}));
  for(const {text,box} of geographicLabels) {
    const x=(camera.x+box.x*camera.scale)*pixelScale,y=(camera.y+box.y*camera.scale)*pixelScale;
    const width=box.width*camera.scale*pixelScale,height=box.height*camera.scale*pixelScale;
    text.style.visibility=cards.some(card=>x<card.x+card.width+5&&x+width>card.x-5&&y<card.y+card.height+5&&y+height>card.y-5)?'hidden':'';
  }

}
