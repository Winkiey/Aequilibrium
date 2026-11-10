import {ambienceFor,noteHz,seasonIndex,SEASON_SCORES,type AudioScene} from './soundtrack';

function holdGain(param:AudioParam,at:number){
 if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(at);
 else{const value=param.value;param.cancelScheduledValues(at);param.setValueAtTime(value,at);}
}

// Local synthesis: no audio downloads, external API or game RNG.
export class RoomAudio {
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private music:GainNode|null=null;
 private environment:GainNode|null=null;
 private rain:GainNode|null=null;
 private air:GainNode|null=null;
 private buses:GainNode[]=[];
 private persistent:AudioScheduledSourceNode[]=[];
 private voices=new Map<AudioScheduledSourceNode,()=>void>();
 private timer:ReturnType<typeof setInterval>|null=null;
 private cue:AudioScene={season:0,rain:true,outdoors:false,night:true};
 private duckLevel=1;
 private environmentLevel=.35;
 private musicLevel=.42;
 private on=false;
 private nextNote=0;
 private step=0;
 private nextNature=0;
 private epoch=0;
 private wantsPlayback=false;
 private closed=false;
 private readingMode=false;
 private noteWait=.12;
 private natureWait=4;

 async start(){
  if(this.closed)return;this.wantsPlayback=true;
  const epoch=++this.epoch;
  if(!this.context){
   const ctx=new AudioContext();this.context=ctx;
   const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);this.master=master;
   this.environment=ctx.createGain();this.environment.gain.value=0;this.environment.connect(master);
   this.music=ctx.createGain();this.music.gain.value=0;
   const musicCut=ctx.createBiquadFilter();musicCut.type='highpass';musicCut.frequency.value=250;musicCut.Q.value=.45;
   this.music.connect(musicCut);musicCut.connect(master);
   this.buses=SEASON_SCORES.map(()=>{const bus=ctx.createGain();bus.gain.value=0;bus.connect(this.music!);return bus;});
   const buffer=ctx.createBuffer(2,ctx.sampleRate*6,ctx.sampleRate);
   for(let c=0;c<2;c++){
    const data=buffer.getChannelData(c),fade=Math.floor(ctx.sampleRate*.5),raw=new Float32Array(data.length+fade);let brown=0;
    for(let i=0;i<raw.length;i++){brown=(brown+(Math.random()*2-1)*.02)/1.02;raw[i]=brown*3.5;}
    data.set(raw.subarray(fade));
    // Overlap the tail with the discarded lead-in; the loop boundary follows
    // adjacent samples of the same noise, rather than jumping every six seconds.
    for(let i=0;i<fade;i++){const mix=(i+1)/fade;data[data.length-fade+i]=raw[data.length+i]*(1-mix)+raw[i]*mix;}
   }
   const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
   const rainFilter=ctx.createBiquadFilter();rainFilter.type='highpass';rainFilter.frequency.value=750;rainFilter.Q.value=.3;
   const airCut=ctx.createBiquadFilter();airCut.type='highpass';airCut.frequency.value=220;airCut.Q.value=.45;
   const airFilter=ctx.createBiquadFilter();airFilter.type='lowpass';airFilter.frequency.value=950;airFilter.Q.value=.35;
   this.rain=ctx.createGain();this.rain.gain.value=0;this.rain.connect(this.environment);
   this.air=ctx.createGain();this.air.gain.value=0;this.air.connect(this.environment);
   noise.connect(rainFilter);rainFilter.connect(this.rain);noise.connect(airCut);airCut.connect(airFilter);airFilter.connect(this.air);
   noise.start();this.persistent.push(noise);
  }
  const ctx=this.context;await ctx.resume();if(epoch!==this.epoch||ctx!==this.context){if(!this.wantsPlayback&&ctx===this.context)await ctx.suspend();return;}
  if(this.on)return;this.on=true;this.nextNote=ctx.currentTime+this.noteWait;this.nextNature=ctx.currentTime+this.natureWait;
  holdGain(this.master!.gain,ctx.currentTime);
  this.master!.gain.setTargetAtTime(.6*this.duckLevel,ctx.currentTime,1.2);
  this.levels(this.environmentLevel,this.musicLevel);this.applyScene();this.schedule();
  this.timer=setInterval(()=>this.schedule(),200);
 }
 levels(environment:number,music:number){
  const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
  this.environmentLevel=clamp(environment);this.musicLevel=clamp(music);
  if(!this.context||!this.on)return;
  this.environment?.gain.setTargetAtTime(this.environmentLevel*(this.readingMode ? .78 : 1),this.context.currentTime,1.2);
  this.music?.gain.setTargetAtTime(this.musicLevel*(this.readingMode ? .62 : 1),this.context.currentTime,1.2);
 }
 reading(active:boolean){if(this.readingMode===active)return;this.readingMode=active;this.levels(this.environmentLevel,this.musicLevel);}
 scene(cue:AudioScene){
  const next={...cue,season:seasonIndex(cue.season)},changed=next.season!==this.cue.season;
  this.cue=next;if(changed){this.step=0;this.noteWait=.2;this.natureWait=4;if(this.context&&this.on){this.nextNote=this.context.currentTime+.2;this.nextNature=this.context.currentTime+4;}}
  this.applyScene();
 }
 season(index:number){this.scene({...this.cue,season:index});}
 private applyScene(){
  if(!this.context||!this.on)return;const now=this.context.currentTime,ambience=ambienceFor(this.cue);
  this.buses.forEach((bus,i)=>bus.gain.setTargetAtTime(i===this.cue.season?1:0,now,1.8));
  this.rain?.gain.setTargetAtTime(ambience.rain,now,1.8);this.air?.gain.setTargetAtTime(ambience.air,now,1.8);
 }
 duck(level:number){this.duckLevel=Number.isFinite(level)?Math.max(0,Math.min(1,level)):0;if(this.context&&this.on)this.master?.gain.setTargetAtTime(.6*this.duckLevel,this.context.currentTime,.45);}
 private track(source:AudioScheduledSourceNode,env:GainNode){
  const cleanup=()=>{source.onended=null;this.voices.delete(source);source.disconnect();env.disconnect();};this.voices.set(source,cleanup);source.onended=cleanup;
 }
 private piano(midi:number,at:number,bus:GainNode,level=.1){
  const ctx=this.context!;
  [1,2,3].forEach((harmonic,i)=>{
   const osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sine';osc.frequency.value=noteHz(midi)*harmonic;
   const peak=level*[1,.12,.015][i];
   env.gain.setValueAtTime(0,at);env.gain.linearRampToValueAtTime(peak,at+.04);
   env.gain.exponentialRampToValueAtTime(peak*.3,at+.7-i*.12);
   env.gain.exponentialRampToValueAtTime(.00001,at+2.25-i*.3);
   osc.connect(env);env.connect(bus);this.track(osc,env);osc.start(at);osc.stop(at+2.4);
  });
 }
 private nature(at:number){
  const ctx=this.context!,a=ambienceFor(this.cue),level=a.birds||a.insects;if(!level)return;
  // Brief distant calls, rather than a continuous high-pitched insect loop.
  for(let i=0;i<(a.birds?2:3);i++){
   const t=at+i*.27,osc=ctx.createOscillator(),env=ctx.createGain();osc.type='sine';
   osc.frequency.setValueAtTime(a.birds?1950:2400,t);osc.frequency.exponentialRampToValueAtTime(a.birds?2650:2250,t+.12);
   env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(level,t+.03);env.gain.linearRampToValueAtTime(0,t+.16);
   osc.connect(env);env.connect(this.environment!);this.track(osc,env);osc.start(t);osc.stop(t+.18);
  }
 }
 private schedule(){
  if(!this.context||!this.on)return;const now=this.context.currentTime,score=SEASON_SCORES[this.cue.season],bus=this.buses[this.cue.season];
  if(this.nextNote<now-.5)this.nextNote=now+.1;
  while(this.nextNote<now+.5){
   const at=this.nextNote,index=this.step%score.melody.length,chord=score.chords[Math.floor(index/4)];
   // Short right-hand arpeggios leave air between phrases. No sustained bass
   // or detuned drone beneath the dialogue.
   if(index%4===0)chord.forEach((note,i)=>this.piano(note,at+i*.48,bus,.024));
   const note=score.melody[index];if(note!==null)this.piano(note,at,bus,.095);
   this.step++;this.nextNote+=score.pace;
  }
  if(this.nextNature<now+.5){this.nature(Math.max(now+.02,this.nextNature));this.nextNature=now+17+(this.step%3)*4;}
 }
 page(){
  if(!this.context||!this.on)return;const ctx=this.context,osc=ctx.createOscillator(),env=ctx.createGain();osc.type='triangle';osc.frequency.value=660;
  env.gain.setValueAtTime(0,ctx.currentTime);env.gain.linearRampToValueAtTime(.0035,ctx.currentTime+.006);env.gain.exponentialRampToValueAtTime(.00001,ctx.currentTime+.06);
  osc.connect(env);env.connect(this.master!);this.track(osc,env);osc.start();osc.stop(ctx.currentTime+.07);
 }
 async pause(){
  const epoch=++this.epoch;this.wantsPlayback=false;if(this.timer){clearInterval(this.timer);this.timer=null;}
  const ctx=this.context,wasOn=this.on;this.on=false;if(!ctx)return;
  const now=ctx.currentTime;if(wasOn){this.noteWait=Math.max(.12,Math.min(this.nextNote-now,SEASON_SCORES[this.cue.season].pace));this.natureWait=Math.max(1,Math.min(this.nextNature-now,25));}
  const stopping=[...this.voices.keys()];
  if(this.master){holdGain(this.master.gain,now);if(wasOn)this.master.gain.linearRampToValueAtTime(0,now+.08);else this.master.gain.setValueAtTime(0,now);}
  for(const source of stopping){try{source.stop(wasOn?now+.08:now);}catch{}}
  if(wasOn)await new Promise<void>(resolve=>setTimeout(resolve,100));
  for(const source of stopping)this.voices.get(source)?.();
  if(epoch===this.epoch&&ctx===this.context&&!this.wantsPlayback){if(this.master){holdGain(this.master.gain,ctx.currentTime);this.master.gain.setValueAtTime(0,ctx.currentTime);}await ctx.suspend();}
 }
 async close(){
  this.closed=true;
  await this.pause();for(const source of this.persistent){try{source.stop();}catch{}source.disconnect();}this.persistent=[];
  await this.context?.close();this.context=null;this.master=null;this.music=null;this.environment=null;this.air=null;this.rain=null;this.buses=[];
 }
}
