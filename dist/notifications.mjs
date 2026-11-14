import {ROUTES,rankRoutes,evaluate,money,dateLabel} from './model.mjs';
const kinds=['baseline','limits','ranking','saved','import','brief'];
export function notice(kind,{routeId=null,scenarioId=null,title,detail},now=new Date().toISOString(),id=globalThis.crypto.randomUUID()){
 if(!kinds.includes(kind)||!title||!detail)throw Error('Invalid planning notice');
 return {id,kind,routeId,scenarioId,title:String(title).slice(0,120),detail:String(detail).slice(0,400),createdAt:now,read:false};
}
export function normaliseNotices(value){
 if(!Array.isArray(value))return [];const seen=new Set();
 return value.filter(n=>n&&typeof n.id==='string'&&n.id.length<=100&&!seen.has(n.id)&&kinds.includes(n.kind)&&typeof n.title==='string'&&n.title.length<=120&&typeof n.detail==='string'&&n.detail.length<=400&&Number.isFinite(Date.parse(n.createdAt))&&(n.routeId===null||ROUTES.some(r=>r.id===n.routeId))&&(n.scenarioId===null||typeof n.scenarioId==='string')&&!!seen.add(n.id)).map(n=>({...n,read:n.read===true})).slice(0,50);
}
export const addNotice=(records,item)=>[item,...records.filter(n=>n.id!==item.id)].slice(0,50);
export const unreadNotices=records=>records.filter(n=>!n.read).length;
export const markNotice=(records,id,read=true)=>records.map(n=>id==='all'||n.id===id?{...n,read}:n);
export function initialNotices(settings){
 const base=evaluate(ROUTES.find(r=>r.id===settings.baseline),settings);
 if(base.feasible)return [];
 return [notice('baseline',{routeId:base.id,title:'Your baseline is outside the planning limits',detail:`${base.short}: ${base.failures.join(', ').toLowerCase()}. Arrival ${dateLabel(base.arrival)}, ${money(base.cost)}. This is a check of the illustrative plan.`},new Date().toISOString(),'initial-plan-check')];
}
export function planningNotices(before,after){
 if(!['budget','deadline','emissions','fuel','delay','priority'].some(k=>before[k]!==after[k]))return [];
 const result=[],source=ROUTES.find(r=>r.id===after.selected),old=evaluate(source,before),now=evaluate(source,after);
 if(old.feasible&&!now.feasible)result.push(notice('limits',{routeId:now.id,title:'Selected corridor no longer meets every limit',detail:`${now.short}: ${now.failures.join(', ').toLowerCase()}. At this change: ${money(now.cost)}, arrival ${dateLabel(now.arrival)}, ${now.co2.toFixed(1)} t CO₂e.`}));
 const earlier=rankRoutes(before).find(r=>r.feasible),latest=rankRoutes(after).find(r=>r.feasible);
 if(earlier?.id!==latest?.id)result.push(notice('ranking',{routeId:latest?.id||after.selected,title:latest?'The leading eligible option changed':'No corridor meets all current limits',detail:latest?`${latest.short} now leads under the ${after.priority} priority. ${money(latest.cost)}, arrival ${dateLabel(latest.arrival)}. Inspect the current assumptions before saving.`:'Review the budget, arrival date, emissions limit and stress assumptions. This planning check is not a carrier alert.'}));
 return result;
}
