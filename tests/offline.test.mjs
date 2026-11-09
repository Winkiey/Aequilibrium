import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {buildOffline} from '../scripts/build-offline.mjs';

const origin='https://offline-test.invalid';
async function fixture(t,registry){
 const root=await mkdtemp(join(tmpdir(),'aequilibrium-offline-'));t.after(async()=>{const target=resolve(root);assert.ok(target.startsWith(resolve(tmpdir())+sep)&&basename(target).startsWith('aequilibrium-offline-'));await rm(target,{recursive:true,force:true});});
 const input={
  'lib/game/assets.generated.ts':`export const ASSETS = ${JSON.stringify(registry??{'/art/backgrounds/master.webp':{src:'/art/runtime/scene.hash.webp',small:{src:'/art/runtime/scene-small.hash.webp'}}})} as const;`,
  'components/game/OpeningFilm.tsx':"const film=publicPath('/video/prologue.mp4');",
  'dist-pages/index.html':'<!doctype html><title>home</title>',
  'dist-pages/playtest/index.html':'<!doctype html><title>independent-playtest</title>',
  'dist-pages/assets/entry.hash.js':'console.log("entry")',
  'dist-pages/assets/lazy.hash.js':'console.log("lazy")',
  'dist-pages/assets/style.hash.css':'body{color:#123}',
  'dist-pages/fonts/fonts.css':'@font-face{}','dist-pages/fonts/font.woff2':'fake-font','dist-pages/fonts/OFL.txt':'font-license',
  'dist-pages/art/runtime/scene.hash.webp':'runtime-large','dist-pages/art/runtime/scene-small.hash.webp':'runtime-small',
  'dist-pages/art/backgrounds/master.webp':'not-runtime','dist-pages/video/prologue.mp4':'abcdef012345',
  'dist-pages/video/rejected-pilot.mp4':'not-used','dist-pages/favicon.svg':'<svg/>',
 };
 for(const [name,body] of Object.entries(input)){const path=join(root,name);await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,body);}
 const manifest=await buildOffline(root);const sw=await readFile(join(root,'dist-pages/sw.js'),'utf8');
 return{root,manifest,sw};
}
async function worker(fixture,{broken,networkAvailable=true,windows=[],legacy=false}={}){
 const handlers=new Map(),stores=new Map(),network=[],mutations=[],activation={skips:0,claims:0};
 const key=input=>new URL(typeof input==='string'?input:input.url,origin).href;
 const caches={
  async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return{
   async match(input){return store.get(key(input))?.clone();},
   async put(input,response){assert.equal(response.status,200);await response.clone().arrayBuffer();store.set(key(input),response.clone());},
  };},
  async keys(){return[...stores.keys()];},async delete(name){mutations.push(name);throw new Error('Deleting cache is not authorised');},
 };
 const fetch=async input=>{
  const url=key(input),path=new URL(url).pathname;network.push({url,range:input.headers?.get('Range'),cache:input.cache});
  if(!networkAvailable)throw new TypeError('offline');
  if(path===fixture.manifest.base+'release.json')return new Response(await readFile(join(fixture.root,'dist-pages/release.json'),'utf8'),{status:200});
  if(path===fixture.manifest.base+'update/')return new Response('<title>updater</title>',{status:200});
  const entry=fixture.manifest.files.find(file=>file.url===path);if(!entry)return new Response('network-only',{status:404});
  const relative=path.slice(fixture.manifest.base.length);const body=await readFile(join(fixture.root,'dist-pages',relative));
  const payload=Buffer.from(body);if(path===broken)payload[0]^=1;
  return new Response(payload,{status:200,headers:{'Content-Type':path.endsWith('.mp4')?'video/mp4':path.endsWith('.html')?'text/html':'application/octet-stream'}});
 };
 const context=vm.createContext({self:{location:{origin},addEventListener:(type,fn)=>handlers.set(type,fn),async skipWaiting(){activation.skips++;},clients:{async matchAll(){return windows;},async claim(){activation.claims++;}}},caches,fetch,crypto:webcrypto,Request,Response,Headers,URL,Uint8Array,Map,Set,console});
 const script=legacy?(await readFile('tests/fixtures/offline-worker-v1.txt','utf8')).replace('/*__OFFLINE_MANIFEST__*/',JSON.stringify(fixture.manifest)):fixture.sw;
 vm.runInContext(script,context,{filename:'generated-sw.js'});
 return{
  stores,network,mutations,caches,handlers,activation,
  async install(){let pending;handlers.get('install')({waitUntil(value){pending=value;}});await pending;},
  async activate(){let pending;handlers.get('activate')?.({waitUntil(value){pending=value;}});await pending;},
  async message(data,source=origin+fixture.manifest.base+'update/'){let pending,result;handlers.get('message')({data,source:{url:source},ports:[{postMessage(value){result=value;}}],waitUntil(value){pending=value;}});await pending;return result;},
  async request(path,{range,mode='cors',method='GET'}={}){let result;const headers=new Headers();if(range)headers.set('Range',range);handlers.get('fetch')({request:{url:new URL(path,origin).href,method,mode,headers},respondWith(value){result=value;}});return result===undefined?undefined:await result;},
 };
}

test('offline build includes every runtime variant and lazy shell chunk, while excluding masters and unused films',async t=>{
 const f=await fixture(t),m=f.manifest;assert.equal(m.base,'/Aequilibrium/');assert.equal(m.files.length,new Set(m.files.map(file=>file.url)).size);
 assert.ok(m.files.every(file=>file.url.startsWith(m.base)&&file.bytes>0&&/^[a-f0-9]{64}$/.test(file.sha256)));
 assert.equal(m.totalBytes,m.files.reduce((n,file)=>n+file.bytes,0));
 for(const suffix of ['art/runtime/scene.hash.webp','art/runtime/scene-small.hash.webp','assets/lazy.hash.js','fonts/OFL.txt','video/prologue.mp4','playtest/index.html','manifest.webmanifest'])assert.ok(m.files.some(file=>file.url===m.base+suffix),suffix);
 assert.ok(!m.files.some(file=>/master|rejected-pilot/.test(file.url)));
 const again=await buildOffline(f.root);assert.equal(again.version,m.version,'unchanged inputs produce the same package version');
 const app=JSON.parse(await readFile(join(f.root,'dist-pages/manifest.webmanifest'),'utf8'));assert.equal(app.scope,m.base);assert.equal(app.start_url,m.base);assert.equal(app.orientation,'landscape');
});
test('offline build rejects external paths, encoded traversal and output traversal',async t=>{
 for(const src of ['https://outside.invalid/art.webp','//outside.invalid/a.webp','/art/runtime/../escape.webp','/art/runtime/%2e%2e/escape.webp','/art/runtime/back\\slash.webp']){
  await assert.rejects(fixture(t,{unsafe:{src}}),/Unsafe|Only generated/);
 }
 const f=await fixture(t);await assert.rejects(buildOffline(f.root,{directory:'../escape'}),/Unsafe/);await assert.rejects(buildOffline(f.root,{base:'/Aequilibrium/../'}),/Invalid/);
});
test('service worker installs a verified shell only and failed integrity keeps old versions intact',async t=>{
 const f=await fixture(t),w=await worker(f);await w.install();assert.equal(w.stores.get(f.manifest.shellCache).size,f.manifest.files.filter(file=>file.group==='shell').length);assert.ok(!w.stores.has(f.manifest.mediaCache));
 await w.activate();assert.equal(w.activation.skips,0);assert.equal(w.activation.claims,0);assert.deepEqual(w.mutations,[]);
 const bad=await worker(f,{broken:f.manifest.base+'assets/lazy.hash.js'});bad.stores.set('aequilibrium:older-version',new Map([['sentinel',new Response('old')]]));
 await assert.rejects(bad.install(),/integrity/);assert.ok(bad.stores.has('aequilibrium:older-version'));assert.deepEqual(bad.mutations,[]);
});
test('offline fetches respect origin/scope/method and never substitute HTML for a missing asset or unknown navigation',async t=>{
 const f=await fixture(t),w=await worker(f);await w.install();const off=await worker(f,{networkAvailable:false});off.stores.set(f.manifest.shellCache,w.stores.get(f.manifest.shellCache));
 assert.equal(await off.request('https://other.invalid/Aequilibrium/'),undefined);assert.equal(await off.request('/AnotherProject/'),undefined);assert.equal(await off.request('/Aequilibrium-other/'),undefined);assert.equal(await off.request('/Aequilibrium/',{method:'POST'}),undefined);
 const home=await off.request('/Aequilibrium/?resume=1',{mode:'navigate'});assert.equal(home.status,200);assert.ok((await home.text()).includes('<title>home'));
 const playtest=await off.request('/Aequilibrium/playtest/',{mode:'navigate'});assert.ok((await playtest.text()).includes('independent-playtest'));
 for(const path of ['/Aequilibrium/assets/missing.js','/Aequilibrium/unrecognised-route']){const response=await off.request(path,{mode:'navigate'});assert.equal(response.status,503);assert.ok(!(await response.text()).includes('<!doctype'));}
 const manifest=await off.request('/Aequilibrium/offline-manifest.json');assert.equal((await manifest.json()).version,f.manifest.version);
});
test('complete cached video supports prefix, suffix, open-ended, HEAD and invalid single ranges',async t=>{
 const f=await fixture(t),w=await worker(f,{networkAvailable:false}),url=f.manifest.base+'video/prologue.mp4';
 const cache=await w.caches.open(f.manifest.mediaCache);await cache.put(origin+url,new Response('abcdef012345',{status:200,headers:{'Content-Type':'video/mp4'}}));
 for(const [range,expected,contentRange] of [['bytes=0-2','abc','bytes 0-2/12'],['bytes=-4','2345','bytes 8-11/12'],['bytes=9-','345','bytes 9-11/12'],['bytes=10-999','45','bytes 10-11/12']]){
  const response=await w.request(url,{range});assert.equal(response.status,206);assert.equal(response.headers.get('Content-Range'),contentRange);assert.equal(response.headers.get('Content-Length'),String(expected.length));assert.equal(await response.text(),expected);
 }
 const head=await w.request(url,{range:'bytes=1-3',method:'HEAD'});assert.equal(head.status,206);assert.equal(await head.text(),'');assert.equal(head.headers.get('Content-Length'),'3');
 for(const range of ['bytes=12-','bytes=-0','bytes=5-2','bytes=0-1,3-4','bytes=-','nonsense']){const response=await w.request(url,{range});assert.equal(response.status,416);assert.equal(response.headers.get('Content-Range'),'bytes */12');}
 const missing=await worker(f);await missing.request(url,{range:'bytes=1-2'});assert.equal(missing.network[0].range,'bytes=1-2','uncached media forwards the original Range request');
});

test('a legacy worker keeps its coherent manifest but forwards the new update entry and release information',async t=>{
 const f=await fixture(t),old=await worker(f,{legacy:true});await old.install();
 await writeFile(join(f.root,'dist-pages/assets/style.hash.css'),'body{color:#987}');const next=await buildOffline(f.root);
 assert.notEqual(next.version,f.manifest.version);assert.equal((await(await old.request('/Aequilibrium/offline-manifest.json')).json()).version,f.manifest.version);
 assert.equal((await(await old.request('/Aequilibrium/release.json')).json()).version,next.version);
 assert.ok((await(await old.request('/Aequilibrium/update/',{mode:'navigate'})).text()).includes('updater'));
 const page=await readFile(join(f.root,'dist-pages/index.html'),'utf8');assert.ok(page.includes(`aequilibrium-build" content="${next.buildId}`));
});
test('activation is explicit, version-checked, complete and blocked while another game page is open',async t=>{
 const f=await fixture(t),windows=[{url:origin+'/Aequilibrium/playtest/'},{url:origin+'/Aequilibrium/update/'},{url:origin+'/AnotherProject/'}],w=await worker(f,{windows});await w.install();
 assert.equal((await w.message({type:'AEQUILIBRIUM_UPDATE_STATUS',version:f.manifest.version})).openGames,1);
 const blocked=await w.message({type:'AEQUILIBRIUM_ACTIVATE',version:f.manifest.version});assert.equal(blocked.blocked,true);assert.equal(w.activation.skips,0);
 assert.ok((await w.message({type:'AEQUILIBRIUM_ACTIVATE',version:'wrong'})).error);
 assert.ok((await w.message({type:'AEQUILIBRIUM_ACTIVATE',version:f.manifest.version},origin+'/AnotherProject/')).error);
 windows.shift();assert.ok((await w.message({type:'AEQUILIBRIUM_ACTIVATE',version:f.manifest.version})).error,'no complete marker');
 const media=await w.caches.open(f.manifest.mediaCache);
 for(const file of f.manifest.files.filter(f=>f.group==='media'))await media.put(file.url,new Response(await readFile(join(f.root,'dist-pages',file.url.slice(f.manifest.base.length)))));
 await media.put(f.manifest.completeMarker,new Response(JSON.stringify({version:f.manifest.version,complete:true})));
 const accepted=await w.message({type:'AEQUILIBRIUM_ACTIVATE',version:f.manifest.version});assert.equal(accepted.accepted,true);assert.equal(w.activation.skips,1);
 await w.activate();assert.equal(w.activation.claims,1);assert.deepEqual(w.mutations,[]);
});
test('release discovery always reaches the network without replacing the current offline manifest',async t=>{
 const f=await fixture(t),w=await worker(f);await w.install();
 await w.request('/Aequilibrium/release.json');assert.equal(w.network.at(-1).cache,'no-store');
 const current=await(await w.request('/Aequilibrium/offline-manifest.json')).json();assert.equal(current.version,f.manifest.version);
 const again=await buildOffline(f.root);assert.equal(again.buildId,f.manifest.buildId);assert.equal(again.version,f.manifest.version);
 assert.ok(!again.files.some(f=>f.url.endsWith('release.json')||f.url.endsWith('update/index.html')));
});
