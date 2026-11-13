import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {VoiceSession,fetchVoiceClip} from '../.sites-runtime/test-modules/voice-session.mjs';
import {connectVoiceTreatment,voiceTreatmentFor} from '../.sites-runtime/test-modules/voice-effects.mjs';

const on={enabled:true,paused:false,volume:.7},a={key:'first full performance',src:'/a.mp3'},b={key:'next full performance',src:'/b.mp3'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const gate=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
function rig({fetchClip,maxDecodedBytes}={}){
 const contexts=[],fetches=[];let clock=0,resumeGate=null;
 class Node{
  connections=[];gain={value:0};frequency={value:0};Q={value:0};buffer=null;onended=null;
  connect(other){this.connections.push(other);return other;}
  disconnect(){this.connections=[];}
  start(at=0,offset=0){this.started=true;this.at=at;this.offset=offset;}
  stop(){this.stopped=true;}
 }
 class Context{
  currentTime=0;sampleRate=48000;state='suspended';destination={};nodes=[];filters=[];decodes=0;resumes=0;
  constructor(){contexts.push(this);}
  createBufferSource(){const n=new Node();this.nodes.push(n);return n;}
  createGain(){return new Node();}
  createBiquadFilter(){const n=new Node();this.filters.push(n);return n;}
  createBuffer(channels,length,rate){return{numberOfChannels:channels,length,duration:length/rate};}
  async resume(){this.resumes++;if(resumeGate)await resumeGate;this.state='running';}
  async suspend(){this.state='suspended';}
  async close(){this.state='closed';}
  async decodeAudioData(){this.decodes++;return{length:100,numberOfChannels:1,duration:10};}
 }
 const session=new VoiceSession({createContext:()=>new Context(),fetchClip:async(src,signal)=>{fetches.push({src,signal});return fetchClip?fetchClip(src,signal):new ArrayBuffer(1);},now:()=>clock,maxDecodedBytes});
 return{session,contexts,fetches,setClock(n){clock=n;},setResumeGate(p){resumeGate=p;},spoken(){return contexts.flatMap(c=>c.nodes).filter(n=>n.buffer?.duration>1&&n.started);}};
}
test('nothing downloads or allocates before a gesture; unlock resumes synchronously in the click',async()=>{
 const r=rig();assert.equal(r.contexts.length,0);r.session.warm([a,b]);assert.equal(r.fetches.length,0);
 const pending=r.session.unlock();assert.equal(r.contexts.length,1);assert.equal(r.contexts[0].resumes,1);
 await pending;assert.equal(r.contexts[0].state,'running');assert.equal(r.spoken().length,0);await r.session.dispose();
});
test('look-ahead decodes without speaking; a later line plays from memory across component unmounts',async()=>{
 const r=rig();await r.session.unlock();r.session.warm([a,b]);await tick();assert.deepEqual(r.fetches.map(f=>f.src),[a.src,b.src]);assert.equal(r.spoken().length,0);
 const p=r.session.createChannel();p.set(a,on);await tick();assert.equal(p.status,'playing');assert.equal(p.startupMs,0);p.dispose();
 const next=r.session.createChannel();next.set(b,on);await tick();assert.equal(next.status,'playing');assert.equal(r.contexts.length,1);assert.equal(r.fetches.length,2);assert.equal(r.contexts[0].decodes,2);next.dispose();await r.session.dispose();
});
test('two quick Start/Enable gestures share one pending unlock instead of invalidating the first sentence',async()=>{
 const pending=gate(),r=rig();r.setResumeGate(pending.promise);
 const first=r.session.unlock(),second=r.session.unlock();assert.equal(first,second);assert.equal(r.contexts[0].resumes,1);
 const p=r.session.createChannel();p.set(a,on);pending.resolve();await first;await tick();assert.equal(p.status,'playing');await r.session.dispose();
});
test('a browser that leaves resume pending gets a bounded blocked state and can recover on a new gesture',async()=>{
 const original={setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout},timers=new Map();let id=0;
 globalThis.setTimeout=fn=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=key=>timers.delete(key);
 const pending=gate(),r=rig();r.setResumeGate(pending.promise);
 try{
  const opening=r.session.unlock();assert.equal(timers.size,1);[...timers.values()][0]();await assert.rejects(opening,/enable audio/);assert.equal(timers.size,0);
  r.setResumeGate(null);await r.session.unlock();assert.equal(r.contexts[0].state,'running');pending.resolve();await tick();assert.equal(r.contexts[0].state,'running');
 }finally{await r.session.dispose();Object.assign(globalThis,original);}
});
test('a selected line bypasses a stalled look-ahead and a new queue does not start parallel speculative downloads',async()=>{
 const slow=gate(),r=rig({fetchClip:src=>src===a.src?slow.promise:Promise.resolve(new ArrayBuffer(1))});await r.session.unlock();
 r.session.warm([a,b]);await tick();const c={key:'urgent',src:'/c.mp3'},p=r.session.createChannel();p.set(c,on);r.session.warm([c,b]);await tick();
 assert.equal(p.status,'playing');assert.deepEqual(r.fetches.map(f=>f.src),[a.src,c.src]);
 slow.resolve(new ArrayBuffer(1));await tick();assert.equal(r.fetches.filter(f=>f.src===b.src).length,1);await r.session.dispose();
});
test('one fetch/decode serves warm, play and replay; timing reports cold wait versus warmed start',async()=>{
 const slow=gate(),r=rig({fetchClip:()=>slow.promise});await r.session.unlock();r.session.warm([a]);const p=r.session.createChannel();p.set(a,on);
 r.setClock(850);slow.resolve(new ArrayBuffer(1));await tick();assert.equal(p.status,'playing');assert.equal(p.startupMs,850);assert.equal(r.fetches.length,1);
 p.replay();await tick();assert.equal(p.startupMs,0);assert.equal(r.fetches.length,1);await r.session.dispose();
});
test('rapid next ignores a late old load, with no late old voice or status overwrite',async()=>{
 const slow=gate(),r=rig({fetchClip:src=>src===a.src?slow.promise:Promise.resolve(new ArrayBuffer(1))});await r.session.unlock();
 const p=r.session.createChannel();p.set(a,on);p.set(b,on);await tick();assert.equal(p.status,'playing');assert.equal(r.spoken().length,1);
 slow.resolve(new ArrayBuffer(1));await tick();assert.equal(p.status,'playing');assert.equal(r.spoken().length,1);await r.session.dispose();
});
test('pause resumes the same cursor, and volume/typing renders never restart a playing line',async()=>{
 const r=rig();await r.session.unlock();const p=r.session.createChannel();p.set(a,on);await tick();
 const first=r.spoken()[0];r.contexts[0].currentTime=2.25;
 p.set(a,{...on,paused:true});assert.equal(p.status,'paused');assert.ok(first.stopped);
 p.set(a,on);await tick();const second=r.spoken()[1];assert.equal(second.offset,2.25);
 for(let i=0;i<40;i++)p.set({...a},{...on,volume:.3});
 assert.equal(r.spoken().length,2);assert.equal(second.connections[0].gain.value,.3);assert.equal(r.fetches.length,1);await r.session.dispose();
});
test('pause while loading cannot cause a late start; resume uses the already decoded buffer',async()=>{
 const slow=gate(),r=rig({fetchClip:()=>slow.promise});await r.session.unlock();const p=r.session.createChannel();p.set(a,on);p.set(a,{...on,paused:true});
 slow.resolve(new ArrayBuffer(1));await tick();assert.equal(p.status,'paused');assert.equal(r.spoken().length,0);
 p.set(a,on);await tick();assert.equal(p.status,'playing');assert.equal(r.fetches.length,1);await r.session.dispose();
});
test('muted/disabled voices do not fetch, and muting during loading prevents a late source',async()=>{
 const slow=gate(),r=rig({fetchClip:()=>slow.promise});await r.session.unlock();const p=r.session.createChannel();
 p.set(a,{...on,volume:0});p.set(a,{...on,enabled:false});assert.equal(r.fetches.length,0);assert.equal(p.replay(),false);
 p.set(a,on);p.set(a,{...on,volume:0});slow.resolve(new ArrayBuffer(1));await tick();assert.equal(r.spoken().length,0);assert.equal(p.status,'ready');await r.session.dispose();
});
test('narrator, scene exit and disposal retire sources and ignore their old ended callbacks',async()=>{
 const r=rig();await r.session.unlock();const states=[],p=r.session.createChannel(s=>states.push(s));p.set(a,on);await tick();const first=r.spoken()[0],ended=first.onended;
 p.set(null,on);assert.equal(p.status,'idle');assert.ok(first.stopped);ended();assert.equal(p.status,'idle');
 p.set(b,on);await tick();const count=states.length;p.dispose();r.spoken().at(-1).onended?.();assert.equal(states.length,count);await r.session.dispose();assert.equal(r.contexts[0].state,'closed');
});
test('a missing optional clip does not loop on renders; replay can explicitly retry and next can continue',async()=>{
 let fail=true;const r=rig({fetchClip:async src=>{if(src===a.src&&fail)throw new Error('404');return new ArrayBuffer(1);}});await r.session.unlock();const p=r.session.createChannel();p.set(a,on);await tick();assert.equal(p.status,'unavailable');
 for(let i=0;i<20;i++)p.set(a,on);assert.equal(r.fetches.length,1);
 fail=false;p.replay();await tick();assert.equal(p.status,'playing');assert.equal(r.fetches.length,2);p.set(b,on);await tick();assert.equal(p.status,'playing');await r.session.dispose();
});
test('hidden/portrait stop defeats a pending unlock and cannot resurrect a line after returning',async()=>{
 const unlock=gate(),r=rig();r.setResumeGate(unlock.promise);const initial=r.session.unlock();const p=r.session.createChannel();p.set(a,on);await r.session.suspend();
 unlock.resolve();await assert.rejects(initial,/enable audio/);await tick();assert.equal(p.status,'idle');assert.equal(r.spoken().length,0);
 r.setResumeGate(null);await r.session.unlock();p.set(b,on);await tick();assert.equal(p.status,'playing');assert.equal(r.spoken().length,1);await r.session.dispose();
});
test('disposing aborts outstanding network work; an uncooperative late result cannot decode or play',async()=>{
 const slow=gate(),r=rig({fetchClip:()=>slow.promise});await r.session.unlock();const states=[],p=r.session.createChannel(s=>states.push(s));p.set(a,on);await tick();
 await r.session.dispose();assert.equal(r.fetches[0].signal.aborted,true);const count=states.length;
 slow.resolve(new ArrayBuffer(1));await tick();assert.equal(states.length,count);assert.equal(r.spoken().length,0);assert.equal(r.contexts[0].decodes,0);
});
test('decoded look-ahead is bounded and evicts old clips without affecting a playing source',async()=>{
 const r=rig({maxDecodedBytes:800});await r.session.unlock();const p=r.session.createChannel();p.set(a,on);await tick();
 await r.session.load(b.src);await r.session.load('/c.mp3');assert.equal(r.session.cachedClips,2);assert.equal(p.status,'playing');assert.equal(r.spoken()[0].stopped,undefined);
 await r.session.load(a.src);assert.equal(r.fetches.filter(f=>f.src===a.src).length,2);await r.session.dispose();
});
test('a stalled decoder times out too; its late result cannot start speech or enter the cache',async()=>{
 const r=rig();await r.session.unlock();const decoding=gate();r.contexts[0].decodeAudioData=()=>decoding.promise;
 const original={setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout},timers=new Map();let id=0;
 globalThis.setTimeout=fn=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=key=>timers.delete(key);
 try{
  const p=r.session.createChannel();p.set(a,on);await tick();assert.equal(timers.size,1);[...timers.values()][0]();await tick();
  assert.equal(p.status,'unavailable');assert.equal(timers.size,0);
  decoding.resolve({length:100,numberOfChannels:1,duration:10});await tick();assert.equal(r.spoken().length,0);assert.equal(r.session.cachedClips,0);
 }finally{await r.session.dispose();Object.assign(globalThis,original);}
});

test('receiver routing narrows speech gently and folds it to mono without bypassing the voice volume',async()=>{
 const r=rig();await r.session.unlock();const ctx=r.contexts[0],source=ctx.createBufferSource(),output=ctx.createGain();
 const cleanup=connectVoiceTreatment(ctx,source,output,'telephone'),[high,low]=ctx.filters;
 assert.equal(ctx.filters.length,2);assert.equal(high.type,'highpass');assert.equal(high.frequency.value,300);
 assert.equal(low.type,'lowpass');assert.equal(low.frequency.value,3500);
 // Per Web Audio, low/highpass resonance is in dB, unlike the linear-Q preview.
 for(const filter of [high,low])assert.ok(Math.abs(10**(filter.Q.value/20)-.55)<1e-7,'runtime response must match the approved preview, without a resonant peak');
 assert.equal(high.channelCount,1);assert.equal(high.channelCountMode,'explicit');
 assert.deepEqual(source.connections,[high]);assert.deepEqual(high.connections,[low]);assert.deepEqual(low.connections,[output]);
 cleanup();cleanup();assert.deepEqual(high.connections,[]);assert.deepEqual(low.connections,[]);await r.session.dispose();
});

test('letters and in-room voices use the original direct path without allocating filters',async()=>{
 assert.equal(voiceTreatmentFor('letter'),'natural');assert.equal(voiceTreatmentFor('room'),'natural');assert.equal(voiceTreatmentFor('phone'),'telephone');
 const r=rig();await r.session.unlock();const ctx=r.contexts[0],source=ctx.createBufferSource(),output=ctx.createGain();
 connectVoiceTreatment(ctx,source,output,'natural')();assert.equal(ctx.filters.length,0);assert.deepEqual(source.connections,[output]);await r.session.dispose();
});

test('telephone and room performances reuse the exact same decoded clip and persisted URL',async()=>{
 const r=rig();await r.session.unlock();const p=r.session.createChannel();p.set(a,{...on,treatment:'telephone'});await tick();
 const phone=r.spoken()[0],ctx=r.contexts[0],output=ctx.filters[1].connections[0];assert.equal(output.gain.value,on.volume);assert.deepEqual(output.connections,[ctx.destination]);
 for(let i=0;i<25;i++)p.set({...a},{...on,treatment:'telephone',volume:.4});
 assert.equal(r.spoken().length,1);assert.equal(output.gain.value,.4);assert.equal(ctx.filters.length,2);
 p.dispose();assert.deepEqual(ctx.filters.map(n=>n.connections),[[],[]]);assert.deepEqual(output.connections,[]);
 const room=r.session.createChannel();room.set(a,on);await tick();assert.equal(r.spoken()[1].buffer,phone.buffer);assert.equal(ctx.filters.length,2);
 assert.deepEqual(r.fetches.map(f=>f.src),[a.src]);assert.equal(ctx.decodes,1);await r.session.dispose();
});

test('pausing a phone line releases its filters; resume retains the cursor and replay starts at zero',async()=>{
 const r=rig();await r.session.unlock();const p=r.session.createChannel(),phone={...on,treatment:'telephone'};p.set(a,phone);await tick();
 const ctx=r.contexts[0];ctx.currentTime=2.25;p.set(a,{...phone,paused:true});assert.equal(p.status,'paused');assert.ok(r.spoken()[0].stopped);assert.ok(ctx.filters.every(n=>!n.connections.length));
 p.set(a,phone);await tick();assert.equal(r.spoken()[1].offset,2.25);assert.equal(ctx.filters.length,4);assert.equal(r.fetches.length,1);
 p.replay();await tick();assert.equal(r.spoken()[2].offset,0);assert.equal(r.fetches.length,1);assert.ok(ctx.filters.slice(0,4).every(n=>!n.connections.length));await r.session.dispose();assert.ok(ctx.filters.every(n=>!n.connections.length));
});

test('switching the channel of the same clip keeps its position and cannot leak the receiver into a room',async()=>{
 const r=rig();await r.session.unlock();const p=r.session.createChannel();p.set(a,on);await tick();const ctx=r.contexts[0];ctx.currentTime=1.5;
 p.set(a,{...on,treatment:'telephone'});await tick();assert.equal(r.spoken()[1].offset,1.5);assert.ok(r.spoken()[0].stopped);
 const oldEnded=r.spoken()[1].onended;ctx.currentTime=2;p.set(a,on);await tick();const room=r.spoken()[2];assert.equal(room.offset,2);assert.equal(room.connections[0].gain.value,on.volume);
 assert.ok(ctx.filters.every(n=>!n.connections.length));oldEnded();assert.equal(p.status,'playing');assert.equal(room.stopped,undefined);assert.equal(r.fetches.length,1);await r.session.dispose();
});

test('a naturally ended phone line disconnects its whole graph and replay rebuilds it from memory',async()=>{
 const r=rig();await r.session.unlock();const p=r.session.createChannel();p.set(a,{...on,treatment:'telephone'});await tick();const source=r.spoken()[0],ctx=r.contexts[0],output=ctx.filters[1].connections[0];
 source.onended();assert.equal(p.status,'ended');assert.deepEqual(source.connections,[]);assert.ok(ctx.filters.every(n=>!n.connections.length));assert.deepEqual(output.connections,[]);
 p.replay();await tick();assert.equal(p.status,'playing');assert.equal(r.spoken()[1].offset,0);assert.equal(r.fetches.length,1);await r.session.dispose();
});

test('skipping a loading phone line never builds its old filters or overlays the next room voice',async()=>{
 const slow=gate(),r=rig({fetchClip:src=>src===a.src?slow.promise:Promise.resolve(new ArrayBuffer(1))});await r.session.unlock();const p=r.session.createChannel();
 p.set(a,{...on,treatment:'telephone'});p.set(b,on);await tick();assert.equal(p.status,'playing');slow.resolve(new ArrayBuffer(1));await tick();
 assert.equal(r.spoken().length,1);assert.equal(r.contexts[0].filters.length,0);assert.equal(p.status,'playing');await r.session.dispose();
});

test('a channel change while loading applies only the latest treatment without another request',async()=>{
 const slow=gate(),r=rig({fetchClip:()=>slow.promise});await r.session.unlock();const p=r.session.createChannel();p.set(a,{...on,treatment:'telephone'});p.set(a,on);
 slow.resolve(new ArrayBuffer(1));await tick();assert.equal(p.status,'playing');assert.equal(r.contexts[0].filters.length,0);assert.equal(r.fetches.length,1);await r.session.dispose();
});

test('muting or disabling a playing phone line clears every filter, and zero volume cannot replay it',async()=>{
 for(const change of [{volume:0},{enabled:false}]){
  const r=rig();await r.session.unlock();const p=r.session.createChannel(),phone={...on,treatment:'telephone'};p.set(a,phone);await tick();const source=r.spoken()[0],ended=source.onended;
  p.set(a,{...phone,...change});assert.equal(p.status,'ready');assert.ok(source.stopped);assert.ok(r.contexts[0].filters.every(n=>!n.connections.length));assert.equal(p.replay(),false);ended();assert.equal(p.status,'ready');await r.session.dispose();
 }
});

test('hiding, portrait suspension and unmount cannot leave a telephone graph or revive its old ended callback',async()=>{
 const r=rig();await r.session.unlock();const p=r.session.createChannel();p.set(a,{...on,treatment:'telephone'});await tick();const ended=r.spoken()[0].onended;
 await r.session.suspend();assert.equal(p.status,'idle');assert.ok(r.spoken()[0].stopped);assert.ok(r.contexts[0].filters.every(n=>!n.connections.length));
 await r.session.unlock();p.set(b,on);await tick();ended();assert.equal(p.status,'playing');assert.equal(r.spoken().length,2);p.dispose();assert.ok(r.spoken()[1].stopped);await r.session.dispose();
});

test('partial receiver setup failure releases its nodes and remains a non-blocking, manually retryable failure',async()=>{
 const r=rig();await r.session.unlock();const ctx=r.contexts[0],create=ctx.createBiquadFilter.bind(ctx);ctx.createBiquadFilter=()=>{if(ctx.filters.length===1)throw new Error('node allocation');return create();};
 const p=r.session.createChannel();p.set(a,{...on,treatment:'telephone'});await tick();assert.equal(p.status,'unavailable');assert.equal(r.spoken().length,0);assert.ok(ctx.filters.every(n=>!n.connections.length));
 for(let i=0;i<10;i++)p.set(a,{...on,treatment:'telephone'});assert.equal(ctx.filters.length,1);
 ctx.createBiquadFilter=create;p.replay();await tick();assert.equal(p.status,'playing');assert.equal(r.fetches.length,1);await r.session.dispose();
});

function cacheRig(t,body){
 const original={fetch:globalThis.fetch,caches:globalThis.caches,crypto:globalThis.crypto},hash=createHash('sha256').update(body).digest('hex'),src='/audio/dialogue/cheng.'+'a'.repeat(12)+'.'+hash.slice(0,12)+'.mp3';
 const map=new Map(),writes=[],fetches=[];
 Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
 globalThis.caches={async open(name){return{async match(key){return map.get(key)?.clone();},async delete(key){return map.delete(key);},async put(key,response){writes.push({name,key});map.set(key,response.clone());}};}};
 globalThis.fetch=async url=>{fetches.push(url);return new Response(body,{headers:{'Content-Type':'audio/mpeg'}});};
 t.after(()=>{globalThis.fetch=original.fetch;globalThis.caches=original.caches;Object.defineProperty(globalThis,'crypto',{value:original.crypto,configurable:true});});
 return{src,map,writes,fetches,signal:new AbortController().signal};
}
test('already saved voices play without a controlling worker or network request',async t=>{
 const body=Buffer.from('spoken file'),r=cacheRig(t,body);r.map.set(r.src,new Response(body,{headers:{'Content-Type':'audio/mpeg'}}));
 assert.equal(Buffer.from(await fetchVoiceClip(r.src,r.signal)).toString(),body.toString());assert.equal(r.fetches.length,0);assert.equal(r.writes.length,0);
});
test('online scene warming verifies bytes and persists just the clip, without claiming the whole pack is complete',async t=>{
 const body=Buffer.from('spoken file'),r=cacheRig(t,body);
 await fetchVoiceClip(r.src,r.signal);await fetchVoiceClip(r.src,r.signal);
 assert.equal(r.fetches.length,1);assert.equal(r.writes.length,1);assert.equal(r.writes[0].key,r.src);assert.match(r.writes[0].name,/voice-v1$/);assert.ok(![...r.map.keys()].some(k=>k.includes('complete')));
});
test('corrupt cached audio is repaired from the network; HTML and hash-mismatched payloads are never kept',async t=>{
 const body=Buffer.from('spoken file'),r=cacheRig(t,body);r.map.set(r.src,new Response('broken',{headers:{'Content-Type':'audio/mpeg'}}));await fetchVoiceClip(r.src,r.signal);assert.equal(r.fetches.length,1);
 r.map.clear();globalThis.fetch=async()=>new Response('<html>missing</html>',{headers:{'Content-Type':'text/html'}});
 await assert.rejects(fetchVoiceClip(r.src,r.signal),/not audio/);assert.equal(r.map.size,0);
 globalThis.fetch=async()=>new Response('wrong',{headers:{'Content-Type':'audio/mpeg'}});
 await assert.rejects(fetchVoiceClip(r.src,r.signal),/fingerprint/);assert.equal(r.map.size,0);
});
