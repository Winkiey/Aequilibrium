import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SPOKEN_CLIPS} from '../.sites-runtime/test-modules/voice-assets.generated.mjs';
import {spokenCue} from '../.sites-runtime/test-modules/dialogue-voice.mjs';
import {STORYBOARDS} from '../.sites-runtime/test-modules/cinematic-content.mjs';
import {CAST,getScript,outcomeBeats} from '../.sites-runtime/test-modules/visuals.mjs';
import {MAIN_REVISED_BEATS} from '../.sites-runtime/test-modules/narrative-content.mjs';
import {SHOP_OUTCOMES} from '../.sites-runtime/test-modules/shop-stories.mjs';
import {BANK_GREETING} from '../.sites-runtime/test-modules/place-dialogue.mjs';
import {createGame} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,materialize,SIDE_EVENTS,CHAPTER_EVENTS} from '../.sites-runtime/test-modules/stories.mjs';
import {prepareNarrative} from '../.sites-runtime/test-modules/narrative.mjs';
import {EPILOGUES,epilogueScript} from '../.sites-runtime/test-modules/epilogues.mjs';
import {resolveStaging} from '../.sites-runtime/test-modules/staging.mjs';
import {OUTCOME_REVISION,outcomeScene} from '../.sites-runtime/test-modules/visuals.mjs';
import {CinematicPlayer} from '../.sites-runtime/test-modules/CinematicPlayer.mjs';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const key=b=>JSON.stringify([b.speaker,b.text]);

test('the real player passes the staged voice treatment through every opening and both authored outcomes',()=>{
 const counts={telephone:0,letter:0,room:0},noop=()=>{};
 for(const id of Object.keys(STORYBOARDS)){
  const game=createGame(20261108);game.quarter=id.startsWith('main-')?Number(id.slice(5)):id.startsWith('chapter-')?Number(id.slice(8)):5;
  const raw=id.startsWith('main-')?mainEvent(game):[...CHAPTER_EVENTS,...SIDE_EVENTS].find(e=>e.id===id),event=prepareNarrative(game,materialize(raw,game),2),script=getScript(event);
  for(const phase of ['story','outcome'])for(const branch of phase==='story'?[0]:[0,1]){
   const beats=phase==='story'?(event.opening??script.beats):outcomeBeats(event,script,branch),index=beats.findIndex(b=>!!spokenCue(SPOKEN_CLIPS,b.speaker,b.text));
   const cursor=Math.max(0,index);
   const direction=resolveStaging({eventId:id,phase,branch,beat:beats[cursor],index:cursor,script,scene:phase==='outcome'?outcomeScene(id,branch,script.scene,event):script.scene}),expected=direction.channel==='phone'?'telephone':'natural';
   const html=renderToStaticMarkup(h(CinematicPlayer,{game,event,answered:phase==='outcome'?branch:null,progress:{eventId:id,phase,index:cursor,choice:phase==='outcome'?branch:null,inspected:false,outcomeRevision:OUTCOME_REVISION},sound:true,onChoose:()=>false,onFinish:noop,onLedger:noop,onProgress:noop}));
   if(index<0){assert.ok(beats.every(b=>['narrator','self'].includes(b.speaker)),`${id}: do not silently accept missing actor recordings`);assert.ok(!html.includes('data-voice-treatment='),'unvoiced narration has no playback button');continue;}
   assert.ok(html.includes(`data-voice-treatment="${expected}"`),`${id}/${phase}/${branch} must use ${expected}`);
   counts[expected==='telephone'?'telephone':direction.channel]++;
  }
 }
 for(const [channel,count] of Object.entries(counts))assert.ok(count>0,`${channel}: the staged recordings must exercise this channel`);
});
test('all main, daily, conditional, legacy and ending character beats have exact voice coverage',()=>{
 const required=new Map(),collect=beats=>{for(const beat of beats){if(['narrator','self'].includes(beat.speaker))continue;required.set(key(beat),beat);assert.ok(spokenCue(SPOKEN_CLIPS,beat.speaker,beat.text),key(beat));}};
 for(const script of Object.values(STORYBOARDS)){collect(script.beats);script.outcomes.forEach(collect);}
 Object.values(MAIN_REVISED_BEATS).forEach(collect);Object.values(SHOP_OUTCOMES).forEach(branches=>branches.forEach(collect));
 const base=createGame(20261108);
 for(const legacy of [false,true])for(const owner of [false,true])for(const roof of ['unrepaired','patched','sound'])for(const revision of [1,2])for(const id of Object.keys(STORYBOARDS)){
  const game=structuredClone(base);if(legacy)delete game.shop;else game.shop.roof=roof;game.flags.shop=owner?1:0;game.flags.printLoan=1;game.cash=250000;
  game.quarter=id.startsWith('main-')?Number(id.slice(5)):id.startsWith('chapter-')?Number(id.slice(8)):5;
  const raw=id.startsWith('main-')?mainEvent(game):[...CHAPTER_EVENTS,...SIDE_EVENTS].find(e=>e.id===id),event=prepareNarrative(game,materialize(raw,game),revision),script=getScript(event);
  collect(event.opening??script.beats);for(const branch of [0,1])collect(outcomeBeats(event,script,branch));
 }
 for(const ending of Object.keys(EPILOGUES))collect(epilogueScript(base,ending).beats);collect([BANK_GREETING]);
 assert.equal(required.size,264);assert.equal(SPOKEN_CLIPS.length,required.size);assert.equal(new Set(SPOKEN_CLIPS.map(key)).size,required.size);
 assert.equal(new Set(SPOKEN_CLIPS.map(c=>c.speaker)).size,Object.keys(CAST).length);
 assert.ok(SPOKEN_CLIPS.every(c=>required.has(key(c))));assert.equal(SPOKEN_CLIPS.filter(c=>c.essential).length,4);
});
test('every shipped voice uses a unique content-addressed file and its frozen speaker reference',async()=>{
 const proof=JSON.parse(await readFile('docs/VOICE_ASSETS.json','utf8'));assert.equal(proof.status,'all-dialogue-produced');assert.equal(proof.records.length,SPOKEN_CLIPS.length);
 const refs=new Map(),paths=new Set();let bytes=0;
 for(const clip of SPOKEN_CLIPS){
  assert.match(clip.src,/^\/audio\/dialogue\/[a-z]+\.[a-f0-9]{12}\.[a-f0-9]{12}\.mp3$/);assert.ok(!paths.has(clip.src));paths.add(clip.src);
  const record=proof.records.find(r=>r.speaker===clip.speaker&&r.text===clip.text);assert.ok(record);assert.equal(record.src,clip.src);assert.equal(record.sampleRate,24000);assert.ok(record.seconds>1&&record.seconds<40);
  const body=await readFile('public'+clip.src);assert.equal(body.length,record.bytes);assert.equal(createHash('sha256').update(body).digest('hex'),record.sha256);assert.ok(clip.src.endsWith('.'+record.sha256.slice(0,12)+'.mp3'));bytes+=body.length;
  assert.deepEqual(record.synthesisText.match(/\p{L}|\p{N}/gu),record.text.match(/\p{L}|\p{N}/gu),'synthesis punctuation cannot alter the displayed words');
  if(refs.has(clip.speaker))assert.equal(record.referenceSha256,refs.get(clip.speaker),'one frozen identity per actor');else refs.set(clip.speaker,record.referenceSha256);
 }
 assert.equal(bytes,proof.totalBytes);assert.equal(refs.size,10);
});
