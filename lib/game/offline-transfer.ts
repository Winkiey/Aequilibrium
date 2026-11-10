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
   const chunks:Uint8Array[]=[];let bytes=0;
   if(response.body){const reader=response.body.getReader();try{while(true){const next=await reader.read();touch();if(next.done)break;bytes+=next.value.byteLength;if(bytes>size)throw new Error('下载大小与清单不符');chunks.push(next.value);onBytes(bytes);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}}
   else{const chunk=new Uint8Array(await response.arrayBuffer());bytes=chunk.byteLength;chunks.push(chunk);onBytes(bytes);}
   if(bytes!==size)throw new Error('下载尚未完整');
   const result=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}return result;
  }catch(error){signal.throwIfAborted();last=stalled?new Error('连接一段时间没有收到数据，已自动重连'):error;}
  finally{clearTimeout(timer!);signal.removeEventListener('abort',abort);controller.abort();}
  if(!attempt)await new Promise<void>((resolve,reject)=>{const abort=()=>{clearTimeout(delay);reject(signal.reason);};const delay=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},400);signal.addEventListener('abort',abort,{once:true});});
 }
 throw last instanceof Error?last:new Error('下载未完成，可以接着重试。');
}
export async function offlineHash(bytes:Uint8Array){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>))].map(n=>n.toString(16).padStart(2,'0')).join('');}
