import {AMS_ROAD,DUBAI_ROAD} from './network-tracks.mjs';
import {MARITIME_DATA} from './maritime-data.mjs';
export const TERMINALS={yangshan:[122.075,30.613333],singapore:[103.776667,1.283333],jebelAli:[55.066111,24.992222],dwc:[55.1614,24.8964],pvg:[121.8052,31.1434],ams:[4.7683,52.3086],rwg:[3.991111,51.953333],rsc:[4.428333,51.872222]};
// Airport connections are great circles, not filed flight tracks.
export function greatCircle(a,b,count=64){
 const rad=x=>x*Math.PI/180,deg=x=>x*180/Math.PI;
 const vector=p=>[Math.cos(rad(p[1]))*Math.cos(rad(p[0])),Math.cos(rad(p[1]))*Math.sin(rad(p[0])),Math.sin(rad(p[1]))];
 const x=vector(a),y=vector(b),omega=Math.acos(Math.max(-1,Math.min(1,x.reduce((sum,n,i)=>sum+n*y[i],0))));
 return Array.from({length:count+1},(_,i)=>{if(i===0)return a;if(i===count)return b;const t=i/count,A=Math.sin((1-t)*omega)/Math.sin(omega),B=Math.sin(t*omega)/Math.sin(omega),v=x.map((n,k)=>n*A+y[k]*B);return [deg(Math.atan2(v[1],v[0])),deg(Math.atan2(v[2],Math.hypot(v[0],v[1])))];});
}
export const ROAD_TO_ROTTERDAM=[TERMINALS.ams,...AMS_ROAD,TERMINALS.rsc];
export const DUBAI_FLIGHT=greatCircle(TERMINALS.dwc,TERMINALS.ams);
export const MARITIME_PATHS={suez:MARITIME_DATA.suez.points,cape:MARITIME_DATA.cape.points,seaair:[...MARITIME_DATA.seaair.points,...DUBAI_ROAD,TERMINALS.dwc,...DUBAI_FLIGHT.slice(1),...ROAD_TO_ROTTERDAM.slice(1)]};
