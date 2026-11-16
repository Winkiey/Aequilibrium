import{test}from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import React from'react';
import{renderToStaticMarkup}from'react-dom/server';
import{FilmPlayer}from'../.sites-runtime/test-modules/FilmPlayer.mjs';
import{FilmPlayer as FilmController}from'../.sites-runtime/test-modules/FilmPlayer.controller.mjs';
import*as filmRuntime from'./film-player-runtime.mjs';
import{ALL_FILM_SCRIPTS,ENDING_FILM_SCRIPTS,OPENING_FILM_SCRIPT,filmCues}from'../.sites-runtime/test-modules/film-scripts.mjs';
import{EPILOGUES}from'../.sites-runtime/test-modules/epilogues.mjs';
import{SCENES,CAST}from'../.sites-runtime/test-modules/visuals.mjs';
import{filmMedia,validFilmMedia,currentFilmCue,subtitlesForFilm,filmVoiceLevel}from'../.sites-runtime/test-modules/films.mjs';
test('opening and all twelve endings have individually authored motion, identity and sound briefs',()=>{
 assert.equal(ALL_FILM_SCRIPTS.length,13);assert.deepEqual(Object.keys(ENDING_FILM_SCRIPTS).sort(),Object.keys(EPILOGUES).sort());assert.equal(OPENING_FILM_SCRIPT.duration,64);
 for(const f of ALL_FILM_SCRIPTS){assert.equal(f.duration,f.kind==='opening'?64:80);assert.equal(f.shots.length,f.kind==='opening'?8:10);for(const s of f.shots){assert.ok(SCENES[s.scene]);assert.ok(s.cast.every(id=>CAST[id]));assert.ok(s.action.trim().length>0);assert.ok(s.caption.trim().length>0&&s.caption.length<=60);assert.ok(s.sound.trim().length>0);}}
 assert.equal(ALL_FILM_SCRIPTS.reduce((n,f)=>n+f.shots.length,0),128);
});
test('film captions cover their actual duration without gaps and can follow measured export timing',()=>{
 for(const f of ALL_FILM_SCRIPTS){const cues=filmCues(f);assert.equal(cues[0].start,0);assert.equal(cues.at(-1).end,f.duration);assert.equal(currentFilmCue(cues,-1),'');assert.equal(currentFilmCue(cues,NaN),'');assert.equal(currentFilmCue(cues,f.duration),'');for(let i=1;i<cues.length;i++)assert.equal(cues[i].start,cues[i-1].end);const adjusted=subtitlesForFilm(f,{duration:f.duration-.2});assert.equal(adjusted.at(-1).end,f.duration-.2);}
});
test('a camera montage, malformed captions or missing generated asset cannot become a released motion film',()=>{
 for(const f of ALL_FILM_SCRIPTS.filter(f=>f.kind!=='opening'))assert.equal(filmMedia(f.id),undefined);
 assert.equal(filmMedia('unknown'),undefined);
 const valid={id:'opening',src:'/video/opening-real.mp4',poster:'/art/backgrounds/bookshop-night.webp',duration:64,width:1920,height:1080,fps:24,hasAudio:true,sha256:'a'.repeat(64),sourceType:'generated-scene-motion',provider:'unit test metadata, not a released file'};
 assert.equal(validFilmMedia(valid),true);assert.equal(validFilmMedia({...valid,sourceType:'camera-montage'}),false);assert.equal(validFilmMedia({...valid,captions:{}}),false);assert.equal(validFilmMedia({...valid,src:'/video/../secret.mp4'}),false);assert.equal(validFilmMedia({...valid,captions:[{start:0,end:40,text:'a'},{start:30,end:64,text:'b'}]}),false);
});
test('only a timed opening may use the short film duration contract',()=>{
 const opening=filmMedia('opening');assert.ok(opening);assert.equal(opening.duration,23);assert.equal(opening.hasAudio,true);assert.equal(opening.width,2560);assert.equal(opening.height,1440);assert.equal(opening.captionPlacement,'gutter');
 for(const duration of [19.99,0,-1,NaN])assert.equal(validFilmMedia({...opening,duration}),false);
 assert.equal(validFilmMedia({...opening,captions:undefined}),false);assert.equal(validFilmMedia({...opening,captions:[]}),false);
 assert.equal(validFilmMedia({...opening,id:'ending-ordinary'}),false);
 assert.equal(validFilmMedia({...opening,captionPlacement:'moving'}),false);
 assert.equal(validFilmMedia({...opening,captions:[{start:0,end:3,text:' '}]}),false);
 assert.equal(validFilmMedia({...opening,duration:64,captions:undefined}),true,'existing long-form contract remains valid');
});
test('short opening uses its own narration captions rather than rescaling the archived long storyboard',()=>{
 const opening=filmMedia('opening'),cues=subtitlesForFilm(OPENING_FILM_SCRIPT,opening);
 assert.equal(cues.length,4);assert.equal(currentFilmCue(cues,.3),'澄港，初秋。今晚，书屋还亮着灯。');
 assert.equal(currentFilmCue(cues,5.3),'白天，你在印刷厂校书，攒下了十二万元。');
 assert.equal(currentFilmCue(cues,10.3),'程姨准备去南方住一阵。');assert.equal(currentFilmCue(cues,21),'');
});
test('opening narration volume preserves saved zero and clamps malformed values',()=>{
 assert.equal(filmVoiceLevel(0),0);assert.equal(filmVoiceLevel(.4),.4);assert.equal(filmVoiceLevel(-1),0);assert.equal(filmVoiceLevel(2),1);assert.equal(filmVoiceLevel(NaN),.7);assert.equal(filmVoiceLevel(),.7);
});
test('real opening markup has one subtitle region, separate chrome and a muted zero-volume path',()=>{
 const media=filmMedia('opening'),html=renderToStaticMarkup(React.createElement(FilmPlayer,{media,script:OPENING_FILM_SCRIPT,sound:true,voiceVolume:0,reducedMotion:true,onFinish(){},onFallback(){}}));
 assert.equal((html.match(/class="motion-film-caption"/g)??[]).length,1);assert.match(html,/film-gutter/);assert.match(html,/film-picture-area/);assert.match(html,/muted=""/);assert.match(html,/playsInline=""/i);assert.match(html,/preload="metadata"/);assert.match(html,/播放影片/);assert.match(html,/影片播放位置/);
});
test('released opening bytes match their fingerprint and include progressive H264 video plus narration',()=>{
 const media=filmMedia('opening'),file=readFileSync('public'+media.src),poster=readFileSync('public'+media.poster);
 assert.equal(createHash('sha256').update(file).digest('hex'),media.sha256);assert.equal(file.toString('ascii',4,8),'ftyp');assert.ok(poster.length>0);
 const atoms=[];for(let offset=0;offset+8<=file.length;){const size=file.readUInt32BE(offset);assert.ok(size>=8&&offset+size<=file.length);atoms.push({type:file.toString('ascii',offset+4,offset+8),offset,size});offset+=size;}
 assert.ok(atoms.findIndex(a=>a.type==='moov')<atoms.findIndex(a=>a.type==='mdat'),'fast-start metadata precedes media');
 assert.ok(file.includes(Buffer.from('avc1')));assert.ok(file.includes(Buffer.from('mp4a')));assert.ok(file.includes(Buffer.from('soun')));
 const record=JSON.parse(readFileSync('docs/films/opening-short.production.json','utf8'));assert.equal(record.bytes,file.length);assert.equal(record.film.sha256,media.sha256);assert.equal(record.narration.cues.length,4);assert.equal(record.narration.sampleRate,48000);assert.equal(record.newCloudRequestsForNarration,0);
});
test('metadata-only film loading requests playback once, preserves zero volume and releases its decoder',async()=>{
 const previous=globalThis.document;globalThis.document={addEventListener(){},removeEventListener(){}};
 try{
  filmRuntime.reset();const props={media:filmMedia('opening'),script:OPENING_FILM_SCRIPT,sound:true,voiceVolume:0,onFinish(){},onFallback(){}};
  const root=FilmController(props),node=filmRuntime.find(root,n=>n.type==='video');let plays=0,pauses=0,loads=0,removed=0;
  const video={duration:23,paused:true,volume:1,play(){plays++;this.paused=false;return Promise.resolve();},pause(){pauses++;this.paused=true;},load(){loads++;},removeAttribute(name){assert.equal(name,'src');removed++;}};
  node.props.ref.current=video;const cleanups=filmRuntime.runEffects();assert.equal(video.volume,0);assert.equal(node.props.muted,true);
  node.props.onLoadedMetadata({currentTarget:video});assert.equal(plays,1,'do not wait for canplay to request data');node.props.onCanPlay();assert.equal(plays,1);await Promise.resolve();
  node.props.onPause();filmRuntime.beginRender();const paused=FilmController(props);assert.ok(filmRuntime.find(paused,n=>n.type==='div'&&n.props.className==='film-play-prompt'),'even a pause at time zero exposes a play action');
  for(const cleanup of cleanups)cleanup();assert.ok(pauses>=1);assert.equal(loads,1);assert.equal(removed,1);
 }finally{globalThis.document=previous;}
});
test('reduced motion and portrait pause keep metadata and canplay from starting the film',()=>{
 const previous=globalThis.document;globalThis.document={addEventListener(){},removeEventListener(){}};
 try{for(const guard of [{reducedMotion:true},{paused:true}]){
  filmRuntime.reset();const root=FilmController({media:filmMedia('opening'),script:OPENING_FILM_SCRIPT,onFinish(){},onFallback(){},...guard});
  const node=filmRuntime.find(root,n=>n.type==='video');let plays=0;const video={duration:23,paused:true,play(){plays++;return Promise.resolve();},pause(){},removeAttribute(){},load(){}};
  node.props.ref.current=video;const cleanup=filmRuntime.runEffects();node.props.onLoadedMetadata({currentTarget:video});node.props.onCanPlay();assert.equal(plays,0);cleanup.forEach(fn=>fn());
 }}finally{globalThis.document=previous;}
});
test('film metadata keeps the current ending title and only resolves the requested known ending',()=>{
 const ids=new Set();for(const[name,f]of Object.entries(ENDING_FILM_SCRIPTS)){assert.equal(f.title,name);assert.equal(Array.from(name).length,4);assert.ok(!ids.has(f.id));ids.add(f.id);}assert.equal(ENDING_FILM_SCRIPTS['unknown'],undefined);
});
