// Keep one persistent vector definition outside rerendered views. External SVG
// <use> documents can be dropped by Chromium when their last instance is removed.
let loaded;
let prefix='/assets/geography.svg#';
export const geographyHref=id=>prefix+id;
export function loadGeography(){
 return loaded??=fetch('/assets/geography.svg').then(response=>{
  if(!response.ok)throw new Error('Geography HTTP '+response.status);
  return response.text();
 }).then(markup=>{
  const parsed=new DOMParser().parseFromString(markup,'image/svg+xml');
  if(parsed.querySelector('parsererror'))throw new Error('Invalid geography SVG');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('aria-hidden','true');svg.setAttribute('width','0');svg.setAttribute('height','0');
  svg.style.cssText='position:absolute;overflow:hidden;pointer-events:none';
  svg.id='map-geography-definitions';
  const defs=document.createElementNS(svg.namespaceURI,'defs');
  for(const id of ['land','lakes','rivers','borders']){
   const source=parsed.getElementById(id);if(!source)throw new Error('Missing geography layer '+id);
   const group=document.importNode(source,true);group.id='vp-geography-'+id;defs.append(group);
  }
  svg.append(defs);document.body.append(svg);prefix='#vp-geography-';
 }).catch(error=>{
  // Preserve the existing self-hosted SVG fallback if a transient fetch fails.
  console.warn('Persistent map base unavailable; using external SVG fallback.',error);
 });
}
