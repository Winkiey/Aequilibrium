import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {prepareVoices,hasVoicePack} from '../.sites-runtime/test-modules/voice-pack.mjs';
import {validOfflineManifest,hasOfflinePack} from '../.sites-runtime/test-modules/offline.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function setup(t){
 const bodies=new Map(Array.from({length:9},(_,i)=>{const b=Buffer.from(('spoken-'+i).repeat(12));return['/audio/dialogue/cheng.'+String(i).repeat(12)+'.'+hash(b).slice(0,12)+'.mp3',b];}));
 const voiceFiles=[...bodies].map(([url,b])=>({url,bytes:b.length,sha256:hash(b),group:'media'}));
 const first={...voiceFiles[0]},version='a'.repeat(20),prefix='aequilibrium:%2F:';
 const m={base:'/',version,shellCache:prefix+'shell:'+version,mediaCache:prefix+'media:'+version,completeMarker:'/__offline_complete__',files:[first],totalBytes:first.bytes,voice:{version:'b'.repeat(20),cache:prefix+'voice-v1',marker:'/__voice_complete__',files:voiceFiles,totalBytes:voiceFiles.reduce((n,f)=>n+f.bytes,0)}};
 const stores=new Map(),fetches=[];let bad=false,slow=false,peak=0,active=0;
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return{async match(url){return store.get(url)?.clone();},async put(url,response){store.set(url,response.clone());},async delete(url){return store.delete(url);}};}};
 const fetch=async(url,{signal})=>{fetches.push(url);active++;peak=Math.max(peak,active);try{await new Promise(r=>setTimeout(r,slow?30:1));signal.throwIfAborted();return new Response(bad?Buffer.alloc(bodies.get(url).length):bodies.get(url));}finally{active--;}};
 for(const[key,value]of Object.entries({window:{caches},caches,crypto:webcrypto,fetch})){const d=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{configurable:true,value});t.after(()=>d?Object.defineProperty(globalThis,key,d):delete globalThis[key]);}
 return{m,bodies,stores,fetches,caches,setBad:v=>bad=v,setSlow:v=>slow=v,peak:()=>peak};
}
test('optional voices validate their own namespace and do not decide base completeness',async t=>{
 const f=setup(t);assert.ok(validOfflineManifest(f.m));const cache=await f.caches.open(f.m.mediaCache);await cache.put(f.m.files[0].url,new Response(f.bodies.get(f.m.files[0].url)));await cache.put(f.m.completeMarker,new Response(JSON.stringify({version:f.m.version,complete:true})));
 assert.equal(await hasOfflinePack(f.m),true);assert.equal(await hasVoicePack(f.m),false);
 for(const change of [v=>v.cache='other-site',v=>v.marker='/elsewhere',v=>v.totalBytes++,v=>v.files.push(v.files[0]),v=>v.files[0].url='https://outside.invalid/a.mp3',v=>v.files[0].url='/audio/dialogue/../escape.mp3',v=>v.files[0].sha256='z'.repeat(64)]){const copy=structuredClone(f.m);change(copy.voice);assert.equal(validOfflineManifest(copy),false);}
 const copy=structuredClone(f.m);copy.voice.files[0].sha256='0'.repeat(64);assert.equal(validOfflineManifest(copy),false,'core and optional entries cannot disagree');
});
test('voices verify every file, reuse opening audio, and retain correct MP3 MIME',async t=>{
 const f=setup(t),core=await f.caches.open(f.m.mediaCache);await core.put(f.m.files[0].url,new Response(f.bodies.get(f.m.files[0].url)));const progress=[];
 await prepareVoices(f.m,new AbortController().signal,p=>progress.push(p));assert.equal(await hasVoicePack(f.m),true);assert.equal(f.fetches.length,8);assert.equal(progress.at(-1).reused,1);assert.ok(f.peak()<=4);
 for(const file of f.m.voice.files){const response=f.stores.get(f.m.voice.cache).get(file.url);assert.equal(response.headers.get('Content-Type'),'audio/mpeg');assert.equal(hash(Buffer.from(await response.clone().arrayBuffer())),file.sha256);}
 const newer=structuredClone(f.m);newer.version='c'.repeat(20);newer.shellCache='aequilibrium:%2F:shell:'+newer.version;newer.mediaCache='aequilibrium:%2F:media:'+newer.version;
 f.fetches.length=0;await prepareVoices(newer,new AbortController().signal,()=>{});assert.equal(f.fetches.length,0,'unchanged voices survive a game-only update');
});
test('interrupted voices keep completed clips and never publish a false completion marker',async t=>{
 const f=setup(t);f.setSlow(true);const abort=new AbortController();await assert.rejects(prepareVoices(f.m,abort.signal,p=>{if(p.completed>=3)abort.abort();}),/abort/i);
 assert.equal(await hasVoicePack(f.m),false);await new Promise(r=>setTimeout(r,40));const kept=f.stores.get(f.m.voice.cache).size;assert.ok(kept>=3&&kept<9);f.fetches.length=0;
 await prepareVoices(f.m,new AbortController().signal,()=>{});assert.equal(await hasVoicePack(f.m),true);assert.equal(f.fetches.length,9-kept);
});
test('corrupt voices are repaired individually and failed repairs leave the base game alone',async t=>{
 const f=setup(t);await prepareVoices(f.m,new AbortController().signal,()=>{});const file=f.m.voice.files[2];f.stores.get(f.m.voice.cache).set(file.url,new Response('corrupt'));
 f.fetches.length=0;await prepareVoices(f.m,new AbortController().signal,()=>{});assert.deepEqual(f.fetches,[file.url]);
 f.stores.get(f.m.voice.cache).delete(file.url);f.setBad(true);await assert.rejects(prepareVoices(f.m,new AbortController().signal,()=>{}),/校验/);assert.equal(await hasVoicePack(f.m),false);assert.equal(f.stores.get(f.m.voice.cache).has(f.m.voice.files[1].url),true);
});
