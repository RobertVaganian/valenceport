import {calendarCells,shiftMonth,moveCalendarDate} from './calendar-model.mjs';
const MIN='2026-11-10',MAX='2026-12-31';
const parsed=stamp=>new Date(`${stamp}T00:00:00Z`);
const dateName=stamp=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(parsed(stamp));
const fullName=stamp=>new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(parsed(stamp));
const monthName=month=>new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(parsed(`${month}-01`));
export function planningLimitsForm(settings,icon,focus='budget'){
 const number=(id,label,unit,value,min,max,step,help,prefix=false)=>`<div class="field limit-field"><label for="limit-${id}">${label}</label><div class="limit-number">${prefix?`<span class="limit-unit">${unit}</span>`:''}<input id="limit-${id}" name="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value}" required aria-describedby="limit-${id}-help" ${id===focus?'autofocus':''}>${!prefix?`<span class="limit-unit">${unit}</span>`:''}<div class="limit-stepper"><button type="button" data-limit-for="limit-${id}" data-limit-step="-1" aria-label="Decrease ${label.toLowerCase()}" ${value<=min?'disabled':''}>${icon('minus',16)}</button><button type="button" data-limit-for="limit-${id}" data-limit-step="1" aria-label="Increase ${label.toLowerCase()}" ${value>=max?'disabled':''}>${icon('plus',16)}</button></div></div><small id="limit-${id}-help">${help}</small></div>`;
 return `<form id="constraints-form"><div class="dialog-content planning-limits-content"><p class="dialog-intro">Limits decide which routes are viable. Your priority ranks the options that remain.</p><div class="form-grid">${number('budget','Logistics budget','EUR',settings.budget,15000,100000,100,'For all 4 containers, including contingency.',true)}<div class="field deadline-field"><label id="deadline-label" for="deadline-trigger">Delivery deadline</label><input type="hidden" id="limit-deadline" name="deadline" value="${settings.deadline}"><button id="deadline-trigger" ${focus==='deadline'?'autofocus':''} class="deadline-trigger" type="button" data-date-trigger aria-haspopup="dialog" aria-expanded="false" aria-controls="deadline-calendar" aria-describedby="deadline-help" aria-label="Delivery deadline: ${dateName(settings.deadline)}"><span>${dateName(settings.deadline)}</span>${icon('calendar',18)}</button><small id="deadline-help">Departure stays fixed at 9 Nov. Choose 10 Nov–31 Dec 2026.</small></div></div>${number('emissions','Transport emissions limit','t CO₂e',settings.emissions,10,400,1,'A planning limit for this shipment, not a carbon tax or certified footprint.')}<div class="constraint-summary">${icon('info',17)} A route must meet all three limits to be saved for review.</div></div><footer class="dialog-footer"><button type="button" class="button quiet" data-action="close">Cancel</button><button class="button primary" type="submit">Apply limits ${icon('check',15)}</button></footer></form>`;
}
export function createPlanningControls(icon){
 let calendar=null,trigger=null,active='',month='';
 function close(restore=false){
  calendar?.remove();calendar=null;
  if(trigger?.isConnected){trigger.setAttribute('aria-expanded','false');if(restore)trigger.focus({preventScroll:true});}
 }
 function place(){
  if(!calendar)return;
  if(!trigger?.isConnected){close();return;}
  const rect=trigger.getBoundingClientRect(),width=calendar.offsetWidth,height=calendar.offsetHeight;
  calendar.style.left=Math.max(12,Math.min(innerWidth-width-12,rect.right-width))+'px';
  const preferred=rect.bottom+8+height<=innerHeight?rect.bottom+8:rect.top-height-8;
  calendar.style.top=Math.max(12,Math.min(innerHeight-height-12,preferred))+'px';
 }
 function render(focus=true){
  const selected=document.getElementById('limit-deadline').value;
  const previous=shiftMonth(`${month}-01`,-1).slice(0,7),next=shiftMonth(`${month}-01`,1).slice(0,7);
  const cells=calendarCells(month);
  calendar.innerHTML=`<header><button type="button" class="calendar-month" data-calendar-month="-1" aria-label="Previous month" ${previous<MIN.slice(0,7)?'disabled':''}>${icon('chevron',18)}</button><strong aria-live="polite">${monthName(month)}</strong><button type="button" class="calendar-month" data-calendar-month="1" aria-label="Next month" ${next>MAX.slice(0,7)?'disabled':''}>${icon('chevron',18)}</button></header><div role="grid" aria-label="${monthName(month)}"><div role="row" class="calendar-weekdays">${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(w=>`<span role="columnheader" aria-label="${w}">${w.slice(0,2)}</span>`).join('')}</div>${Array.from({length:cells.length/7},(_,week)=>`<div role="row" class="calendar-week">${cells.slice(week*7,week*7+7).map(stamp=>stamp?`<span role="gridcell" aria-selected="${stamp===selected}"><button type="button" class="calendar-day" data-calendar-date="${stamp}" aria-label="${fullName(stamp)}" aria-pressed="${stamp===selected}" tabindex="${stamp===active?'0':'-1'}" ${stamp<MIN||stamp>MAX?'disabled':''}>${Number(stamp.slice(8))}</button></span>`:'<span role="gridcell"></span>').join('')}</div>`).join('')}</div><p>Arrow keys move · Enter selects · Esc closes</p>`;
  place();if(focus){const button=calendar.querySelector(`[data-calendar-date="${active}"]`);button?.focus({preventScroll:true});button?.scrollIntoView({block:'nearest'});}
 }
 function open(button){
  if(calendar){close(true);return;}
  trigger=button;active=document.getElementById('limit-deadline').value;active=active<MIN?MIN:active>MAX?MAX:active;month=active.slice(0,7);
  calendar=document.createElement('section');calendar.id='deadline-calendar';calendar.className='deadline-calendar';calendar.setAttribute('role','dialog');calendar.setAttribute('aria-label','Choose delivery deadline');calendar.setAttribute('aria-modal','false');
  trigger.closest('.dialog').append(calendar);trigger.setAttribute('aria-expanded','true');render();
 }
 function syncStepper(input){
  const container=input.closest('.limit-number');if(!container)return;
  const value=input.valueAsNumber;
  container.querySelector('[data-limit-step="-1"]').disabled=Number.isFinite(value)&&value<=Number(input.min);
  container.querySelector('[data-limit-step="1"]').disabled=Number.isFinite(value)&&value>=Number(input.max);
 }
 document.addEventListener('input',e=>{if(e.target.matches('.limit-number input'))syncStepper(e.target);});
 document.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-date-trigger')){open(button);return;}
  if(button.dataset.limitFor){const input=document.getElementById(button.dataset.limitFor);input.stepUp(Number(button.dataset.limitStep));input.dispatchEvent(new Event('input',{bubbles:true}));return;}
  if(!calendar||!calendar.contains(button))return;
  if(button.dataset.calendarMonth){active=moveCalendarDate(active,button.dataset.calendarMonth==='1'?'PageDown':'PageUp',MIN,MAX);month=active.slice(0,7);render();return;}
  if(button.dataset.calendarDate){const value=button.dataset.calendarDate;document.getElementById('limit-deadline').value=value;trigger.querySelector('span').textContent=dateName(value);trigger.setAttribute('aria-label',`Delivery deadline: ${dateName(value)}`);close(true);}
 });
 document.addEventListener('pointerdown',e=>{if(calendar&&!calendar.contains(e.target)&&!e.target.closest('[data-date-trigger]'))close(false);});
 document.addEventListener('keydown',e=>{
  if(!calendar)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close(true);return;}
  if(e.key==='Tab'){close(true);return;}
  if(e.target.matches('[data-calendar-date]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();active=moveCalendarDate(active,e.key,MIN,MAX);month=active.slice(0,7);render();}
 },true);
 window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
 return {close};
}
