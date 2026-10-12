import {STRESS_PRESETS} from './model.mjs';
const descriptions={base:'Original planning assumptions',fuel:'Fuel +15% · No added delay',delay:'No fuel change · Port delay +7 days',combined:'Fuel +15% · Port delay +7 days'};
export function createPresetMenu(icon){
 let menu=null,anchor=null;
 function close(restore=false){
  if(!menu)return;
  menu.remove();menu=null;
  if(anchor?.isConnected){anchor.setAttribute('aria-expanded','false');if(restore)anchor.focus({preventScroll:true});}
 }
 function place(){
  if(!menu)return;
  if(!anchor?.isConnected){close();return;}
  const r=anchor.getBoundingClientRect(),w=menu.offsetWidth,h=menu.offsetHeight;
  menu.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+'px';
  menu.style.top=Math.max(12,r.bottom+7+h<=innerHeight?r.bottom+7:r.top-h-7)+'px';
 }
 function toggle(trigger,edge){
  if(menu){close(true);return;}
  anchor=trigger;menu=document.createElement('div');menu.id='scenario-preset-menu';menu.className='preset-menu';menu.setAttribute('role','listbox');menu.setAttribute('aria-label','Scenario presets');
  menu.innerHTML=STRESS_PRESETS.map(p=>`<button type="button" role="option" aria-selected="${p.id===trigger.dataset.value}" tabindex="-1" data-action="stress-preset" data-value="${p.id}"><span><strong>${p.label}</strong><small>${descriptions[p.id]}</small></span>${icon('check',18)}</button>`).join('');
  document.body.append(menu);trigger.setAttribute('aria-expanded','true');
  place();
  const options=[...menu.querySelectorAll('[role="option"]')];
  const active=edge==='last'?options.at(-1):menu.querySelector('[aria-selected="true"]')||options[0];
  active.focus({preventScroll:true});active.scrollIntoView({block:'nearest'});
 }
 document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest('[data-action="preset-menu"]'))close(false);});
 document.addEventListener('keydown',e=>{
  if(!menu){
   const trigger=e.target.closest('[data-action="preset-menu"]');
   if(trigger&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();toggle(trigger,e.key==='ArrowUp'?'last':undefined);}
   return;
  }
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(true);return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   const options=[...menu.querySelectorAll('[role="option"]')],i=options.indexOf(document.activeElement);
   const next=e.key==='Home'?0:e.key==='End'?options.length-1:(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;
   e.preventDefault();e.stopImmediatePropagation();options[next].focus({preventScroll:true});options[next].scrollIntoView({block:'nearest'});
  }
 },true);
 document.addEventListener('focusin',e=>{if(menu&&!menu.contains(e.target)&&e.target!==anchor)close(false);});
 window.addEventListener('resize',()=>close(false));
 window.addEventListener('scroll',place,true);
 return {toggle,close};
}
