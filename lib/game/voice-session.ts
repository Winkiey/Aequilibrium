import type {VoiceCue,VoiceOptions,VoiceStatus} from './dialogue-voice';
import {publicPath} from './public-path';
import {connectVoiceTreatment} from './voice-effects';

/** Content-addressed clips can be kept independently of the complete-pack marker. */
export async function fetchVoiceClip(src:string,signal:AbortSignal):Promise<ArrayBuffer>{
 const cacheName=`aequilibrium:${encodeURIComponent(publicPath('/'))}:voice-v1`;
 let cache:Cache|undefined;
 try{if(typeof caches!=='undefined')cache=await caches.open(cacheName);}catch{}
 const inspect=async(response:Response)=>{
  if(response.status!==200||!response.headers.get('Content-Type')?.toLowerCase().startsWith('audio/'))throw new Error('Voice response is not audio');
  const data=await response.arrayBuffer();
  if(!data.byteLength||data.byteLength>4*1024*1024)throw new Error('Voice response size');
  const fingerprint=/\.([a-f0-9]{12})\.mp3$/.exec(src)?.[1];
  if(fingerprint&&typeof crypto!=='undefined'&&crypto.subtle){
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),n=>n.toString(16).padStart(2,'0')).join('');
   if(!hash.startsWith(fingerprint))throw new Error('Voice response fingerprint');
  }
  return data;
 };
 try{
  const cached=await cache?.match(src);
  if(cached){try{return await inspect(cached);}catch{await cache?.delete(src);}}
 }catch{}
 signal.throwIfAborted();
 const response=await fetch(src,{signal,cache:'force-cache',credentials:'same-origin'});
 const data=await inspect(response);signal.throwIfAborted();
 try{await cache?.put(src,new Response(data,{headers:{'Content-Type':'audio/mpeg','Content-Length':String(data.byteLength)}}));}catch{/* Listening works even when browser storage is full. */}
 return data;
}

type Dependencies={
 createContext?:()=>AudioContext;
 fetchClip?:(src:string,signal:AbortSignal)=>Promise<ArrayBuffer>;
 now?:()=>number;
 maxDecodedBytes?:number;
};
const denied=()=>Object.assign(new Error('Tap to enable audio'),{name:'NotAllowedError'});

/** One gesture-unlocked context and bounded decoded cache for the whole game.
 * Warming is serial; a newly selected line never waits behind speculative clips.
 * The runtime owns resources, while each mounted performance owns its cursor.
 */
export class VoiceSession{
 private ctx:AudioContext|null=null;
 private opening:Promise<AudioContext>|null=null;
 private buffers=new Map<string,AudioBuffer>();
 private pending=new Map<string,Promise<AudioBuffer>>();
 private requests=new Set<AbortController>();
 private channels=new Set<BufferedVoice>();
 private closed=false;
 private wantsAudio=false;
 private epoch=0;
 private warmed='';
 private warmQueue:string[]=[];
 private warming=false;
 private readonly factory:()=>AudioContext;
 private readonly fetchClip:(src:string,signal:AbortSignal)=>Promise<ArrayBuffer>;
 readonly now:()=>number;
 private readonly maxBytes:number;
 constructor(deps:Dependencies={}){
  this.factory=deps.createContext??(()=>new AudioContext({latencyHint:'interactive'}));
  this.fetchClip=deps.fetchClip??fetchVoiceClip;
  this.now=deps.now??(()=>typeof performance==='undefined'?Date.now():performance.now());
  this.maxBytes=deps.maxDecodedBytes??24*1024*1024;
 }
 get context(){return this.ctx;}
 get cachedClips(){return this.buffers.size;}
 /** Must be called directly from Start/Continue/Enable/Replay, before an await. */
 unlock():Promise<AudioContext>{
  if(this.closed)return Promise.reject(denied());
  this.wantsAudio=true;
  if(this.ctx?.state==='running')return Promise.resolve(this.ctx);
  if(this.opening)return this.opening;
  const epoch=++this.epoch;
  try{
   const ctx=this.ctx??=this.factory();
   const resuming=ctx.resume();
   // A one-sample silent source primes the same Web Audio output on mobile.
   const source=ctx.createBufferSource();source.buffer=ctx.createBuffer(1,1,ctx.sampleRate);source.connect(ctx.destination);source.onended=()=>source.disconnect();source.start();
   let timeout:ReturnType<typeof setTimeout>;
   const deadline=new Promise<never>((_,reject)=>{timeout=setTimeout(()=>reject(denied()),2500);});
   const opening=Promise.race([Promise.resolve(resuming),deadline]).then(()=>{
    if(this.closed||epoch!==this.epoch||ctx.state!=='running'){
     if(!this.wantsAudio&&ctx===this.ctx)void ctx.suspend().catch(()=>{});
     throw denied();
    }
    return ctx;
   }).finally(()=>{clearTimeout(timeout);if(this.opening===opening)this.opening=null;});
   this.opening=opening;
   void opening.catch(()=>{});
   return opening;
  }catch(error){return Promise.reject(error);}
 }
 async ready(){
  if(this.closed||!this.ctx)throw denied();
  if(this.ctx.state==='running')return this.ctx;
  if(this.opening)return this.opening;
  throw denied();
 }
 createChannel(report:(status:VoiceStatus)=>void=()=>{}){
  const channel=new BufferedVoice(this,report,()=>this.channels.delete(channel));this.channels.add(channel);return channel;
 }
 async load(src:string):Promise<AudioBuffer>{
  if(this.closed||!this.ctx)throw denied();
  const cached=this.buffers.get(src);
  if(cached){this.buffers.delete(src);this.buffers.set(src,cached);return cached;}
  const pending=this.pending.get(src);if(pending)return pending;
  const ctx=this.ctx,controller=new AbortController();this.requests.add(controller);
  const timeout=setTimeout(()=>controller.abort(),7000);
  const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new DOMException('Voice loading timeout or cancellation','AbortError')),{once:true}));
  const request=Promise.race([(async()=>{
    const encoded=await this.fetchClip(src,controller.signal);controller.signal.throwIfAborted();
    const buffer=await ctx.decodeAudioData(encoded);
    controller.signal.throwIfAborted();
    if(this.closed||ctx!==this.ctx)throw denied();
    if(buffer.length*buffer.numberOfChannels*4>this.maxBytes)throw new Error('Voice clip exceeds decoded memory budget');
    this.buffers.set(src,buffer);
    let bytes=[...this.buffers.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0);
    while(this.buffers.size>1&&(this.buffers.size>12||bytes>this.maxBytes)){
     const oldest=this.buffers.keys().next().value!;const value=this.buffers.get(oldest)!;
     bytes-=value.length*value.numberOfChannels*4;this.buffers.delete(oldest);
    }
    return buffer;
  })(),cancelled]).finally(()=>{clearTimeout(timeout);this.requests.delete(controller);this.pending.delete(src);});
  this.pending.set(src,request);return request;
 }
 warm(cues:readonly VoiceCue[]){
  if(!this.ctx||this.closed)return;
  const urls=[...new Set(cues.map(c=>c.src))].slice(0,4),key=urls.join('|');
  if(key===this.warmed)return;
  this.warmed=key;this.warmQueue=urls;
  if(this.warming)return;
  this.warming=true;
  void (async()=>{try{while(this.warmQueue.length&&!this.closed){const src=this.warmQueue.shift()!;try{await this.load(src);}catch{/* Optional look-ahead never blocks the story. */}}}finally{this.warming=false;}})();
 }
 suspend(){
  ++this.epoch;this.wantsAudio=false;this.warmed='';this.warmQueue=[];this.opening=null;
  for(const channel of this.channels)channel.stop();
  return this.ctx?.suspend().catch(()=>{});
 }
 async dispose(){
  if(this.closed)return;this.closed=true;this.wantsAudio=false;++this.epoch;this.warmQueue=[];
  for(const channel of [...this.channels])channel.dispose();
  for(const request of this.requests)request.abort();
  this.buffers.clear();this.pending.clear();this.opening=null;
  await this.ctx?.close().catch(()=>{});this.ctx=null;
 }
}

/** Stale loading can fill the cache, but cannot schedule a skipped performance. */
export class BufferedVoice{
 private cue:VoiceCue|null=null;
 private options:VoiceOptions={enabled:false,paused:false,volume:.7};
 private source:AudioBufferSourceNode|null=null;
 private gain:GainNode|null=null;
 private releaseEffect:(()=>void)|null=null;
 private ticket=0;
 private offset=0;
 private started=0;
 private closed=false;
 private current:VoiceStatus='idle';
 startupMs:number|null=null;
 constructor(private session:VoiceSession,private onStatus:(status:VoiceStatus)=>void,private remove:()=>void){}
 get status(){return this.current;}
 private get wanted(){return !this.closed&&!!this.cue&&this.options.enabled&&!this.options.paused&&this.options.volume>0;}
 private report(status:VoiceStatus){if(status!==this.current){this.current=status;this.onStatus(status);}}
 private retire(remember=false){
  ++this.ticket;
  if(remember&&this.source&&this.session.context)this.offset+=Math.max(0,this.session.context.currentTime-this.started);
  if(this.source){this.source.onended=null;try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}
  this.releaseEffect?.();this.releaseEffect=null;
  this.gain?.disconnect();this.gain=null;
 }
 set(cue:VoiceCue|null,options:VoiceOptions){
  if(this.closed)return;
  const changed=cue?.key!==this.cue?.key||cue?.src!==this.cue?.src;
  const treatmentChanged=(options.treatment??'natural')!==(this.options.treatment??'natural');
  if(changed){this.retire();this.offset=0;this.startupMs=null;this.cue=cue;this.report(cue?'ready':'idle');}
  else if(treatmentChanged&&this.source){this.retire(true);this.report('paused');}
  this.options={...options,volume:Number.isFinite(options.volume)?Math.max(0,Math.min(1,options.volume)):0};
  if(!cue)return;
  if(!this.wanted){
   this.retire(options.enabled&&this.options.volume>0);
   if(!options.enabled||this.options.volume===0){this.offset=0;this.report('ready');}
   else if(this.current==='playing'||this.current==='loading')this.report('paused');
   return;
  }
  if(this.gain)this.gain.gain.value=this.options.volume;
  if(this.current==='ready'||this.current==='paused')this.begin();
 }
 private begin(){
  if(!this.wanted||!this.cue)return;
  const ticket=++this.ticket,cue=this.cue,since=this.session.now();
  const current=()=>this.wanted&&ticket===this.ticket;
  this.report('loading');
  void Promise.all([this.session.ready(),this.session.load(cue.src)]).then(([ctx,buffer])=>{
   if(!current())return;
   if(ctx.state!=='running')throw denied();
   if(this.offset>=buffer.duration){this.report('ended');return;}
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=buffer;gain.gain.value=this.options.volume;
   this.source=source;this.gain=gain;this.started=ctx.currentTime;
   this.releaseEffect=connectVoiceTreatment(ctx,source,gain,this.options.treatment??'natural');gain.connect(ctx.destination);
   source.onended=()=>{if(current()&&this.source===source){this.source=null;source.disconnect();this.releaseEffect?.();this.releaseEffect=null;this.gain?.disconnect();this.gain=null;this.offset=0;this.report('ended');}};
   source.start(0,this.offset);this.startupMs=Math.max(0,Math.round(this.session.now()-since));this.report('playing');
  }).catch(error=>{
   if(!current())return;
   this.retire();this.report(error instanceof Error&&error.name==='NotAllowedError'?'blocked':'unavailable');
  });
 }
 replay(){
  if(!this.wanted)return false;
  // Replay is another genuine gesture and can recover an OS-suspended context.
  void this.session.unlock().catch(()=>{});
  this.retire();this.offset=0;this.report('ready');this.begin();return true;
 }
 stop(){if(!this.closed){this.retire();this.offset=0;this.cue=null;this.report('idle');}}
 dispose(){if(this.closed)return;this.closed=true;this.retire();this.cue=null;this.current='idle';this.remove();}
}
