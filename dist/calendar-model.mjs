const iso=date=>date.toISOString().slice(0,10);
const day=stamp=>new Date(`${stamp}T00:00:00Z`);
export function calendarCells(month){
 const first=day(`${month}-01`),offset=(first.getUTCDay()+6)%7;
 const count=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 return Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>i<offset||i>=offset+count?null:`${month}-${String(i-offset+1).padStart(2,'0')}`);
}
export function shiftMonth(stamp,amount){
 const current=day(stamp),date=new Date(Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+amount,1));
 const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
 date.setUTCDate(Math.min(current.getUTCDate(),last));return iso(date);
}
export function moveCalendarDate(stamp,key,min,max){
 let next=stamp;const date=day(stamp),weekday=(date.getUTCDay()+6)%7;
 const offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7,Home:-weekday,End:6-weekday}[key];
 if(offset!==undefined){date.setUTCDate(date.getUTCDate()+offset);next=iso(date);}
 else if(key==='PageUp'||key==='PageDown')next=shiftMonth(stamp,key==='PageUp'?-1:1);
 return next<min?min:max&&next>max?max:next;
}
