import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {backupUpdateSaves,UPDATE_BACKUP_KEY,UPDATE_SAVE_KEYS,updatePageURL,updateReturnURL} from '../.sites-runtime/test-modules/updates.mjs';
import {latestOfflineManifest,prepareOffline} from '../.sites-runtime/test-modules/offline.mjs';
import {createGame,choose,SAVE_KEY} from '../.sites-runtime/test-modules/engine.mjs';
import {materialize,mainEvent} from '../.sites-runtime/test-modules/stories.mjs';
import {freshPresentation,PRESENTATION_KEY} from '../.sites-runtime/test-modules/presentation.mjs';
import {COLLECTION_KEY,freshCollection,recoverCollection} from '../.sites-runtime/test-modules/collection.mjs';
function storage(entries={}){const values=new Map(Object.entries(entries));return{values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
function globals(t,values){for(const [key,value]of Object.entries(values)){const descriptor=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{configurable:true,value});t.after(()=>descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key]);}}
test('updating snapshots preserves both save namespaces, reading cursor and earned collection without touching other apps',()=>{
 const start=createGame(101),event=materialize(mainEvent(start),start),game=choose(start,event,1,'main'),ui=freshPresentation(game);ui.reading={eventId:event.id,phase:'outcome',index:1,choice:1,inspected:false,outcomeRevision:2};
 const saved=storage({[SAVE_KEY]:JSON.stringify(game),[PRESENTATION_KEY]:JSON.stringify(ui),[COLLECTION_KEY]:JSON.stringify(recoverCollection(freshCollection(),game)),'aequilibrium.playtest.save.v2':'test-save','aequilibrium.playtest.presentation.v2':'test-ui','aequilibrium.playtest.collection.v1':'test-memories','another-app-secret':'not-ours'}),before=new Map(saved.values);
 const records=backupUpdateSaves(saved),copy=JSON.parse(saved.getItem(UPDATE_BACKUP_KEY));
 assert.equal(copy.records[SAVE_KEY],before.get(SAVE_KEY));assert.equal(copy.records[PRESENTATION_KEY],before.get(PRESENTATION_KEY));assert.equal(copy.records[COLLECTION_KEY],before.get(COLLECTION_KEY));assert.equal(copy.records['aequilibrium.playtest.save.v2'],'test-save');assert.equal(copy.records['another-app-secret'],undefined);
 assert.equal(JSON.parse(records[PRESENTATION_KEY]).reading.index,1);for(const [key,value]of before)assert.equal(saved.getItem(key),value);
 assert.ok(UPDATE_SAVE_KEYS.includes(SAVE_KEY)&&UPDATE_SAVE_KEYS.includes(PRESENTATION_KEY)&&UPDATE_SAVE_KEYS.includes(COLLECTION_KEY));
});
test('a failed backup does not alter or clear the game save',()=>{
 const saved=storage({[SAVE_KEY]:'original'});saved.setItem=()=>{throw new DOMException('full','QuotaExceededError');};assert.throws(()=>backupUpdateSaves(saved),/full/);assert.equal(saved.getItem(SAVE_KEY),'original');
});
test('update and return links preserve independent playtest mode',()=>{
 assert.equal(updatePageURL(true,true),'/update/?playtest=1&apply=1');assert.equal(updatePageURL(false,false),'/update/');assert.equal(updateReturnURL(true,'abc'),'/playtest/?updated=abc');assert.equal(updateReturnURL(false,'abc'),'/?updated=abc');
});
test('new release information is fetched separately from the old controlling manifest',async t=>{
 const payload={buildId:'1'.repeat(20),version:'2'.repeat(20),base:'/',totalBytes:1,shellCache:'aequilibrium:%2F:shell:'+'2'.repeat(20),mediaCache:'aequilibrium:%2F:media:'+'2'.repeat(20),completeMarker:'/__offline_complete__',files:[{url:'/x.js',bytes:1,sha256:'3'.repeat(64),group:'shell'}]};let input,options;
 globals(t,{fetch:async(url,init)=>{input=url;options=init;return new Response(JSON.stringify(payload));}});assert.equal((await latestOfflineManifest()).version,payload.version);assert.equal(input,'/release.json');assert.equal(options.cache,'no-store');
});
test('preparing an update reuses verified assets, repairs corrupt entries and keeps every older cache',async t=>{
 const body='unchanged-image',bytes=new TextEncoder().encode(body),hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',bytes)).toString('hex'),version='4'.repeat(20);
 const manifest={buildId:'5'.repeat(20),version,base:'/',totalBytes:bytes.length,shellCache:'aequilibrium:%2F:shell:'+version,mediaCache:'aequilibrium:%2F:media:'+version,completeMarker:'/__offline_complete__',files:[{url:'/art.webp',bytes:bytes.length,sha256:hash,group:'media'}]};
 const stores=new Map([['aequilibrium:%2F:media:old',new Map([['/art.webp',new Response(body)]])],['another-project',new Map([['/art.webp',new Response('private')]])]]);
 const caches={async keys(){return[...stores.keys()];},async open(name){if(!stores.has(name))stores.set(name,new Map());const values=stores.get(name);return{async match(key){return values.get(key)?.clone();},async put(key,value){values.set(key,value.clone());},async delete(key){return values.delete(key);}};}};
 let fetched=0;globals(t,{window:{caches},caches,crypto:webcrypto,navigator:{storage:{persist:async()=>false}},fetch:async()=>{fetched++;return new Response(body);}});
 let last;await prepareOffline(manifest,new AbortController().signal,p=>last=p);assert.equal(fetched,0);assert.equal(last.reused,1);assert.ok(stores.has('aequilibrium:%2F:media:old'));assert.ok(stores.has('another-project'));
 stores.get(manifest.mediaCache).set('/art.webp',new Response('broken'));stores.get('aequilibrium:%2F:media:old').set('/art.webp',new Response('broken'));
 await prepareOffline(manifest,new AbortController().signal,p=>last=p);assert.equal(fetched,1);assert.equal(last.downloaded,1);assert.equal(await stores.get(manifest.mediaCache).get('/art.webp').clone().text(),body);
});
