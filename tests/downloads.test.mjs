import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {prepareOffline,validOfflineManifest,hasOfflinePack} from '../.sites-runtime/test-modules/offline.mjs';
import {fetchOfflineBytes} from '../.sites-runtime/test-modules/offline-transfer.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function setup(t,{bundle=true,count=12}={}){
 const bodies=new Map(Array.from({length:count},(_,i)=>[`/art/runtime/scene-${i}.webp`,Buffer.from(('image-'+i+'-').repeat(10))]));
 const files=[...bodies].map(([url,b])=>({url,bytes:b.length,sha256:hash(b),group:'media'})),version='6'.repeat(20),m={buildId:'7'.repeat(20),version,base:'/',totalBytes:files.reduce((n,f)=>n+f.bytes,0),shellCache:'aequilibrium:%2F:shell:'+version,mediaCache:'aequilibrium:%2F:media:'+version,completeMarker:'/__offline_complete__',files};
 const packed=Buffer.concat([...bodies.values()]);let offset=0;
 if(bundle){m.bundles=[{url:'/offline/art-'+hash(packed).slice(0,20)+'.bin',sha256:hash(packed),bytes:packed.length,files:files.map(f=>{const r={url:f.url,offset};offset+=f.bytes;return r;})}];bodies.set(m.bundles[0].url,packed);}
 const stores=new Map(),fetches=[];let active=0,peak=0,mode='normal';
 const caches={async keys(){return [...stores.keys()];},async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return{async match(url){return data.get(url)?.clone();},async put(url,response){data.set(url,response.clone());},async delete(url){return data.delete(url);},async keys(){return[...data.keys()].map(url=>new Request('https://test.invalid'+url));}};}};
 const fetch=async(url,init)=>{fetches.push(url);active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,mode==='slow'?100:3));active--;if(mode==='bad-bundle'&&url.endsWith('.bin'))return new Response(Buffer.alloc(packed.length));if(mode==='bad-everything')return new Response(Buffer.alloc(bodies.get(url).length));init.signal.throwIfAborted();return new Response(bodies.get(url));};
 for(const [key,value]of Object.entries({window:{caches},caches,crypto:webcrypto,navigator:{storage:{persist:async()=>false}},fetch})){const d=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{configurable:true,value});t.after(()=>d?Object.defineProperty(globalThis,key,d):delete globalThis[key]);}
 return{m,bodies,stores,fetches,caches,setMode:v=>mode=v,peak:()=>peak};
}
test('new artwork blocks save individually verified resources with one network request',async t=>{
 const f=setup(t),progress=[];assert.ok(validOfflineManifest(f.m));await prepareOffline(f.m,new AbortController().signal,p=>progress.push(p));assert.deepEqual(f.fetches,[f.m.bundles[0].url]);assert.equal(progress.at(-1).completed,12);assert.equal(progress.at(-1).bytes,f.m.totalBytes);assert.ok(await hasOfflinePack(f.m));
 for(const file of f.m.files)assert.equal(hash(Buffer.from(await f.stores.get(f.m.mediaCache).get(file.url).clone().arrayBuffer())),file.sha256);
});
test('bad block falls back to individual images and never trusts its container hash alone',async t=>{
 const f=setup(t);f.setMode('bad-bundle');await prepareOffline(f.m,new AbortController().signal,()=>{});assert.equal(f.fetches.length,13);assert.ok(await hasOfflinePack(f.m));
 f.stores.get(f.m.mediaCache).clear();f.fetches.length=0;f.setMode('bad-everything');await assert.rejects(prepareOffline(f.m,new AbortController().signal,()=>{}),/校验/);assert.equal(await hasOfflinePack(f.m),false);
});
test('bundle path, duplicate members, offsets and per-file hashes remain constrained',async t=>{
 const {m}=setup(t);for(const change of [b=>b.url='https://outside.invalid/art.bin',b=>b.url='/offline/../art.bin',b=>b.files[1].offset++,b=>b.files.push(b.files[0]),b=>b.bytes++,b=>b.files[0].url='/unlisted.webp']){const copy=structuredClone(m);change(copy.bundles[0]);assert.equal(validOfflineManifest(copy),false);}
 const missing=structuredClone(m);missing.files[0].sha256='0'.repeat(64);assert.ok(validOfflineManifest(missing));await assert.rejects(prepareOffline(missing,new AbortController().signal,()=>{}),/清单/);
});
test('updates reuse old verified artwork without downloading an almost-complete block',async t=>{
 const f=setup(t);const old=await f.caches.open('aequilibrium:%2F:media:prior');for(const file of f.m.files.slice(1))await old.put(file.url,new Response(f.bodies.get(file.url)));await prepareOffline(f.m,new AbortController().signal,()=>{});assert.deepEqual(f.fetches,[f.m.files[0].url]);assert.equal(f.stores.get('aequilibrium:%2F:media:prior').size,11);assert.ok(await hasOfflinePack(f.m));
});
test('pause preserves finished files and the next attempt downloads only missing work',async t=>{
 const f=setup(t,{bundle:false,count:10});f.setMode('slow');const controller=new AbortController();await assert.rejects(prepareOffline(f.m,controller.signal,p=>{if(p.completed>=4)controller.abort();}),/abort/i);assert.equal(await hasOfflinePack(f.m),false);const kept=f.stores.get(f.m.mediaCache).size,oldFetches=f.fetches.length;assert.ok(kept>=4&&kept<10);await prepareOffline(f.m,new AbortController().signal,()=>{});assert.equal(f.fetches.length-oldFetches,10-kept);assert.ok(await hasOfflinePack(f.m));assert.ok(f.peak()<=4);
});
test('media begins while entry installation is pending; completion still waits for entry',async t=>{
 const f=setup(t);let release;const entry=new Promise(r=>release=r);let done=false;const downloading=prepareOffline(f.m,new AbortController().signal,()=>{},{shellReady:entry}).then(()=>{done=true;});await new Promise(r=>setTimeout(r,40));assert.ok(f.fetches.length>0);assert.equal(done,false);assert.equal(await hasOfflinePack(f.m),false);release();await downloading;assert.ok(await hasOfflinePack(f.m));
});
test('entry installation failure aborts preparation without writing a complete marker',async t=>{
 const f=setup(t);await assert.rejects(prepareOffline(f.m,new AbortController().signal,()=>{},{shellReady:Promise.reject(new Error('entry failed'))}),/entry failed/);assert.equal(await hasOfflinePack(f.m),false);
});
test('stream progress advances inside a file and transient failures retry automatically',async t=>{
 setup(t,{bundle:false,count:1});let requests=0;Object.defineProperty(globalThis,'fetch',{configurable:true,value:async()=>{requests++;if(requests===1)return new Response('busy',{status:503});return new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2]));setTimeout(()=>{c.enqueue(new Uint8Array([3,4]));c.close();},10);}}));}});const values=[];const body=await fetchOfflineBytes('/stream.bin',4,new AbortController().signal,n=>values.push(n));assert.deepEqual([...body],[1,2,3,4]);assert.equal(requests,2);assert.ok(values.includes(2)&&values.includes(4));
});
