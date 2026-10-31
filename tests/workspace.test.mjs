import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,snapshotDecision,rankRoutes} from '../dist/model.mjs';
import {normaliseScenarios,scenarioTitle,updateScenario,visibleScenarios,createBackup,readBackup,planImport,planningChecks,recommendationFor} from '../dist/workspace-model.mjs';
const make=(id='sample',title='Winter delivery')=>({...snapshotDecision('suez',DEFAULTS,'Meets the delivery window within the budget.','2026-11-05T12:00:00.000Z'),id,title});
test('legacy snapshots gain names without changing their financial evidence',()=>{const old=make();delete old.title;const [next]=normaliseScenarios([old]);assert.equal(scenarioTitle(next),'Via Suez Canal');for(const key of ['cost','days','co2','arrival','settings','reason'])assert.deepEqual(next[key],old[key]);});
test('rename and star change metadata only; search and history use it',()=>{const original=make(),records=updateScenario([original],original.id,{title:' Rail alternative ',starred:true,cost:1});assert.equal(records[0].title,'Rail alternative');assert.equal(records[0].cost,18420);assert.equal(original.title,'Winter delivery');assert.equal(visibleScenarios(records,{query:'rail',starredOnly:true}).length,1);assert.equal(visibleScenarios(records,{query:'not present'}).length,0);assert.throws(()=>updateScenario(records,original.id,{title:' '}),/name/);});
test('JSON backup round trip preserves calculations, assumptions, metadata and identifiers',()=>{const records=normaliseScenarios([make()]);assert.deepEqual(readBackup(createBackup(records)),records);});
test('import rejects changed finance, unsupported format, duplicate IDs and oversized payloads',()=>{const payload=JSON.parse(createBackup([make()]));payload.scenarios[0].cost++;assert.throws(()=>readBackup(JSON.stringify(payload)),/reconcile/);payload.scenarios[0].cost--;payload.scenarios.push(payload.scenarios[0]);assert.throws(()=>readBackup(JSON.stringify(payload)),/duplicate/);assert.throws(()=>readBackup('{"version":2}'),/supported/);assert.throws(()=>readBackup('x'.repeat(1024*1024+1)),/1 MB/);});
test('import skips existing identifiers, never overwrites their metadata and enforces capacity',()=>{const existing=[make('same')],incoming=[make('same','Edited elsewhere'),make('new')],plan=planImport(existing,incoming);assert.equal(plan.duplicates,1);assert.equal(plan.total,2);assert.equal(plan.additions[0].id,'new');assert.equal(existing[0].title,'Winter delivery');assert.throws(()=>planImport(Array.from({length:50},(_,i)=>make('id'+i)),[make('extra')]),/50/);});
test('invalid local records do not discard unrelated valid snapshots',()=>{assert.equal(normaliseScenarios([{id:'bad'},make(),make()]).length,1);});
test('planning checks agree with eligibility and recommendation weights',()=>{for(const settings of [DEFAULTS,{...DEFAULTS,budget:15000,deadline:'2026-11-10',emissions:10},{...DEFAULTS,fuel:35,delay:12}])for(const route of rankRoutes(settings))assert.equal(planningChecks(route,settings).every(c=>c.passed),route.feasible);const result=recommendationFor(DEFAULTS);assert.equal(result.candidates[0].id,'suez');assert.equal(result.weights.reduce((a,b)=>a+b),100);});

test('shipment references migrate while older scenario backups remain importable',()=>{
 const original=JSON.parse(createBackup([snapshotDecision('suez',DEFAULTS,'Meets the deadline within budget.') ]));
 assert.equal(original.shipmentId,'SHP-2026-0842');original.shipmentId='VP-2048';
 assert.equal(readBackup(JSON.stringify(original)).length,1);
});
