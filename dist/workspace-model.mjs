import { ROUTES, validateSettings, validDecisions, evaluate, rankRoutes, money, dateLabel } from './model.mjs';
export const MAX_SCENARIOS=50;
export const MAX_BACKUP_BYTES=1024*1024;
export const PRIORITY_WEIGHTS={balanced:[55,30,15],cost:[75,15,10],time:[15,75,10],carbon:[15,15,70]};
export function scenarioTitle(record){return record.title||ROUTES.find(r=>r.id===record.routeId)?.short||record.routeName;}
export function validTitle(value){const title=String(value??'').trim().replace(/[\u0000-\u001f]/g,'');if(!title||title.length>80)throw new Error('Use a scenario name between 1 and 80 characters.');return title;}

function cleanRecord(record){
 if(validDecisions([record]).length!==1||!/^[a-zA-Z0-9_-]{1,100}$/.test(record.id))throw new Error('A saved scenario has invalid fields.');
 const settings=validateSettings(record.settings),route=ROUTES.find(r=>r.id===record.routeId),expected=evaluate(route,settings);
 if(!expected.feasible||record.reason.trim().length<12)throw new Error('A saved scenario must meet its planning limits and include a reason.');
 if(record.settings.baseline&&record.settings.baseline!==settings.baseline)throw new Error('A saved scenario has an invalid baseline.');
 for(const key of ['budget','deadline','emissions','fuel','delay','priority'])if(record.settings[key]!==settings[key])throw new Error('A saved scenario has invalid planning assumptions.');
 for(const key of ['cost','days','co2','arrival'])if(record[key]!==expected[key])throw new Error('A saved scenario does not reconcile with its planning assumptions.');
 return {id:record.id,createdAt:record.createdAt,routeId:route.id,routeName:route.name,title:validTitle(record.title||route.short),starred:record.starred===true,cost:record.cost,days:record.days,co2:record.co2,arrival:record.arrival,reason:record.reason.trim(),settings,status:'Saved for review'};
}
export function normaliseScenarios(records){
 if(!Array.isArray(records))return [];
 const seen=new Set(),result=[];
 for(const record of records){try{const clean=cleanRecord(record);if(!seen.has(clean.id)){result.push(clean);seen.add(clean.id)}}catch{}}
 return result.slice(-MAX_SCENARIOS);
}
export function visibleScenarios(records,{query='',starredOnly=false,history=false}={}){
 const text=query.trim().toLowerCase();
 return records.filter(r=>(!starredOnly||r.starred)&&(!text||`${scenarioTitle(r)} ${r.routeName} ${r.reason}`.toLowerCase().includes(text))).toSorted((a,b)=>(history?0:Number(b.starred)-Number(a.starred))||Date.parse(b.createdAt)-Date.parse(a.createdAt));
}
export function updateScenario(records,id,patch){return records.map(record=>record.id!==id?record:{...record,...('title'in patch?{title:validTitle(patch.title)}:{}),...('starred'in patch?{starred:patch.starred===true}:{})});}
export function createBackup(records,exportedAt=new Date().toISOString()){
 if(!records.length)throw new Error('Save a scenario before exporting a backup.');
 return JSON.stringify({format:'valenceport.scenarios',version:1,shipmentId:'SHP-2026-0842',exportedAt,scenarios:records.map(cleanRecord)},null,2);
}
export function readBackup(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw new Error('Choose a JSON backup smaller than 1 MB.');
 let payload;try{payload=JSON.parse(text)}catch{throw new Error('This file is not valid JSON. Choose a ValencePort scenario backup.');}
 if(payload?.format!=='valenceport.scenarios'||payload.version!==1||!['SHP-2026-0842','VP-2048'].includes(payload.shipmentId))throw new Error('This is not a supported ValencePort scenario backup.');
 if(!Array.isArray(payload.scenarios)||!payload.scenarios.length||payload.scenarios.length>MAX_SCENARIOS)throw new Error('A backup must contain between 1 and 50 saved scenarios.');
 const result=payload.scenarios.map(cleanRecord);
 if(new Set(result.map(r=>r.id)).size!==result.length)throw new Error('The backup contains duplicate scenario identifiers.');
 return result;
}
export function planImport(existing,incoming){
 const ids=new Set(existing.map(r=>r.id)),additions=incoming.filter(r=>!ids.has(r.id));
 if(existing.length+additions.length>MAX_SCENARIOS)throw new Error('This would exceed 50 saved scenarios. Export a backup and remove a scenario before importing.');
 return {additions,duplicates:incoming.length-additions.length,total:existing.length+additions.length};
}
export function planningChecks(route,settings){
 return [
 {label:'Budget',passed:route.cost<=settings.budget,value:money(route.cost),limit:money(settings.budget),detail:route.cost<=settings.budget?`${money(settings.budget-route.cost)} remaining`:`${money(route.cost-settings.budget)} over budget`},
 {label:'Delivery',passed:route.buffer>=0,value:dateLabel(route.arrival),limit:dateLabel(settings.deadline),detail:route.buffer>=0?`${route.buffer}d before deadline`:`${-route.buffer}d after deadline`},
 {label:'CO₂e',passed:route.co2<=settings.emissions,value:`${route.co2.toFixed(1)} t`,limit:`${settings.emissions} t`,detail:route.co2<=settings.emissions?`${(settings.emissions-route.co2).toFixed(1)} t remaining`:`${(route.co2-settings.emissions).toFixed(1)} t over limit`},
 ];
}
export function recommendationFor(settings){return {weights:PRIORITY_WEIGHTS[settings.priority]||PRIORITY_WEIGHTS.balanced,candidates:rankRoutes(settings).filter(r=>r.feasible)};}
