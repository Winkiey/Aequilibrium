/** Streamed, bounded requests; all bytes still require their manifest hash. */
export async function fetchOfflineBytes(url:string,size:number,signal:AbortSignal,onBytes:(bytes:number)=>void):Promise<Uint8Array>{
 let last:unknown;
 for(let attempt=0;attempt<2;attempt++){
  signal.throwIfAborted();onBytes(0);
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>,stalled=false;
  const abort=()=>controller.abort(signal.reason),touch=()=>{clearTimeout(timer);timer=setTimeout(()=>{stalled=true;controller.abort();},15000);};
  signal.addEventListener('abort',abort,{once:true});touch();
  try{
   const response=await fetch(url,{cache:'reload',signal:controller.signal});touch();
   if(response.status!==200)throw new Error('下载连接暂未就绪');
   if(!Number.isSafeInteger(size)||size<=0)throw new Error('下载大小与清单不符');
   if(response.body){const result=new Uint8Array(size),reader=response.body.getReader();let bytes=0;
    try{while(true){const next=await reader.read();touch();if(next.done)break;const end=bytes+next.value.byteLength;if(end>size)throw new Error('下载大小与清单不符');result.set(next.value,bytes);bytes=end;onBytes(bytes);}}
    finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    if(bytes!==size)throw new Error('下载尚未完整');return result;
   }
   const result=new Uint8Array(await response.arrayBuffer());onBytes(result.byteLength);if(result.byteLength!==size)throw new Error('下载尚未完整');return result;
  }catch(error){signal.throwIfAborted();last=stalled?new Error('连接一段时间没有收到数据，已自动重连'):error;}
  finally{clearTimeout(timer!);signal.removeEventListener('abort',abort);controller.abort();}
  if(!attempt)await new Promise<void>((resolve,reject)=>{const abort=()=>{clearTimeout(delay);reject(signal.reason);};const delay=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},400);signal.addEventListener('abort',abort,{once:true});});
 }
 throw last instanceof Error?last:new Error('下载未完成，可以接着重试。');
}
export async function offlineHash(bytes:Uint8Array){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>))].map(n=>n.toString(16).padStart(2,'0')).join('');}
/** Bound simultaneous buffers/cache writes on phones and slow connections. */
export function offlineConcurrency(){
 if(typeof navigator==='undefined')return 4;
 const n=navigator as Navigator&{deviceMemory?:number;connection?:{saveData?:boolean;effectiveType?:string}};
 return /Android|iPhone|iPad|iPod|Mobile/i.test(n.userAgent??'')||(n.deviceMemory!==undefined&&n.deviceMemory<=4)||n.connection?.saveData||/^(slow-)?2g$/.test(n.connection?.effectiveType??'')?2:4;
}
export async function offlineYield(signal:AbortSignal){signal.throwIfAborted();await new Promise<void>(resolve=>setTimeout(resolve,0));signal.throwIfAborted();}
export function offlineMime(url:string,fallback='application/octet-stream'){
 const types:Record<string,string>={mp3:'audio/mpeg',mp4:'video/mp4',webp:'image/webp',js:'text/javascript',css:'text/css',html:'text/html; charset=utf-8',woff2:'font/woff2',svg:'image/svg+xml',webmanifest:'application/manifest+json',txt:'text/plain; charset=utf-8'};
 return types[url.slice(url.lastIndexOf('.')+1)]??fallback;
}
