/** Optional pre-generated character speech. It never controls story progress. */
export type VoiceCue=Readonly<{key:string;src:string}>;
export type VoiceStatus='idle'|'ready'|'loading'|'playing'|'paused'|'ended'|'blocked'|'unavailable';
export type VoiceOptions=Readonly<{enabled:boolean;paused:boolean;volume:number}>;
export type SpokenClip=Readonly<{speaker:string;text:string;src:string;essential?:boolean}>;

/** Match the actor AND entire displayed beat, never its changing array index. */
export function spokenCue(clips:readonly SpokenClip[],speaker:string,text:string):VoiceCue|null{
 if(speaker==='narrator'||speaker==='self')return null;
 const clip=clips.find(candidate=>candidate.speaker===speaker&&candidate.text===text);
 return clip?{key:JSON.stringify([speaker,text]),src:clip.src}:null;
}

/** One live line at a time. Old promises/events cannot revive a skipped line. */
export class DialogueVoice{
 private cue:VoiceCue|null=null;
 private media:HTMLAudioElement|null=null;
 private options:VoiceOptions={enabled:false,paused:false,volume:.7};
 private ticket=0;
 private wait:ReturnType<typeof setTimeout>|null=null;
 private closed=false;
 private current:VoiceStatus='idle';
 constructor(private readonly make:()=>HTMLAudioElement=()=>new Audio(),private readonly onStatus:(status:VoiceStatus)=>void=()=>{}){}
 get status(){return this.current;}
 private get wanted(){return !this.closed&&!!this.cue&&this.options.enabled&&!this.options.paused&&this.options.volume>0;}
 private report(status:VoiceStatus){if(status!==this.current){this.current=status;this.onStatus(status);}}
 private clearWait(){if(this.wait!==null){clearTimeout(this.wait);this.wait=null;}}
 private pause(){this.clearWait();++this.ticket;this.media?.pause();}
 private release(){
  this.clearWait();
  ++this.ticket;
  const media=this.media;this.media=null;
  if(!media)return;
  media.onplaying=null;media.onended=null;media.onerror=null;
  media.pause();media.removeAttribute('src');media.load();
 }
 set(cue:VoiceCue|null,options:VoiceOptions){
  if(this.closed)return;
  const volume=Number.isFinite(options.volume)?Math.min(1,Math.max(0,options.volume)):0;
  this.options={...options,volume};
  if(cue?.key!==this.cue?.key||cue?.src!==this.cue?.src){
   this.release();this.cue=cue;this.report(cue?'ready':'idle');
  }
  if(!cue)return;
  if(this.media)this.media.volume=volume;
  if(!this.wanted){
   this.pause();
   if(!options.enabled||volume===0){
    if(this.media)try{this.media.currentTime=0;}catch{}
    this.report('ready');
   }else if(this.current==='loading'||this.current==='playing')this.report('paused');
   return;
  }
  // Rendering another typed character, or changing volume, never restarts a line.
  // A blocked/missing file requires an explicit retry rather than an effect loop.
  if(this.current==='ready'||this.current==='paused')this.begin();
 }
 private begin(){
  if(!this.wanted||!this.cue)return;
  const ticket=++this.ticket;
  let media:HTMLAudioElement;
  try{
   if(!this.media){this.media=this.make();this.media.preload='metadata';this.media.src=this.cue.src;}
   media=this.media;media.volume=this.options.volume;
  }catch{this.report('unavailable');return;}
  const current=()=>this.wanted&&this.media===media&&ticket===this.ticket;
  const stopStale=()=>{if(this.media!==media||!this.wanted)media.pause();};
  const fail=(error:unknown)=>{
   if(!current()){stopStale();return;}
   // Retire the failing element too: its delayed play promise must not become
   // audible after timeout, and an explicit retry must reload a failed URL.
   this.release();
   this.report(error instanceof Error&&error.name==='NotAllowedError'?'blocked':'unavailable');
  };
  media.onplaying=()=>{if(current()&&this.current==='loading'){this.clearWait();this.report('playing');}};
  media.onended=()=>{if(current()){this.clearWait();this.report('ended');}};
  media.onerror=()=>fail(new Error('Voice resource unavailable'));
  this.report('loading');
  this.clearWait();this.wait=setTimeout(()=>fail(new Error('Voice loading timeout')),12000);
  try{
   // Keep play() synchronous for the explicit replay button's user gesture.
   const playing=media.play();
   Promise.resolve(playing).then(()=>{if(!current()){stopStale();return;}this.clearWait();if(this.current==='loading')this.report('playing');},fail);
  }catch(error){fail(error);}
 }
 replay(){
  if(!this.wanted)return false;
  this.pause();
  if(this.media)try{this.media.currentTime=0;}catch{}
  this.report('ready');this.begin();return true;
 }
 stop(){if(!this.closed){this.release();this.cue=null;this.report('idle');}}
 dispose(){if(!this.closed){this.closed=true;this.release();this.cue=null;this.current='idle';}}
}
