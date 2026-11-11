import {validOfflineManifest,type OfflineManifest,type OfflineFile,type DownloadProgress} from './offline';
import {fetchOfflineBytes,offlineHash} from './offline-transfer';

async function verified(response:Response|undefined,file:OfflineFile):Promise<Response|null>{
 if(!response||response.status!==200)return null;
 const data=await response.arrayBuffer();
 if(data.byteLength!==file.bytes||await offlineHash(new Uint8Array(data))!==file.sha256)return null;
 return new Response(data,{status:200,headers:{'Content-Type':'audio/mpeg','Content-Length':String(data.byteLength)}});
}
/** Optional voices never gate installing or updating the base game. */
export async function hasVoicePack(manifest:OfflineManifest):Promise<boolean>{
 try{
  if(!validOfflineManifest(manifest)||!manifest.voice)return false;
  const voice=manifest.voice,cache=await caches.open(voice.cache),response=await cache.match(voice.marker);
  if(!response)return false;const marker=await response.json();if(!marker||typeof marker!=='object'||!('version'in marker)||!('complete'in marker)||marker.version!==voice.version||marker.complete!==true)return false;
  for(const file of voice.files)if(!await cache.match(file.url))return false;
  return true;
 }catch{return false;}
}
export async function prepareVoices(manifest:OfflineManifest,signal:AbortSignal,onProgress:(p:DownloadProgress)=>void):Promise<void>{
 if(!validOfflineManifest(manifest)||!manifest.voice)throw new Error('这个版本尚未提供人物语音包。');
 const voice=manifest.voice,cache=await caches.open(voice.cache),core=await caches.open(manifest.mediaCache),own=new AbortController();
 const abort=()=>own.abort(signal.reason);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
 let cursor=0,completed=0,bytes=0,reused=0,downloaded=0;const flying=new Map<string,number>();
 const report=(current:string)=>onProgress({completed,total:voice.files.length,bytes:Math.min(voice.totalBytes,bytes+[...flying.values()].reduce((n,v)=>n+v,0)),totalBytes:voice.totalBytes,current,reused,downloaded});
 try{
  await cache.delete(voice.marker);report('核对已经保存的对白');
  await Promise.all(Array.from({length:4},async()=>{
   while(cursor<voice.files.length){
    own.signal.throwIfAborted();const file=voice.files[cursor++];
    let result=await verified(await cache.match(file.url),file)??await verified(await core.match(file.url),file),wasReused=!!result;
    if(!result){
     for(let attempt=0;attempt<2&&!result;attempt++){
      const data=await fetchOfflineBytes(file.url,file.bytes,own.signal,n=>{flying.set(file.url,n);report('收好人物对白');});
      result=await verified(new Response(data as Uint8Array<ArrayBuffer>),file);
     }
     if(!result)throw new Error('一段对白未通过校验，完成的语音仍保留，可以重试。');
    }
    own.signal.throwIfAborted();await cache.put(file.url,result);flying.delete(file.url);completed++;bytes+=file.bytes;if(wasReused)reused++;else downloaded++;report('收好人物对白');
   }
  }));
  own.signal.throwIfAborted();await cache.put(voice.marker,new Response(JSON.stringify({version:voice.version,complete:true}),{headers:{'Content-Type':'application/json'}}));report('人物对白已备齐');
 }catch(error){own.abort(error);throw error;}finally{signal.removeEventListener('abort',abort);}
}
