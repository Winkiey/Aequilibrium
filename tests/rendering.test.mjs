import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,endQuarter,choose,validateSave} from '../.sites-runtime/test-modules/engine.mjs';
import {materialize,mainEvent} from '../.sites-runtime/test-modules/stories.mjs';
import {prepareNarrative,previousAnswer,openingReminderLength} from '../.sites-runtime/test-modules/narrative.mjs';
import {shortLines} from '../.sites-runtime/test-modules/dialogue.mjs';
import {freshCollection,rememberIntro,rememberChoice,rememberedOptions,collectionStats} from '../.sites-runtime/test-modules/collection.mjs';
import {CinematicPlayer} from '../.sites-runtime/test-modules/CinematicPlayer.mjs';
import {imageURL,assetSource,prepareImage,imageReady,invalidateImage} from '../.sites-runtime/test-modules/assets.mjs';

const props=(game,event)=>({game,event,answered:null,reducedMotion:true,onChoose:()=>true,onFinish(){},onLedger(){},onProgress(){}});
test('prior choices are contextual data rather than narrator beats',()=>{
 const g=createGame(100),e=materialize(mainEvent(g),g),next=endQuarter(choose(g,e,1,'main')),n=materialize(mainEvent(next),next),prepared=prepareNarrative(next,n,2);
 assert.equal(previousAnswer(next,n).choice,e.options[1].label);assert.ok(prepared.opening.every(b=>!b.text.startsWith('上次在「')));assert.ok(validateSave(next));
});
test('legacy opening reminders skip whole split lines without rewriting raw saved cursors',()=>{
 const text='上次在「没有盖章的订单」，你的答复是：先借给他两万元，写清日期，再留下足够的生活费用。';
 const parts=shortLines(text),real={speaker:'narrator',text:'窗外下着雨。'},beats=[...parts.map(text=>({speaker:'narrator',text})),real];
 const before=structuredClone(beats);assert.equal(openingReminderLength(beats),parts.length);assert.deepEqual(beats,before);assert.equal(openingReminderLength([real]),0);
 const game=createGame(101),event=materialize(mainEvent(game),game);event.opening=beats;
 for(let index=0;index<beats.length;index++){const html=renderToStaticMarkup(h(CinematicPlayer,{...props(game,event),progress:{eventId:event.id,phase:'story',index,choice:null,inspected:false}}));assert.ok(html.includes(real.text));assert.ok(!html.includes(text));}
});
test('memory markers require an actually earned matching answer and never unlock another branch',()=>{
 const g=createGame(102),e=materialize(mainEvent(g),g),intro=rememberIntro(freshCollection(),e),c=rememberChoice(intro,e,1),before=structuredClone(c);
 assert.deepEqual(rememberedOptions(intro,e),[false,false]);assert.deepEqual(rememberedOptions(c,e),[false,true]);
 const changed=structuredClone(e);changed.options[1].label='新的责任条款';assert.deepEqual(rememberedOptions(c,changed),[false,false]);assert.deepEqual(c,before);assert.deepEqual(collectionStats(c),{stories:1,branches:1,endings:0});
});
test('choice history occupies a small outside-plot tag and disappears in replay',()=>{
 const g=createGame(103),e=materialize(mainEvent(g),g),progress={eventId:e.id,phase:'choice',index:0,choice:null,inspected:false};
 const live=renderToStaticMarkup(h(CinematicPlayer,{...props(g,e),progress,remembered:[false,true]}));
 assert.equal((live.match(/class="choice-memory-mark"/g)||[]).length,1);assert.match(live,/曾选/);assert.doesNotMatch(live,/class="cinema-dialogue/);
 const replay=renderToStaticMarkup(h(CinematicPlayer,{...props(g,e),progress,remembered:[true,true],preview:true}));assert.doesNotMatch(replay,/choice-memory-mark/);
});
test('typing uses one text flow with no duplicated absolute text or caret',()=>{
 const g=createGame(104),e=materialize(mainEvent(g),g),html=renderToStaticMarkup(h(CinematicPlayer,{...props(g,e),reducedMotion:false}));
 assert.match(html,/dialogue-visible/);assert.match(html,/dialogue-unread/);assert.doesNotMatch(html,/dialogue-reserve|dialogue-typed|typing-caret/);
});
test('asset resolution honors physical display pixels',()=>{
 globalThis.window={innerWidth:844,devicePixelRatio:1};const path='/art/backgrounds/bookshop-night.webp',s=assetSource(path);
 assert.equal(imageURL(path),s.small.src);window.devicePixelRatio=2;assert.equal(imageURL(path),s.src);window.innerWidth=1280;window.devicePixelRatio=1;assert.equal(imageURL(path),s.src);delete globalThis.window;
});
test('image recovery retries transient/decode failures, uses known fallback and bounds warm work',async()=>{
 globalThis.window={innerWidth:1280,devicePixelRatio:1};let active=0,peak=0;const seen=new Map(),plans=new Map();
 class FakeImage{naturalWidth=1440;naturalHeight=810;_src='';set src(v){this._src=v;if(!v)return;active++;peak=Math.max(peak,active);seen.set(v,(seen.get(v)||0)+1);const outcome=plans.get(v)?.shift()??'ok';this.result=outcome;setTimeout(()=>{active--;outcome==='network'?this.onerror?.():this.onload?.();},4);}get src(){return this._src;}decode(){return this.result==='decode'?Promise.reject(new Error('decode failed')):Promise.resolve();}}
 globalThis.Image=FakeImage;
 try{
  const p='/recover/transient.webp';plans.set(p,['network','ok']);await prepareImage(p);assert.equal(seen.get(p),2);assert.ok(imageReady(p));
  const d='/recover/decode.webp';plans.set(d,['decode','ok']);await prepareImage(d);assert.equal(seen.get(d),2);assert.ok(imageReady(d));
  const f='/art/backgrounds/bookshop-night.webp',source=assetSource(f);plans.set(source.src,['network','network']);await prepareImage(f);assert.equal(imageURL(f),source.small.src);assert.ok(imageReady(f));invalidateImage(f);assert.equal(imageURL(f),source.src);assert.ok(!imageReady(f));
  const bad='/recover/permanent.webp';plans.set(bad,['network','network']);await assert.rejects(prepareImage(bad));assert.ok(!imageReady(bad));
  const items=Array.from({length:15},(_,i)=>`/recover/lru-${i}.webp`);await Promise.all(items.map(p=>prepareImage(p,'warm')));assert.ok(peak<=2);assert.ok(!imageReady(items[0]));assert.ok(imageReady(items.at(-1)));
 }finally{delete globalThis.Image;delete globalThis.window;}
});
