import {publicPath} from './public-path';
import {fetchOfflineBytes,offlineHash} from './offline-transfer';
export type OfflineFile={url:string;bytes:number;sha256:string;group:'shell'|'media'};
export type OfflineBundle={url:string;bytes:number;sha256:string;files:{url:string;offset:number}[]};
export type OfflineManifest={buildId?:string;version:string;base:string;totalBytes:number;shellCache:string;mediaCache:string;completeMarker:string;files:OfflineFile[];bundles?:OfflineBundle[]};
export type DownloadProgress={completed:number;total:number;bytes:number;totalBytes:number;current:string;reused?:number;downloaded?:number};
export function validOfflineManifest(value:unknown):value is OfflineManifest{
 if(!value||typeof value!=='object')return false;const m=value as OfflineManifest;
 const base=publicPath('/');const prefix=`aequilibrium:${encodeURIComponent(base)}:`;
 const valid=(m.buildId===undefined||/^[a-f0-9]{20}$/.test(m.buildId))&&m.base===base&&/^[a-f0-9]{20}$/.test(m.version)&&m.shellCache===prefix+'shell:'+m.version&&m.mediaCache===prefix+'media:'+m.version&&m.completeMarker===base+'__offline_complete__'&&Array.isArray(m.files)&&m.files.length>0&&m.files.every(f=>f&&typeof f.url==='string'&&f.url.startsWith(base)&&!/[?#\\]/.test(f.url)&&!f.url.split('/').includes('..')&&!f.url.includes('%')&&Number.isSafeInteger(f.bytes)&&f.bytes>0&&/^[a-f0-9]{64}$/.test(f.sha256)&&['shell','media'].includes(f.group))&&m.totalBytes===m.files.reduce((n,f)=>n+f.bytes,0)&&new Set(m.files.map(f=>f.url)).size===m.files.length;
 if(!valid)return false;if(m.bundles===undefined)return true;
 if(!Array.isArray(m.bundles)||m.bundles.length>m.files.length)return false;
 const files=new Map(m.files.map(f=>[f.url,f])),seen=new Set<string>(),urls=new Set<string>();
 return m.bundles.every(b=>{if(!b||typeof b.url!=='string'||!b.url.startsWith(base+'offline/')||!/^art-[a-f0-9]{20}\.bin$/.test(b.url.slice((base+'offline/').length))||urls.has(b.url)||!/^[a-f0-9]{64}$/.test(b.sha256)||!Number.isSafeInteger(b.bytes)||b.bytes<=0||b.bytes>3*1024*1024||!Array.isArray(b.files)||!b.files.length)return false;urls.add(b.url);let offset=0;for(const member of b.files){const file=files.get(member?.url);if(!file||file.group!=='media'||!file.url.endsWith('.webp')||seen.has(file.url)||member.offset!==offset)return false;seen.add(file.url);offset+=file.bytes;}return offset===b.bytes;});
}
export async function offlineManifest():Promise<OfflineManifest>{
 if(!('caches'in window)||!navigator.serviceWorker||!crypto.subtle)throw new Error('当前浏览器未提供离线资源保存。仍可在线开始游戏。');
 const response=await fetch(publicPath('/offline-manifest.json'),{cache:'no-store'});
 if(!response.ok)throw new Error('这个运行入口暂未提供离线包，可先在线游玩。');
 const manifest:unknown=await response.json();if(!validOfflineManifest(manifest))throw new Error('资源清单未通过检查，请稍后刷新重试。');return manifest;
}
/** Unlike offline-manifest.json, this endpoint is never pinned to a worker version. */
export async function latestOfflineManifest(signal?:AbortSignal):Promise<OfflineManifest>{
 const response=await fetch(publicPath('/release.json'),{cache:'no-store',signal});
 if(!response.ok)throw new Error('暂时无法取得新版信息，请联网后重试。');
 const value:unknown=await response.json();if(!validOfflineManifest(value)||!value.buildId)throw new Error('新版信息未通过检查，当前进度和资源仍保留。');return value;
}
export function currentBuildId():string|null{return document.querySelector<HTMLMetaElement>('meta[name="aequilibrium-build"]')?.content??null;}
export async function registerOffline(){
 const reg=await navigator.serviceWorker.register(publicPath('/sw.js'),{scope:publicPath('/'),updateViaCache:'none'});
 // The explicit repair action checks for a new worker without forcing a mid-game takeover.
 if(reg.active)await reg.update();
 // A rejected install is surfaced instead of awaiting serviceWorker.ready forever.
 const worker=reg.installing;
 if(worker)await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(new Error('离线入口准备超时，请重试。'));},45000);const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('statechange',changed);};const changed=()=>{if(worker.state==='installed'||worker.state==='activated'){cleanup();resolve();}else if(worker.state==='redundant'){cleanup();reject(new Error('离线入口未能完整下载，请重试。'));}};worker.addEventListener('statechange',changed);changed();});
 return reg;
}
async function verified(response:Response|undefined,file:OfflineFile){
 if(!response||response.status!==200)return null;
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==file.bytes)return null;
 const hash=await offlineHash(new Uint8Array(bytes));
 if(hash!==file.sha256)return null;
 const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('transfer-encoding');headers.set('content-length',String(bytes.byteLength));
 return new Response(bytes,{status:200,headers});
}
export async function prepareOffline(manifest:OfflineManifest,signal:AbortSignal,onProgress:(p:DownloadProgress)=>void,options:{shellReady?:Promise<unknown>}={}){
 if(!validOfflineManifest(manifest))throw new Error('不能识别这份资源清单。');
 const controller=new AbortController(),abort=()=>controller.abort(signal.reason);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
 const activeSignal=controller.signal,gate=Promise.resolve(options.shellReady).catch(error=>{controller.abort(error);throw error;});void gate.catch(()=>{});
 try{
 const shell=await caches.open(manifest.shellCache),media=await caches.open(manifest.mediaCache);
 // A stale complete marker cannot survive an interrupted repair.
 await media.delete(manifest.completeMarker);
 const namespace=`aequilibrium:${encodeURIComponent(manifest.base)}:`;
 const names=(await caches.keys()).filter(name=>name.startsWith(namespace)&&name!==manifest.shellCache&&name!==manifest.mediaCache).reverse();
 const oldCaches=await Promise.all(names.map(async name=>{const cache=await caches.open(name);const urls=typeof cache.keys==='function'?new Set((await cache.keys()).map(r=>new URL(r.url).pathname)):null;return{name,cache,urls};}));
 let completed=0,bytes=0,reused=0,downloaded=0,lastReport=0;const total=manifest.files.length,inFlight=new Map<string,number>(),missing:OfflineFile[]=[];
 function report(current:string,force=false){if(!force&&Date.now()-lastReport<80&&completed!==total)return;lastReport=Date.now();onProgress({completed,total,bytes:Math.min(manifest.totalBytes,bytes+[...inFlight.values()].reduce((n,b)=>n+b,0)),totalBytes:manifest.totalBytes,current,reused,downloaded});}
 async function keep(file:OfflineFile,result:Response,wasReused:boolean){activeSignal.throwIfAborted();await(file.group==='shell'?shell:media).put(file.url,result);if(wasReused)reused++;else downloaded++;completed++;bytes+=file.bytes;}
 async function scan(file:OfflineFile){activeSignal.throwIfAborted();const cache=file.group==='shell'?shell:media;let result=await verified(await cache.match(file.url),file);
  if(!result)for(const old of oldCaches.filter(c=>c.name.startsWith(namespace+file.group+':')&&(!c.urls||c.urls.has(file.url)))){activeSignal.throwIfAborted();result=await verified(await old.cache.match(file.url),file);if(result)break;}
  if(result)await keep(file,result,true);else missing.push(file);report('核对本机已经保存的文件');
 }
 report('检查本机已有资源',true);
 let cursor=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<total)await scan(manifest.files[cursor++]);}));
 const remaining=new Map(missing.map(f=>[f.url,f])),bundled=new Set<string>(),jobs:(()=>Promise<void>)[]=[];
 async function one(file:OfflineFile){if(file.group==='shell')await gate;activeSignal.throwIfAborted();const label=file.url.endsWith('.mp4')?'下载入场片头':file.group==='media'?'下载人物与场景':'准备游戏入口';
  let result:Response|null=null;for(let attempt=0;attempt<2&&!result;attempt++){const data=await fetchOfflineBytes(file.url,file.bytes,activeSignal,n=>{inFlight.set(file.url,n);report(label);});result=await verified(new Response(data as Uint8Array<ArrayBuffer>),file);}
  if(!result)throw new Error('文件校验未通过，已保存的画面仍保留，可以重试。');
  const type=file.url.endsWith('.mp4')?'video/mp4':file.url.endsWith('.webp')?'image/webp':file.url.endsWith('.js')?'text/javascript':file.url.endsWith('.css')?'text/css':file.url.endsWith('.html')?'text/html; charset=utf-8':file.url.endsWith('.woff2')?'font/woff2':file.url.endsWith('.svg')?'image/svg+xml':file.url.endsWith('.webmanifest')?'application/manifest+json':file.url.endsWith('.txt')?'text/plain; charset=utf-8':'application/octet-stream';
  if(type)result.headers.set('Content-Type',type);await keep(file,result,false);inFlight.delete(file.url);report(label);
 }
 for(const bundle of manifest.bundles??[]){const wanted=bundle.files.map(m=>remaining.get(m.url)).filter((f):f is OfflineFile=>!!f),wantedBytes=wanted.reduce((n,f)=>n+f.bytes,0);
  if(wanted.length<4||wantedBytes<bundle.bytes*.65)continue;for(const f of wanted)bundled.add(f.url);
  jobs.push(async()=>{activeSignal.throwIfAborted();let data:Uint8Array;
   try{data=await fetchOfflineBytes(bundle.url,bundle.bytes,activeSignal,n=>{inFlight.set(bundle.url,n*wantedBytes/bundle.bytes);report('下载成组的画面');});if(await offlineHash(data)!==bundle.sha256)throw new Error('画面包校验未通过');}
   catch{inFlight.delete(bundle.url);activeSignal.throwIfAborted();report('正在改用单幅画面接着下载',true);for(const file of wanted)await one(file);return;}
   // Verify every member before saving any of this block. A valid block hash
   // never overrides an individual file's declared hash.
   const members=[];for(const member of bundle.files){const file=remaining.get(member.url);if(!file)continue;const part=data.slice(member.offset,member.offset+file.bytes);if(await offlineHash(part)!==file.sha256)throw new Error('画面与资源清单不符');members.push({file,part});}
   let credited=0;for(const {file,part}of members){await keep(file,new Response(part as Uint8Array<ArrayBuffer>,{headers:{'Content-Type':'image/webp'}}),false);credited+=file.bytes;inFlight.set(bundle.url,wantedBytes-credited);report('校验并保存画面');}inFlight.delete(bundle.url);
  });
 }
 for(const file of missing.filter(f=>f.group==='media'&&!bundled.has(f.url)))jobs.push(()=>one(file));
 for(const file of missing.filter(f=>f.group==='shell'))jobs.push(async()=>{await gate;const stored=await verified(await shell.match(file.url),file);if(stored){await keep(file,stored,true);report('核对已备齐的入口');}else await one(file);});
 let next=0,failure:unknown;await Promise.allSettled(Array.from({length:4},async()=>{try{while(next<jobs.length){activeSignal.throwIfAborted();await jobs[next++]();}}catch(e){failure??=e;controller.abort(e);}}));
 if(failure)throw failure;await gate;activeSignal.throwIfAborted();
 await media.put(manifest.completeMarker,new Response(JSON.stringify({version:manifest.version,complete:true}),{headers:{'content-type':'application/json'}}));
 report('资源已全部核对并保存',true);
 return navigator.storage?.persist?await navigator.storage.persist().catch(()=>false):false;
 }finally{signal.removeEventListener('abort',abort);controller.abort();}
}
export async function hasOfflinePack(m:OfflineManifest){
 const marker=await(await caches.open(m.mediaCache)).match(m.completeMarker);if(!marker)return false;
 try{const value:unknown=await marker.json();if(!value||typeof value!=='object'||!('version'in value)||!('complete'in value)||value.version!==m.version||value.complete!==true)return false;
  const shell=await caches.open(m.shellCache),media=await caches.open(m.mediaCache);
  for(const f of m.files)if(!await(f.group==='shell'?shell:media).match(f.url))return false;
  return true;
 }catch{return false;}
}
