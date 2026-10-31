import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ROUTES} from '../dist/model.mjs';
import {roundedRoutePath} from '../dist/route-geometry.mjs';
import {routeMap} from '../dist/route-map.mjs';
import {guideView,guideSteps} from '../dist/guide.mjs';
import {caseStudyView} from '../dist/case-editorial.mjs';
const icon=()=>'<svg aria-hidden="true"></svg>';
test('each route reveal mask covers the entire selected geometry, independently of screen scale',()=>{
 const ids=new Set();
 for(const route of ROUTES){
  const html=routeMap(route,'cape');
  const id=html.match(/<mask id="([^"]+)"/)[1];assert.ok(!ids.has(id));ids.add(id);
  assert.ok(html.includes(`class="selected-route-layer" mask="url(#${id})"`));
  assert.ok(html.includes(`class="route-reveal-mask" pathLength="1" stroke-width="28" d="${roundedRoutePath(route)}"`));
 }
 const motion=readFileSync(new URL('../dist/motion.mjs',import.meta.url),'utf8');
 assert.ok(motion.includes('root.querySelector(".route-reveal-mask")'));
 assert.ok(!motion.includes('getTotalLength()'),'Screen-dependent stroke lengths must not return to the reveal');
});
test('every tour chapter has a bounded scene, pause/replay and forward navigation',()=>{
 assert.equal(guideSteps.length,5);
 for(let i=0;i<guideSteps.length;i++){
  const html=guideView(i,icon,true);
  assert.ok(html.includes(`data-scene="${i}"`));assert.ok(html.includes('data-paused="true"'));
  assert.ok(html.includes('data-action="guide-pause"'));assert.ok(html.includes('data-action="guide-replay"'));
  assert.equal((html.match(/data-action="guide-step"/g)||[]).length,5);
  assert.ok(html.includes(i===4?'Start planning':'Next step'));
 }
});
test('case study examples use the same delay and feasibility calculations as the workspace',()=>{
 const initial=caseStudyView({route:'suez',scene:'stress',delay:0},icon,'');
 const delayed=caseStudyView({route:'suez',scene:'stress',delay:7},icon,'');
 assert.ok(initial.includes('10 Dec'));assert.ok(initial.includes('>2<i> / 6'));
 assert.ok(delayed.includes('17 Dec'));assert.ok(delayed.includes('>1<i> / 6'));
 assert.ok(delayed.includes('−3 <i>days'));
 const cape=caseStudyView({route:'cape',scene:'compare',delay:0},icon,'');assert.ok(cape.includes('€16,880'));assert.ok(cape.includes('5 days late')||cape.includes('Late arrival'));
});
const luminance=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const [x,y]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return (y+.05)/(x+.05);};
test('primary text, secondary labels and status colors pass 4.5:1 in both themes',()=>{
 const css=readFileSync(new URL('../dist/identity.css',import.meta.url),'utf8');
 for(const marker of [':root{',"[data-theme='dark']{"]){
  const block=css.slice(css.indexOf(marker)).split('}')[0],values=Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})/g)].map(m=>[m[1],m[2]]));
  for(const [foreground,background] of [['--text','--bg'],['--muted','--bg'],['--green-text','--green-bg'],['--warning','--warning-bg']])assert.ok(contrast(values[foreground],values[background])>=4.5,`${marker} ${foreground}`);
 }
});
