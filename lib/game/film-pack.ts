import {validOfflineManifest,type OfflineManifest,type OfflineFile,type DownloadProgress} from './offline';
import {fetchOfflineBytes,offlineHash,offlineYield} from './offline-transfer';

async function verified(response:Response|undefined,file:OfflineFile){
 if(!response||response.status!==200)return null;const data=await response.arrayBuffer();
 if(data.byteLength!==file.bytes||await offlineHash(new Uint8Array(data))!==file.sha256)return null;
 return new Response(data,{headers:{'Content-Type':file.url.endsWith('.mp4')?'video/mp4':'image/webp','Content-Length':String(data.byteLength)}});
}
export async function hasFilmPack(manifest:OfflineManifest){
 if(!validOfflineManifest(manifest)||!manifest.film)return false;
 try{const pack=manifest.film,cache=await caches.open(pack.cache),response=await cache.match(pack.marker);if(!response)return false;
  const marker=await response.json();if(!marker||typeof marker!=='object'||!('version'in marker)||!('complete'in marker)||marker.version!==pack.version||marker.complete!==true)return false;
  for(const f of pack.files)if(!await cache.match(f.url))return false;return true;
 }catch{return false;}
}
/** Optional full-quality film never gates updating or starting the base game. */
export async function prepareFilm(manifest:OfflineManifest,signal:AbortSignal,onProgress:(p:DownloadProgress)=>void){
 if(!validOfflineManifest(manifest)||!manifest.film)throw new Error('此版本没有独立片头影像包。');
 const pack=manifest.film,cache=await caches.open(pack.cache),prefix=`aequilibrium:${encodeURIComponent(manifest.base)}:media:`;
 const prior=await Promise.all((typeof caches.keys==='function'?await caches.keys():[]).filter(name=>name.startsWith(prefix)).reverse().map(name=>caches.open(name)));
 let completed=0,bytes=0,reused=0,downloaded=0,last=0;
 const report=(current:string,flying=0,force=false)=>{if(!force&&Date.now()-last<100)return;last=Date.now();onProgress({completed,total:pack.files.length,bytes:Math.min(pack.totalBytes,bytes+flying),totalBytes:pack.totalBytes,current,reused,downloaded});};
 await cache.delete(pack.marker);report('核对已经保存的片头',0,true);
 for(const file of pack.files){signal.throwIfAborted();const existing=await cache.match(file.url);let result=await verified(existing,file);const here=!!result&&existing?.headers.get('content-type')===(file.url.endsWith('.mp4')?'video/mp4':'image/webp');
  if(!result)for(const older of prior){signal.throwIfAborted();result=await verified(await older.match(file.url),file);if(result)break;}
  const used=!!result;
  if(!result){for(let attempt=0;attempt<2&&!result;attempt++){const data=await fetchOfflineBytes(file.url,file.bytes,signal,n=>report('保存2K片头影像',n));result=await verified(new Response(data as Uint8Array<ArrayBuffer>),file);}if(!result)throw new Error('片头校验未通过，已保存的文件仍在，可以重试。');}
  signal.throwIfAborted();if(!here)await cache.put(file.url,result);completed++;bytes+=file.bytes;if(used)reused++;else downloaded++;
  report('收好片头影像',0,true);await offlineYield(signal);
 }
 signal.throwIfAborted();await cache.put(pack.marker,new Response(JSON.stringify({version:pack.version,complete:true}),{headers:{'Content-Type':'application/json'}}));report('片头已保存，可离线观看',0,true);
}
