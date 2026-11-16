/** Bounded playback requests. Timers observe loading; they never skip the story. */
export type FilmPlaybackState={playing:boolean;buffering:boolean;blocked:boolean;slow:boolean;error:boolean};
type VideoPort=Pick<HTMLVideoElement,'play'|'pause'|'load'|'removeAttribute'|'src'|'currentTime'|'duration'|'paused'>;
export class FilmPlayback{
 private generation=0;private request=0;private pending=false;private disposed=false;private finished=false;
 private intent=false;private suspended=false;private position=0;private restore=false;private timer:ReturnType<typeof setTimeout>|undefined;
 private lastTime=0;
 constructor(private video:VideoPort,private update:(state:Partial<FilmPlaybackState>)=>void,private timeout=8000){}
 get wantsPlayback(){return this.intent;}
 private emit(state:Partial<FilmPlaybackState>){if(!this.disposed)this.update(state);}
 private clear(){clearTimeout(this.timer);this.timer=undefined;}
 private watch(){if(this.timer!==undefined)return;if(this.intent&&!this.suspended&&!this.disposed)this.timer=setTimeout(()=>{this.timer=undefined;if(this.intent&&!this.suspended&&!this.disposed)this.emit({slow:true,buffering:false});},this.timeout);}
 source(url:string,position=0,resume=true){
  if(this.disposed)return;this.generation++;this.request++;this.pending=false;this.finished=false;this.clear();
  this.video.pause();this.intent=resume;this.position=Math.max(0,Number.isFinite(position)?position:0);this.restore=this.position>0;this.lastTime=this.position;
  this.video.src=url;this.video.load();this.emit({playing:false,buffering:resume&&!this.suspended,blocked:!resume,slow:false,error:false});
  if(resume)this.play();
 }
 metadata(){
  if(this.disposed)return;
  if(this.restore){this.restore=false;const d=this.video.duration;try{this.video.currentTime=Math.min(this.position,Number.isFinite(d)&&d>0?Math.max(0,d-.05):this.position);}catch{this.fail();return;}}
  if(this.intent&&!this.pending&&this.video.paused)this.play();
 }
 play(){
  if(this.disposed||this.suspended)return;this.intent=true;this.emit({blocked:false,slow:false,error:false,buffering:true});
  if(this.pending)return;this.pending=true;const generation=this.generation,request=++this.request;this.watch();
  let promise:Promise<void>;try{promise=this.video.play();}catch{this.pending=false;this.clear();this.emit({blocked:true,buffering:false});return;}
  void Promise.resolve(promise).then(()=>{
   if(this.disposed)return;
   if(generation!==this.generation||request!==this.request){if(!this.intent||this.suspended)this.video.pause();return;}
   this.pending=false;if(!this.intent||this.suspended){this.video.pause();return;}this.emit({blocked:false});
  }).catch(error=>{
   if(this.disposed||generation!==this.generation||request!==this.request)return;
   this.pending=false;this.clear();this.intent=false;
   this.emit({playing:false,buffering:false,blocked:true,slow:false,error:error?.name==='NotSupportedError'});
  });
 }
 pause(){if(this.disposed)return;this.intent=false;this.request++;this.pending=false;this.clear();this.video.pause();this.emit({playing:false,buffering:false,blocked:true,slow:false});}
 toggle(){if(this.intent&&(this.pending||!this.video.paused))this.pause();else this.play();}
 suspend(value:boolean){if(this.disposed||this.suspended===value)return;this.suspended=value;if(value){this.request++;this.pending=false;this.clear();this.video.pause();this.emit({playing:false,buffering:false,slow:false});}else if(this.intent)this.play();}
 playing(){if(this.disposed)return;if(!this.intent||this.suspended){this.video.pause();return;}this.pending=false;this.clear();this.watch();this.emit({playing:true,buffering:false,blocked:false,slow:false});}
 waiting(){if(this.disposed||!this.intent||this.suspended)return;this.emit({buffering:true});this.watch();}
 progress(){if(this.disposed)return;const t=this.video.currentTime;if(t>this.lastTime+.01){this.lastTime=t;if(this.intent&&!this.suspended){this.emit({slow:false,buffering:false});this.clear();this.watch();}}}
 paused(){if(this.disposed)return;this.emit({playing:false});if(!this.suspended&&!this.pending&&this.video.paused){this.intent=false;this.clear();this.emit({blocked:true,buffering:false,slow:false});}}
 fail(){if(this.disposed)return;this.intent=false;this.request++;this.pending=false;this.clear();this.video.pause();this.emit({error:true,playing:false,buffering:false,slow:false});}
 ended(){if(this.disposed||this.finished)return false;this.finished=true;this.intent=false;this.clear();this.emit({playing:false,buffering:false,slow:false});return true;}
 dispose(){if(this.disposed)return;this.disposed=true;this.intent=false;this.request++;this.clear();this.video.pause();this.video.removeAttribute('src');this.video.load();}
}
