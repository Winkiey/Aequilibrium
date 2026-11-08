import {publicPath} from './public-path';
export type OfflineFile={url:string;bytes:number;sha256:string;group:'shell'|'media'};
export type OfflineManifest={version:string;base:string;totalBytes:number;shellCache:string;mediaCache:string;completeMarker:string;files:OfflineFile[]};
export type DownloadProgress={completed:number;total:number;bytes:number;totalBytes:number;current:string};
export function validOfflineManifest(value:unknown):value is OfflineManifest{
 if(!value||typeof value!=='object')return false;const m=value as OfflineManifest;
 const base=publicPath('/');const prefix=`aequilibrium:${encodeURIComponent(base)}:`;
 return m.base===base&&/^[a-f0-9]{20}$/.test(m.version)&&m.shellCache===prefix+'shell:'+m.version&&m.mediaCache===prefix+'media:'+m.version&&m.completeMarker===base+'__offline_complete__'&&Array.isArray(m.files)&&m.files.length>0&&m.files.every(f=>f&&typeof f.url==='string'&&f.url.startsWith(base)&&!/[?#\\]/.test(f.url)&&!f.url.split('/').includes('..')&&!f.url.includes('%')&&Number.isSafeInteger(f.bytes)&&f.bytes>0&&/^[a-f0-9]{64}$/.test(f.sha256)&&['shell','media'].includes(f.group))&&m.totalBytes===m.files.reduce((n,f)=>n+f.bytes,0)&&new Set(m.files.map(f=>f.url)).size===m.files.length;
}
export async function offlineManifest():Promise<OfflineManifest>{
 if(!('caches'in window)||!navigator.serviceWorker||!crypto.subtle)throw new Error('当前浏览器未提供离线资源保存。仍可在线开始游戏。');
 const response=await fetch(publicPath('/offline-manifest.json'),{cache:'no-store'});
 if(!response.ok)throw new Error('这个运行入口暂未提供离线包，可先在线游玩。');
 const manifest:unknown=await response.json();if(!validOfflineManifest(manifest))throw new Error('资源清单未通过检查，请稍后刷新重试。');return manifest;
}
export async function registerOffline(){
 const reg=await navigator.serviceWorker.register(publicPath('/sw.js'),{scope:publicPath('/')});
 // The explicit repair action checks for a new worker without forcing a mid-game takeover.
 if(reg.active)await reg.update().catch(()=>undefined);
 // A rejected install is surfaced instead of awaiting serviceWorker.ready forever.
 const worker=reg.installing;
 if(worker)await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(new Error('离线入口准备超时，请重试。'));},45000);const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('statechange',changed);};const changed=()=>{if(worker.state==='installed'||worker.state==='activated'){cleanup();resolve();}else if(worker.state==='redundant'){cleanup();reject(new Error('离线入口未能完整下载，请重试。'));}};worker.addEventListener('statechange',changed);changed();});
 return reg;
}
async function verified(response:Response|undefined,file:OfflineFile){
 if(!response||response.status!==200)return null;
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==file.bytes)return null;
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(hash!==file.sha256)return null;
 const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('transfer-encoding');headers.set('content-length',String(bytes.byteLength));
 return new Response(bytes,{status:200,headers});
}
export async function prepareOffline(manifest:OfflineManifest,signal:AbortSignal,onProgress:(p:DownloadProgress)=>void){
 if(!validOfflineManifest(manifest))throw new Error('不能识别这份资源清单。');
 const shell=await caches.open(manifest.shellCache),media=await caches.open(manifest.mediaCache);
 // A stale complete marker cannot survive an interrupted repair.
 await media.delete(manifest.completeMarker);
 let next=0,completed=0,bytes=0;const total=manifest.files.length;
 function report(current:string){onProgress({completed,total,bytes,totalBytes:manifest.totalBytes,current});}
 report('检查本机已有资源');
 async function worker(){while(next<total){signal.throwIfAborted();const file=manifest.files[next++],cache=file.group==='shell'?shell:media;
  let result=await verified(await cache.match(file.url),file);
  if(!result){signal.throwIfAborted();const response=await fetch(file.url,{cache:'reload',signal});result=await verified(response,file);if(!result)throw new Error('有一个资源未完整取得，请重试；已完成的资源会保留。');await cache.put(file.url,result);}
  signal.throwIfAborted();completed++;bytes+=file.bytes;report(file.group==='media'?'整理人物与场景':'准备游戏入口');
 }}
 await Promise.all([worker(),worker()]);signal.throwIfAborted();
 await media.put(manifest.completeMarker,new Response(JSON.stringify({version:manifest.version,complete:true}),{headers:{'content-type':'application/json'}}));
 return navigator.storage?.persist?await navigator.storage.persist().catch(()=>false):false;
}
export async function hasOfflinePack(m:OfflineManifest){
 const marker=await(await caches.open(m.mediaCache)).match(m.completeMarker);if(!marker)return false;
 try{const value:unknown=await marker.json();if(!value||typeof value!=='object'||!('version'in value)||!('complete'in value)||value.version!==m.version||value.complete!==true)return false;
  const shell=await caches.open(m.shellCache),media=await caches.open(m.mediaCache);
  for(const f of m.files)if(!await(f.group==='shell'?shell:media).match(f.url))return false;
  return true;
 }catch{return false;}
}
