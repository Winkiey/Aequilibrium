import test from 'node:test';
import assert from 'node:assert/strict';
import {RoomAudio} from '../.sites-runtime/test-modules/audio.mjs';
import {SEASON_SCORES,ambienceFor,seasonIndex,noteHz} from '../.sites-runtime/test-modules/soundtrack.mjs';

function rig(){
 const prior={AudioContext:globalThis.AudioContext,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
 const contexts=[],timers=new Set();let resumeGate=null;
 class Param{value=0;events=[];setValueAtTime(v,t){this.events.push({kind:'set',v,t});this.value=v;}setTargetAtTime(v,t,tau){this.events.push({kind:'target',v,t,tau});this.value=v;}linearRampToValueAtTime(v,t){this.events.push({kind:'linear',v,t});}exponentialRampToValueAtTime(v,t){assert.ok(v>0);this.events.push({kind:'exponential',v,t});}}
 class Node{gain=new Param();frequency=new Param();Q=new Param();detune=new Param();connections=[];stopped=false;connect(n){this.connections.push(n);return n;}disconnect(){this.connections=[];}start(t=0){this.startAt=Math.max(t,this.currentContext.currentTime);}stop(t=0){this.stopAt=t;this.stopped=t===0;}}
 class Context{currentTime=0;sampleRate=100;destination={};nodes=[];state='suspended';constructor(){contexts.push(this);}node(){const n=new Node();n.currentContext=this;this.nodes.push(n);return n;}createGain(){return this.node();}createOscillator(){const n=this.node();n.oscillator=true;return n;}createBiquadFilter(){return this.node();}createBufferSource(){const n=this.node();n.bufferSource=true;return n;}createBuffer(c,n){return{getChannelData:()=>new Float32Array(n)};}async resume(){if(resumeGate)await resumeGate;this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}}
 globalThis.AudioContext=Context;globalThis.setInterval=fn=>{timers.add(fn);return fn;};globalThis.clearInterval=fn=>timers.delete(fn);
 return {contexts,timers,setResumeGate(p){resumeGate=p;},tick(t){const ctx=contexts[0];ctx.currentTime=t;for(const n of ctx.nodes)if(n.stopAt>0&&n.stopAt<=t&&!n.ended){n.ended=true;n.onended?.();}for(const fn of timers)fn();},restore(){Object.assign(globalThis,prior);}};
}
test('four original scores differ in harmony, pacing and melody; calendar begins with autumn',()=>{
 assert.deepEqual(SEASON_SCORES.map(x=>x.name[0]),['秋','冬','春','夏']);
 for(const key of ['chords','melody','pace'])assert.equal(new Set(SEASON_SCORES.map(x=>JSON.stringify(x[key]))).size,4);
 for(const score of SEASON_SCORES){assert.equal(score.melody.length,16);assert.equal(score.chords.length,4);assert.ok(score.melody.includes(null));for(const n of [...score.chords.flat(),...score.melody.filter(n=>n!==null)])assert.ok(n>=64&&n<80,'Keep the accompaniment and melody in the light middle register.');}
 assert.equal(seasonIndex(12),0);assert.equal(seasonIndex(-1),3);assert.equal(seasonIndex(NaN),0);
});
test('sunny scenes have no rain; room and night attenuate nature appropriately',()=>{
 const base={season:2,rain:false,outdoors:true,night:false},spring=ambienceFor(base);
 assert.equal(spring.rain,0);assert.ok(spring.birds>0);assert.equal(ambienceFor({...base,night:true}).birds,0);
 const interior=ambienceFor({...base,outdoors:false});assert.ok(interior.air<spring.air);assert.ok(interior.birds<spring.birds);
 assert.ok(ambienceFor({...base,rain:true}).rain>0);assert.equal(ambienceFor({...base,season:1}).insects,0);
 assert.ok(ambienceFor({...base,season:3,night:true}).insects>ambienceFor({...base,season:3}).insects);
});
test('real controller schedules music, crossfades season buses, and keeps zero levels silent',async()=>{
 const r=rig(),audio=new RoomAudio();try{
  audio.scene({season:2,rain:false,outdoors:true,night:false});await audio.start();const ctx=r.contexts[0];assert.ok(ctx.nodes.some(n=>n.oscillator));
  const buses=ctx.nodes.filter(n=>n.gain.events.some(e=>e.kind==='target'&&e.tau===1.8));assert.equal(buses.length,6);
  assert.deepEqual(buses.slice(0,4).map(n=>n.gain.value),[0,0,1,0]);assert.equal(buses[4].gain.value,0);
  audio.scene({season:3,rain:true,outdoors:false,night:true});assert.deepEqual(buses.slice(0,4).map(n=>n.gain.value),[0,0,0,1]);assert.ok(buses[4].gain.value>0);
  audio.levels(0,0);const levelNodes=ctx.nodes.filter(n=>n.gain.events.some(e=>e.kind==='target'&&e.tau===1.2));assert.equal(levelNodes.filter(n=>n.gain.value===0).length,2);
  audio.duck(0);audio.page();assert.equal(ctx.nodes[0].gain.value,0);const page=ctx.nodes.filter(n=>n.oscillator).at(-1);assert.notEqual(page.connections[0]?.connections[0],ctx.destination,'page must pass through master mute');
 }finally{await audio.close();r.restore();}
});
test('pause/resume does not duplicate timers or replay queued voices, close releases context',async()=>{
 const r=rig(),audio=new RoomAudio();try{
  await audio.start();await audio.start();assert.equal(r.timers.size,1);assert.equal(r.contexts.length,1);
  r.tick(2);await audio.pause();assert.equal(r.timers.size,0);assert.equal(r.contexts[0].state,'suspended');
  const oscillators=r.contexts[0].nodes.filter(n=>n.oscillator);assert.ok(oscillators.every(n=>n.stopped||n.ended));
  await audio.start();assert.equal(r.timers.size,1);assert.equal(r.contexts.length,1);r.tick(20);
  await audio.close();assert.equal(r.timers.size,0);assert.equal(r.contexts[0].state,'closed');assert.ok(r.contexts[0].nodes.filter(n=>n.bufferSource).every(n=>n.stopped));
 }finally{await audio.close();r.restore();}
});
test('pause during pending browser audio unlock cannot start a hidden soundtrack afterwards',async()=>{
 const r=rig(),audio=new RoomAudio();let unlock;try{
  r.setResumeGate(new Promise(resolve=>{unlock=resolve;}));const pending=audio.start();await audio.pause();unlock();await pending;assert.equal(r.timers.size,0);assert.ok(r.contexts[0].nodes.every(n=>!n.oscillator));
 }finally{await audio.close();r.restore();}
});
test('all four seasons avoid low-pitched drones and long sustained oscillators, including page feedback',async()=>{
 for(let season=0;season<4;season++){
  const r=rig(),audio=new RoomAudio();try{
   audio.scene({season,rain:false,outdoors:true,night:false});await audio.start();
   for(let t=0;t<65;t+=.2)r.tick(t);audio.page();
   const tones=r.contexts[0].nodes.filter(n=>n.oscillator);assert.ok(tones.length>20);
   for(const tone of tones){assert.ok(tone.frequency.value>=noteHz(64)-.001,'No bass note or sub-bass pulse');assert.ok(tone.stopAt-tone.startAt<=2.401,'No continuous pad/drone');}
   const cuts=r.contexts[0].nodes.filter(n=>n.type==='highpass').map(n=>n.frequency.value);assert.ok(cuts.includes(250)&&cuts.includes(220),'Music and air both reject low-frequency rumble');
  }finally{await audio.close();r.restore();}
 }
});
