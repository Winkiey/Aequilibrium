import{test}from'node:test';
import assert from'node:assert/strict';
import{ALL_FILM_SCRIPTS,ENDING_FILM_SCRIPTS,OPENING_FILM_SCRIPT,filmCues}from'../.sites-runtime/test-modules/film-scripts.mjs';
import{EPILOGUES}from'../.sites-runtime/test-modules/epilogues.mjs';
import{SCENES,CAST}from'../.sites-runtime/test-modules/visuals.mjs';
import{filmMedia,validFilmMedia,currentFilmCue,subtitlesForFilm}from'../.sites-runtime/test-modules/films.mjs';
test('opening and all twelve endings have individually authored motion, identity and sound briefs',()=>{
 assert.equal(ALL_FILM_SCRIPTS.length,13);assert.deepEqual(Object.keys(ENDING_FILM_SCRIPTS).sort(),Object.keys(EPILOGUES).sort());assert.equal(OPENING_FILM_SCRIPT.duration,64);
 for(const f of ALL_FILM_SCRIPTS){assert.equal(f.duration,f.kind==='opening'?64:80);assert.equal(f.shots.length,f.kind==='opening'?8:10);for(const s of f.shots){assert.ok(SCENES[s.scene]);assert.ok(s.cast.every(id=>CAST[id]));assert.ok(s.action.trim().length>0);assert.ok(s.caption.trim().length>0&&s.caption.length<=60);assert.ok(s.sound.trim().length>0);}}
 assert.equal(ALL_FILM_SCRIPTS.reduce((n,f)=>n+f.shots.length,0),128);
});
test('film captions cover their actual duration without gaps and can follow measured export timing',()=>{
 for(const f of ALL_FILM_SCRIPTS){const cues=filmCues(f);assert.equal(cues[0].start,0);assert.equal(cues.at(-1).end,f.duration);assert.equal(currentFilmCue(cues,-1),'');assert.equal(currentFilmCue(cues,NaN),'');assert.equal(currentFilmCue(cues,f.duration),'');for(let i=1;i<cues.length;i++)assert.equal(cues[i].start,cues[i-1].end);const adjusted=subtitlesForFilm(f,{duration:f.duration-.2});assert.equal(adjusted.at(-1).end,f.duration-.2);}
});
test('a camera montage, malformed captions or missing generated asset cannot become a released motion film',()=>{
 for(const f of ALL_FILM_SCRIPTS)assert.equal(filmMedia(f.id),undefined);
 const valid={id:'opening',src:'/video/opening-real.mp4',poster:'/art/backgrounds/bookshop-night.webp',duration:64,width:1920,height:1080,fps:24,hasAudio:true,sha256:'a'.repeat(64),sourceType:'generated-scene-motion',provider:'unit test metadata, not a released file'};
 assert.equal(validFilmMedia(valid),true);assert.equal(validFilmMedia({...valid,sourceType:'camera-montage'}),false);assert.equal(validFilmMedia({...valid,captions:{}}),false);assert.equal(validFilmMedia({...valid,src:'/video/../secret.mp4'}),false);assert.equal(validFilmMedia({...valid,captions:[{start:0,end:40,text:'a'},{start:30,end:64,text:'b'}]}),false);
});
test('film metadata keeps the current ending title and only resolves the requested known ending',()=>{
 const ids=new Set();for(const[name,f]of Object.entries(ENDING_FILM_SCRIPTS)){assert.equal(f.title,name);assert.equal(Array.from(name).length,4);assert.ok(!ids.has(f.id));ids.add(f.id);}assert.equal(ENDING_FILM_SCRIPTS['unknown'],undefined);
});
