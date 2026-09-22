import {rankRoutes} from './model.mjs';
export const PLOT_NAMES={suez:'Suez',cape:'Cape',rail:'Rail',eco:'Slow',seaair:'Sea–air',air:'Air'};
export function tradeoffModel(settings,range='focus'){
 const routes=rankRoutes(settings),focused=routes.filter(r=>r.cost<=settings.budget*1.4),shown=range==='all'?routes:focused;
 const cap=Math.ceil(Math.max(settings.budget*1.12,...shown.map(r=>r.cost*1.12),15000)/10000)*10000;
 const days=Math.ceil(Math.max(40,...routes.map(r=>r.days))/10)*10;
 const deadline=Math.round((Date.parse(settings.deadline+'T12:00:00Z')-Date.parse('2026-11-09T12:00:00Z'))/86400000);
 return {routes,shown,cap,days,deadline,hidden:routes.length-shown.length,selectedOutside:!shown.some(r=>r.id===settings.selected),points:shown.map(r=>({...r,x:76+r.days/days*604,y:258-r.cost/cap*210,radius:Math.sqrt(r.co2)*1.2}))};
}
export function plotLabels(points,selectedId){
 const placed=[],overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 for(const point of [...points].sort((a,b)=>Number(b.id===selectedId)-Number(a.id===selectedId)||b.cost-a.cost)){
  const label=PLOT_NAMES[point.id],w=label.length*7.8+14,h=24,r=point.radius;
  const offsets=[[r+9,-h/2],[-r-w-9,-h/2],[-w/2,-r-h-7],[-w/2,r+8],[12,-r-h-9],[-w-12,-r-h-9],[12,r+10],[-w-12,r+10]];
  const candidates=offsets.map(([dx,dy])=>({x:Math.max(76,Math.min(680-w,point.x+dx)),y:Math.max(35,Math.min(265-h,point.y+dy)),w,h,label,id:point.id,pointX:point.x,pointY:point.y}));
  const penalty=rect=>placed.reduce((sum,other)=>sum+overlap({...rect,x:rect.x-3,y:rect.y-3,w:rect.w+6,h:rect.h+6},other)*100,0)+points.filter(p=>p.id!==point.id).reduce((sum,p)=>sum+overlap(rect,{x:p.x-p.radius-3,y:p.y-p.radius-3,w:p.radius*2+6,h:p.radius*2+6})*10,0)+Math.hypot(rect.x+rect.w/2-point.x,rect.y+rect.h/2-point.y)*.1;
  candidates.sort((a,b)=>penalty(a)-penalty(b));placed.push(candidates[0]);
 }
 return placed;
}
