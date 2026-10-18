export function createProfileMenu(icon){
 let menu=null,anchor=null;
 function close(restore=false){
  if(!menu)return;
  menu.remove();menu=null;
  document.querySelectorAll('[data-action="profile"]').forEach(el=>el.setAttribute('aria-expanded','false'));
  if(restore&&anchor?.isConnected)anchor.focus({preventScroll:true});
 }
 function toggle(trigger){
  if(menu){close(true);return;}
  anchor=trigger;menu=document.createElement('div');menu.id='profile-menu';menu.className='profile-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label','Profile and workspace');
  menu.innerHTML=`<div class="profile-menu-person" role="presentation"><span class="avatar">RV</span><div><strong>Robert Vaganian</strong><small>Demo planner · Local workspace</small></div></div><button role="menuitem" data-action="guide">${icon('play',20)}<span>Quick tour</span><small>5 steps</small></button><button role="menuitem" data-action="shortcuts">${icon('keyboard',20)}<span>Keyboard shortcuts</span></button><button role="menuitem" data-action="about">${icon('info',20)}<span>About this workspace</span></button><p>Settings and saved plans stay in this browser.</p>`;
  document.body.append(menu);trigger.setAttribute('aria-expanded','true');
  const r=trigger.getBoundingClientRect(),h=menu.offsetHeight,w=menu.offsetWidth;
  menu.style.left=Math.max(12,Math.min(innerWidth-w-12,r.right-w))+'px';
  menu.style.top=Math.max(12,r.bottom+8+h<=innerHeight?r.bottom+8:r.top-h-8)+'px';
  menu.querySelector('[role="menuitem"]').focus({preventScroll:true});
 }
 document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest('[data-action="profile"]'))close(false);});
 document.addEventListener('keydown',e=>{
  if(!menu)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(true);return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   const items=[...menu.querySelectorAll('[role="menuitem"]')],i=items.indexOf(document.activeElement);
   const next=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
   e.preventDefault();e.stopImmediatePropagation();items[next].focus();
  }
 },true);
 document.addEventListener('focusin',e=>{if(menu&&!menu.contains(e.target)&&e.target!==anchor)close(false);});
 window.addEventListener('resize',()=>close(false));
 return {toggle,close};
}
