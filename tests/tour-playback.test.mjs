import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTourPlayback} from '../dist/tour-playback.mjs';
function setup(reduced=false){
 let serial=0;const timers=new Map(),frames=[];
 const player=createTourPlayback(s=>frames.push(s),{schedule:fn=>{timers.set(++serial,fn);return serial;},cancel:id=>timers.delete(id),reduced:()=>reduced});
 const tick=()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn();};
 return {player,timers,frames,tick};
}
test('a tour example advances once and holds its result without looping',()=>{
 const {player,timers,frames,tick}=setup();player.start();tick();tick();
 assert.deepEqual(frames,[{phase:0,playing:true},{phase:1,playing:true},{phase:2,playing:false}]);
 assert.equal(timers.size,0);player.replay();assert.deepEqual(player.state(),{phase:0,playing:true});
});
test('pause, manual frames and closing cancel pending transitions',()=>{
 const {player,timers,tick}=setup();player.start();tick();player.toggle();assert.equal(timers.size,0);
 player.toggle();tick();assert.equal(player.state().phase,2);
 player.seek(0);assert.deepEqual(player.state(),{phase:0,playing:false});assert.equal(timers.size,0);
 player.replay();player.stop();assert.equal(timers.size,0);
});
test('reduced motion starts with manual controls and no autoplay',()=>{
 const {player,timers}=setup(true);player.start();assert.deepEqual(player.state(),{phase:0,playing:false});assert.equal(timers.size,0);
 player.seek(2);assert.deepEqual(player.state(),{phase:2,playing:false});
});
