import {DEFAULTS,DEPARTURE,validateSettings,rankRoutes,dateLabel,money} from './model.mjs';

export const BRIEF_MODEL=Object.freeze({id:'Xenova/all-MiniLM-L6-v2',revision:'751bff37182d3f1213fa05d7196b954e230abad9',runtime:'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js'});
export const PRIORITIES=Object.freeze([
 {id:'time',name:'Arrival first',texts:['Deliver sooner. Arrival and transit time matter more than a lower price.','Meeting the delivery date is the main priority. Choose the quickest eligible route.']},
 {id:'cost',name:'Cost first',texts:['Keep total logistics cost low. Price is the main priority.','Choose the cheapest eligible route. Saving money matters more than a faster transit.']},
 {id:'carbon',name:'Emissions first',texts:['Minimise transport carbon emissions. Environmental impact is the main priority.','Prefer the lowest CO2 footprint even if the route takes longer or costs more.']},
 {id:'balanced',name:'Balanced',texts:['Balance price, arrival time and transport emissions equally.','No single objective matters most. Consider a balanced trade-off.']},
]);
export const EXAMPLE_BRIEF='Keep the total under EUR 22,000. Arrive by 14 December 2026. No more than 40 t CO2e. Getting there sooner matters more than the lowest price.';
export const CARBON_BRIEF='Budget EUR 24,000. Arrive by 14 December 2026. Limit 30 t CO2e. Prefer the smallest carbon footprint, even if it costs more.';
const MONTHS={nov:11,november:11,dec:12,december:12};
const numeric=text=>{let s=text.replace(/\s/g,'');const scale=/k$/i.test(s)?1000:1;s=s.replace(/k$/i,'');if(/^\d{1,3}(?:[,.]\d{3})+$/.test(s))s=s.replace(/[,.]/g,'');else if(s.includes(',')&&!s.includes('.'))s=s.replace(',','.');return Number(s)*scale;};
export const briefFingerprint=(text,settings)=>JSON.stringify([String(text).trim(),validateSettings(settings)]);

// Limits are parsed from explicit strings, never supplied by a language model.
export function parseBrief(text,base=DEFAULTS){
 text=String(text||'').trim();const settings=validateSettings(base),errors=[],sources={},spans=[];
 if(!text||text.length>600)errors.push('Write a brief between 1 and 600 characters.');
 const collect=(key,re,convert)=>{const found=[];for(const m of text.matchAll(re)){spans.push([m.index,m.index+m[0].length]);found.push({value:convert(m),quote:m[0]});}if(found.length){const distinct=[...new Set(found.map(x=>String(x.value)))];if(distinct.length!==1)errors.push(`The brief contains conflicting ${key} limits.`);else{settings[key]=found[0].value;sources[key]=found[0].quote;}}};
 collect('budget',/(?:€|\bEUR\b)\s*(-?\d(?:[\d,.]*\d)?(?:\s*k)?)|(-?\d(?:[\d,.]*\d)?(?:\s*k)?)\s*(?:euros?|EUR)\b/gi,m=>numeric(m[1]||m[2]));
 collect('deadline',/\b(202\d-\d{2}-\d{2})\b|\b(\d{1,2})\s+(November|December|Nov|Dec)\b(?:\s*,?\s*(202\d))?/gi,m=>m[1]||`${m[4]||DEPARTURE.slice(0,4)}-${String(MONTHS[m[3].toLowerCase()]).padStart(2,'0')}-${m[2].padStart(2,'0')}`);
 collect('emissions',/(-?\d+(?:[.,]\d+)?)\s*(?:t|tonnes?|tons?)\s*(?:of\s+)?(?:CO[₂2]e?|carbon(?:\s+emissions?)?|emissions?)\b/gi,m=>numeric(m[1]));
 if(sources.budget&&(!Number.isFinite(settings.budget)||settings.budget<15000||settings.budget>100000))errors.push('This prototype supports EUR budgets from 15,000 to 100,000.');
 if(sources.emissions&&(!Number.isFinite(settings.emissions)||settings.emissions<10||settings.emissions>400))errors.push('Use an emissions limit from 10 to 400 t CO2e.');
 if(sources.deadline){const d=new Date(settings.deadline+'T12:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==settings.deadline||settings.deadline<'2026-11-10'||settings.deadline>'2026-12-31')errors.push('Use a valid date between 10 November and 31 December 2026.');}
 if(/\b(?:USD|GBP|AMD|dollars?|pounds?)\b|[$£]/i.test(text))errors.push('Budgets use EUR only. Other currencies cannot be converted here.');
 if(/\b(?:next\s+(?:week|month)|tomorrow|today|in\s+\w+\s+days?)\b/i.test(text))errors.push('Relative dates need an explicit date, such as 14 December 2026.');
 if(/\b(?:avoid|exclude|no|only)\s+(?:the\s+)?(?:air|ocean|rail|sea|Suez|Cape|Middle Corridor)/i.test(text))errors.push('Route exclusions are not interpreted. Use this brief for limits and priority; inspect corridor restrictions separately.');
 let rest=[...text];for(const [start,end]of spans)for(let i=start;i<end;i++)rest[i]=' ';rest=rest.join('').replace(/CO[₂2]e?/gi,'COe');
 if(/\d/.test(rest))errors.push('Some numbers were not understood. Use EUR for budget, a named or ISO date, and t CO2e for emissions.');
 const priorityClauses=text.split(/[.!?;]+/).filter(s=>/\b(?:priorit\w*|prefer\w*|matters?|important|first|sooner|footprint)\b/i.test(s));
 const intent=(priorityClauses.length?priorityClauses.join('. '):text).slice(0,600);
 return {text,settings,sources,errors:[...new Set(errors)],valid:errors.length===0,intent,fingerprint:briefFingerprint(text,base)};
}

export function suggestPriority(scores){
 const rows=PRIORITIES.map(p=>({id:p.id,score:scores?.find(s=>s.id===p.id)?.score}));
 if(rows.some(r=>!Number.isFinite(r.score)))return null;
 rows.sort((a,b)=>b.score-a.score);
 return rows[0].score>=.23&&rows[0].score-rows[1].score>=.025?rows[0].id:null;
}
export function briefPreview(parsed,priority){
 if(!parsed.valid||!PRIORITIES.some(p=>p.id===priority))return null;
 const settings=validateSettings({...parsed.settings,priority,sort:'score',order:'asc'}),routes=rankRoutes(settings),eligible=routes.filter(r=>r.feasible);
 if(eligible[0])settings.selected=eligible[0].id;
 return {settings,route:eligible[0]||null,eligible:eligible.length,routes};
}
export function briefCurrent(text,settings,result){return !!result&&result.fingerprint===briefFingerprint(text,settings);}
export function briefField(key,value){return key==='budget'?money(value):key==='deadline'?dateLabel(value,true):`${value} t CO₂e`;}
