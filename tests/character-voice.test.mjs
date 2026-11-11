import test from 'node:test';
import assert from 'node:assert/strict';
import {DialogueVoice,spokenCue} from '../.sites-runtime/test-modules/dialogue-voice.mjs';
const on={enabled:true,paused:false,volume:.7},off={...on,enabled:false};
const a={key:'actor + full first line',src:'/a.mp3'},b={key:'actor + full next line',src:'/b.mp3'};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
class Media{
 src='';preload='';volume=1;currentTime=0;plays=0;pauses=0;loads=0;onended=null;onplaying=null;onerror=null;pending=[];
 play(){this.plays++;return new Promise((resolve,reject)=>this.pending.push({resolve,reject}));}
 pause(){this.pauses++;}
 removeAttribute(name){if(name==='src')this.src='';}
 load(){this.loads++;}
}
function harness(){const media=[],states=[];const player=new DialogueVoice(()=>{const item=new Media();media.push(item);return item;},s=>states.push(s));return{player,media,states};}

test('optional voice is lazy: disabled, zero and paused lines allocate no media',()=>{
 const {player,media}=harness();player.set(a,off);player.set(a,{...on,volume:0});player.set(a,{...on,paused:true});
 assert.equal(media.length,0);assert.equal(player.status,'ready');player.dispose();
});
test('matching uses the actual full actor/text pair; revised or narrated text stays silent',()=>{
 const clips=[{speaker:'cheng',text:'钥匙先放你那里。',src:'/cheng.mp3'},{speaker:'he',text:'钥匙先放你那里。',src:'/he.mp3'}];
 assert.equal(spokenCue(clips,'cheng','钥匙先放你那里。').src,'/cheng.mp3');
 assert.equal(spokenCue(clips,'he','钥匙先放你那里。').src,'/he.mp3');
 assert.equal(spokenCue(clips,'cheng','钥匙先放你那里，想清楚再说。'),null);
 assert.equal(spokenCue(clips,'cheng','钥匙'),null);
 assert.equal(spokenCue([{speaker:'narrator',text:'旁白',src:'/no.mp3'}],'narrator','旁白'),null);
 assert.equal(spokenCue([{speaker:'self',text:'我',src:'/no.mp3'}],'self','我'),null);
});
test('typing reveal and volume updates do not replay the same sentence',async()=>{
 const {player,media}=harness();player.set(a,on);const first=media[0];first.pending[0].resolve();await tick();
 for(let n=0;n<40;n++)player.set({...a},{...on,volume:.4});
 assert.equal(media.length,1);assert.equal(first.plays,1);assert.equal(first.volume,.4);assert.equal(player.status,'playing');
 first.onended();player.set(a,on);assert.equal(first.plays,1);assert.equal(player.status,'ended');player.dispose();
});
test('rapid next retires the old media; late resolve/end/error cannot overwrite the current line',async()=>{
 const {player,media}=harness();player.set(a,on);const first=media[0],ended=first.onended,error=first.onerror,playing=first.onplaying;
 player.set(b,on);const second=media[1];second.pending[0].resolve();await tick();const before=second.pauses;
 first.pending[0].resolve();ended();error();playing();await tick();
 assert.equal(player.status,'playing');assert.ok(first.pauses>=2);assert.equal(first.src,'');assert.equal(first.loads,1);assert.equal(second.pauses,before);player.dispose();
});
test('pause resumes the same position; a late pre-pause promise cannot silence the resumed audio',async()=>{
 const {player,media}=harness();player.set(a,on);const item=media[0];item.currentTime=2.25;
 player.set(a,{...on,paused:true});assert.equal(player.status,'paused');assert.equal(item.currentTime,2.25);
 player.set(a,on);assert.equal(item.plays,2);item.pending[1].resolve();await tick();const before=item.pauses;
 item.pending[0].resolve();await tick();assert.equal(item.pauses,before);assert.equal(player.status,'playing');assert.equal(item.currentTime,2.25);player.dispose();
});
test('turn off during unlock keeps late play completion silent and resets only voice position',async()=>{
 const {player,media}=harness();player.set(a,on);const item=media[0];item.currentTime=1.5;player.set(a,off);const before=item.pauses;
 item.pending[0].resolve();await tick();assert.ok(item.pauses>before);assert.equal(item.currentTime,0);assert.equal(player.status,'ready');player.dispose();
});
test('autoplay denial is recoverable only by a deliberate replay, with no render retry loop',async()=>{
 const {player,media}=harness();player.set(a,on);const item=media[0];const denied=Object.assign(new Error('gesture needed'),{name:'NotAllowedError'});
 item.pending[0].reject(denied);await tick();assert.equal(player.status,'blocked');
 player.set(a,on);player.set(a,{...on,volume:.6});assert.equal(item.plays,1);
 assert.equal(player.replay(),true);assert.equal(media.length,2);assert.equal(media[1].plays,1);media[1].pending[0].resolve();await tick();assert.equal(player.status,'playing');player.dispose();
});
test('a missing file remains optional, does not loop downloads, and a next line can play',async()=>{
 const {player,media}=harness();player.set(a,on);const first=media[0];first.onerror();first.pending[0].reject(new Error('404'));await tick();
 assert.equal(player.status,'unavailable');for(let i=0;i<5;i++)player.set(a,on);assert.equal(first.plays,1);
 player.set(b,on);media[1].pending[0].resolve();await tick();assert.equal(player.status,'playing');player.dispose();
});
test('narration/choice/return stop clears the line; stale promises cannot revive it',async()=>{
 const {player,media}=harness();player.set(a,on);const item=media[0];player.set(null,on);item.pending[0].resolve();await tick();
 assert.equal(player.status,'idle');assert.equal(item.src,'');assert.equal(item.loads,1);player.stop();player.dispose();
});
test('manual replay restarts an ended line without duplicating its media',async()=>{
 const {player,media}=harness();player.set(a,on);const item=media[0];item.pending[0].resolve();await tick();item.currentTime=6;item.onended();
 assert.equal(player.replay(),true);assert.equal(item.currentTime,0);assert.equal(item.plays,2);assert.equal(media.length,1);
 item.pending[1].resolve();await tick();assert.equal(player.status,'playing');player.dispose();
});
test('unmount cannot notify or restart after a delayed play/error callback',async()=>{
 const {player,media,states}=harness();player.set(a,on);const item=media[0],error=item.onerror;player.dispose();const count=states.length;
 item.pending[0].reject(new Error('late'));error();player.set(b,on);await tick();assert.equal(states.length,count);assert.equal(media.length,1);assert.equal(item.src,'');assert.equal(player.status,'idle');
});
test('invalid volume never escapes the valid gain range or triggers unwanted playback',()=>{
 const {player,media}=harness();player.set(a,{...on,volume:NaN});assert.equal(media.length,0);
 player.set(a,{...on,volume:99});assert.equal(media[0].volume,1);player.set(a,{...on,volume:-1});assert.equal(media[0].volume,0);assert.equal(player.replay(),false);player.dispose();
});
test('explicit retry creates a fresh resource after an unavailable file',async()=>{
 const {player,media}=harness();player.set(a,on);const failed=media[0];failed.onerror();assert.equal(player.status,'unavailable');assert.equal(failed.src,'');
 assert.equal(player.replay(),true);assert.equal(media.length,2);assert.equal(media[1].src,a.src);media[1].pending[0].resolve();await tick();
 assert.equal(player.status,'playing');failed.pending[0].resolve();await tick();assert.equal(player.status,'playing');assert.ok(failed.pauses>0);player.dispose();
});
test('bounded load timeout retires the element and a late play cannot revive it',async()=>{
 const prior={setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};let id=0;const timers=new Map();
 globalThis.setTimeout=fn=>{timers.set(++id,fn);return id;};globalThis.clearTimeout=key=>timers.delete(key);
 const {player,media}=harness();try{
  player.set(a,on);assert.equal(timers.size,1);[...timers.values()][0]();assert.equal(player.status,'unavailable');assert.equal(timers.size,0);assert.equal(media[0].src,'');
  media[0].pending[0].resolve();await tick();assert.equal(player.status,'unavailable');
  player.replay();media[1].pending[0].resolve();await tick();assert.equal(player.status,'playing');assert.equal(timers.size,0);
 }finally{player.dispose();Object.assign(globalThis,prior);}
});
test('two actual beats may reuse one clip while each still starts its own performance',async()=>{
 const {player,media}=harness();const clips=[{speaker:'cheng',text:'好。',src:'/cheng.mp3'}],clip=spokenCue(clips,'cheng','好。');
 player.set({...clip,key:'story:2:'+clip.key},on);media[0].pending[0].resolve();await tick();
 player.set({...clip,key:'outcome:1:'+clip.key},on);assert.equal(media.length,2);assert.equal(media[0].src,'');assert.equal(media[1].src,'/cheng.mp3');player.dispose();
});

import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {normalizeAudioPreferences,loadAudioPreferences,storeAudioPreferences,audioPreferenceKey} from '../.sites-runtime/test-modules/audio-settings.mjs';
import {CharacterSpeech} from '../.sites-runtime/test-modules/CharacterSpeech.mjs';
const require=createRequire(new URL('../package.json',import.meta.url));
const {createElement}=await import(pathToFileURL(require.resolve('react')));
const {renderToStaticMarkup}=await import(pathToFileURL(require.resolve('react-dom/server')));
const settingsCue={key:'cheng + exact full text',src:'/audio/dialogue/test.mp3'};

test('legacy two-slider preferences keep old zeros and gain a default voice level',()=>{
 assert.deepEqual(normalizeAudioPreferences({version:1,environment:0,music:0}),{version:1,environment:0,music:0,voice:70});
 assert.deepEqual(normalizeAudioPreferences({version:1,environment:12,music:34,voice:0,enabled:true}),{version:1,environment:12,music:34,voice:0});
 for(const bad of [-1,101,NaN,Infinity,'50',null])assert.equal(normalizeAudioPreferences({version:1,environment:12,music:34,voice:bad}).voice,70);
});
test('voice preference is isolated from saves and playtest, with muted values preserved',()=>{
 const data=new Map([['aequilibrium.save.v1','unchanged']]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 storeAudioPreferences(storage,audioPreferenceKey(),{version:1,environment:0,music:42,voice:0});
 storeAudioPreferences(storage,audioPreferenceKey(true),{version:1,environment:20,music:10,voice:88});
 assert.equal(loadAudioPreferences(storage,audioPreferenceKey()).voice,0);assert.equal(loadAudioPreferences(storage,audioPreferenceKey(true)).voice,88);
 assert.equal(data.get('aequilibrium.save.v1'),'unchanged');assert.equal(data.size,3);
});
test('speech adapter is SSR safe and adds no empty control for an unvoiced beat',()=>{
 assert.equal(renderToStaticMarkup(createElement(CharacterSpeech,{cue:null,enabled:true,paused:false,volume:.7,name:'旁白'})),'');
 assert.doesNotThrow(()=>renderToStaticMarkup(createElement(CharacterSpeech,{cue:settingsCue,enabled:true,paused:false,volume:.7,name:'程姨'})));
});
test('speech control offers deliberate sound enabling, and paused or muted speech cannot replay',()=>{
 const render=patch=>renderToStaticMarkup(createElement(CharacterSpeech,{cue:settingsCue,enabled:false,paused:false,volume:.7,name:'程姨',...patch}));
 assert.match(render({}),/aria-label="开启声音 · 程姨"/u);assert.doesNotMatch(render({}),/disabled/u);
 assert.match(render({paused:true}),/disabled/u);assert.match(render({volume:0}),/disabled/u);
 assert.match(render({enabled:true}),/aria-label="重听这一句 · 程姨"/u);
});
