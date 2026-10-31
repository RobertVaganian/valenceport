import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROUTES,DEFAULTS,evaluate} from '../dist/model.mjs';
import {scenarioImpact} from '../dist/scenario-impact.mjs';
import {previewFrame,nextPreviewStage} from '../dist/journey-preview-model.mjs';
import {timelineFor} from '../dist/planning.mjs';

test('scenario impact compares a route with itself, independent of the pinned baseline',()=>{
  const settings={...DEFAULTS,fuel:15,delay:7};
  const impact=scenarioImpact(settings),repinned=scenarioImpact({...settings,baseline:'air'});
  assert.equal(impact.costChange,2160);
  assert.equal(impact.daysChange,7);
  assert.deepEqual(impact,repinned);
  assert.equal(impact.before.arrival,'2026-12-10');
  assert.equal(impact.after.arrival,'2026-12-17');
});
test('seven days of port delay removes Suez from the viable set and leaves rail',()=>{
  const impact=scenarioImpact({...DEFAULTS,delay:7});
  assert.equal(impact.eligibleBefore,2);assert.equal(impact.eligibleAfter,1);
  assert.equal(impact.best.id,'rail');assert.equal(impact.after.buffer,-3);
  assert.equal(impact.costChange,0);
});
test('impact respects custom limits and reports no alternative when none is viable',()=>{
  const impact=scenarioImpact({...DEFAULTS,budget:1000,deadline:'2026-11-10',emissions:1,fuel:15});
  assert.equal(impact.eligibleBefore,0);assert.equal(impact.eligibleAfter,0);assert.equal(impact.best,null);
});
test('port-delay impact does not add transit time to direct air',()=>{
  const impact=scenarioImpact({...DEFAULTS,selected:'air',fuel:-10,delay:14});
  assert.equal(impact.daysChange,0);assert.equal(impact.before.arrival,impact.after.arrival);
  assert.ok(impact.costChange<0);assert.equal(impact.before.co2,impact.after.co2);
});
test('base assumptions report zero changes for every route',()=>{
  for(const route of ROUTES){const impact=scenarioImpact({...DEFAULTS,selected:route.id});assert.equal(impact.costChange,0);assert.equal(impact.daysChange,0);assert.equal(impact.changed,false);}
});
test('preview dates progress monotonically and finish at the modelled arrival on all routes',()=>{
  for(const route of ROUTES)for(const delay of [0,7,14]) {
    const settings={...DEFAULTS,delay},expected=evaluate(route,settings);let date='';
    for(let i=0;i<=100;i++){
      const frame=previewFrame(route.id,settings,i/100);
      assert.ok(frame.date>=date);date=frame.date;
      assert.ok(frame.legProgress>=0&&frame.legProgress<=1);
      assert.ok(frame.index>=0&&frame.index<frame.count);
      assert.equal(frame.totalDays,expected.days);
    }
    assert.equal(previewFrame(route.id,settings,1).date,expected.arrival);
    assert.equal(previewFrame(route.id,settings,1).to,'Rotterdam');
  }
});
test('preview holds at the preceding handover throughout an added port delay',()=>{
  const settings={...DEFAULTS,delay:7};
  for(const route of ROUTES.filter(route=>route.mode!=='air')) {
    const timeline=timelineFor(route.id,settings),delay=timeline.segments.find(segment=>segment.kind==='delay');
    for(const fraction of [.01,.5,.99]){
      const frame=previewFrame(route.id,settings,(delay.startDay+fraction*delay.days)/timeline.totalDays);
      assert.equal(frame.segment.kind,'delay');assert.equal(frame.from,frame.to);
    }
  }
});
test('reduced-motion stage advances always make progress and finish after the last stage',()=>{
  for(const route of ROUTES){let p=0;const count=timelineFor(route.id,DEFAULTS).segments.length;for(let i=0;i<count;i++){const next=nextPreviewStage(route.id,DEFAULTS,p);assert.ok(next>p);p=next;}assert.equal(p,1);assert.equal(nextPreviewStage(route.id,DEFAULTS,p),1);}
});
test('preview clamps invalid progress to a valid initial or final frame',()=>{
  assert.equal(previewFrame('suez',DEFAULTS,NaN).progress,0);
  assert.equal(previewFrame('suez',DEFAULTS,-1).progress,0);
  assert.equal(previewFrame('suez',DEFAULTS,2).progress,1);
});
