import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendarCells,shiftMonth,moveCalendarDate} from '../dist/calendar-model.mjs';
test('shipment calendar is Monday-first, includes each day once and uses whole weeks',()=>{
 const november=calendarCells('2026-11'),december=calendarCells('2026-12');
 assert.equal(november.indexOf('2026-11-01'),6);assert.equal(december.indexOf('2026-12-01'),1);
 assert.equal(november.filter(Boolean).length,30);assert.equal(december.filter(Boolean).length,31);
 assert.equal(new Set(december.filter(Boolean)).size,31);assert.equal(november.length%7,0);assert.equal(december.length%7,0);
});
test('month navigation preserves the day where possible and handles leap years and year boundaries',()=>{
 assert.equal(shiftMonth('2026-12-14',-1),'2026-11-14');assert.equal(shiftMonth('2024-03-31',-1),'2024-02-29');assert.equal(shiftMonth('2026-01-31',1),'2026-02-28');assert.equal(shiftMonth('2026-12-31',1),'2027-01-31');
});
test('keyboard navigation moves through weeks and clamps to the shipment planning range',()=>{
 const move=(date,key)=>moveCalendarDate(date,key,'2026-11-10','2026-12-31');
 assert.equal(move('2026-12-14','ArrowUp'),'2026-12-07');assert.equal(move('2026-12-14','End'),'2026-12-20');assert.equal(move('2026-12-16','Home'),'2026-12-14');assert.equal(move('2026-11-10','ArrowLeft'),'2026-11-10');assert.equal(move('2026-12-31','PageDown'),'2026-12-31');assert.equal(move('2026-12-14','PageUp'),'2026-11-14');
});
