import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,choose,quoteTrade} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,materialize} from '../.sites-runtime/test-modules/stories.mjs';
import {tradeAt} from '../.sites-runtime/test-modules/places.mjs';
import {LESSONS,TRADE_LESSONS,reconcileLesson,lessonDestination,suggestedLessonAmount} from '../.sites-runtime/test-modules/tutorial.mjs';
import {freshPresentation,validPresentation} from '../.sites-runtime/test-modules/presentation.mjs';
import {TradeLessonForm} from '../.sites-runtime/test-modules/TradeLessonForm.mjs';
import {LessonCoach} from '../.sites-runtime/test-modules/LessonCoach.mjs';
import {CinematicPlayer} from '../.sites-runtime/test-modules/CinematicPlayer.mjs';
import {Ledger} from '../.sites-runtime/test-modules/PaperViews.mjs';
import {SCENE_OBJECT_ANCHORS,coverFrame} from '../.sites-runtime/test-modules/assets.mjs';
const noop=()=>{};

test('both opening decisions survive interruption and resume the authored aftermath before accounting',()=>{
 for(const branch of [0,1]){
  const game=createGame(31),event=materialize(mainEvent(game),game),chosen=choose(game,event,branch,'main');
  const reading={eventId:event.id,phase:'outcome',index:1,choice:branch,inspected:false};
  assert.equal(reconcileLesson(chosen,'decision',2,reading),'aftermath');
  assert.equal(reconcileLesson(chosen,'aftermath',3,JSON.parse(JSON.stringify(reading))),'aftermath');
  assert.equal(lessonDestination('aftermath','hub'),'story');
  assert.equal(reconcileLesson(chosen,'aftermath',3,null),'ledger');
  assert.equal(reconcileLesson(chosen,'cashflow',3,reading),'cashflow','rereading the opening must not roll a later lesson backwards');
  assert.equal(chosen.history.length,1);assert.equal(chosen.quarter,1);
 }
});
test('every unfinished lesson has a reachable action, including dialogue, choice and wrong-place recovery',()=>{
 for(const lesson of LESSONS.filter(x=>x!=='done'))for(const place of ['hub','street','broker','bank'])assert.ok(lessonDestination(lesson,place),`${lesson}/${place}`);
 assert.equal(lessonDestination('dialogue','hub'),'story');assert.equal(lessonDestination('decision','bank'),'story');
 assert.equal(lessonDestination('cashflow','bank'),'trade');assert.equal(lessonDestination('broker','street'),'broker');
 assert.equal(lessonDestination('holding','broker'),'ledger');assert.equal(lessonDestination('done','hub'),null);
 assert.equal(lessonDestination('broker','broker'),'market','already reaching the brokerage must not send the player back outside');
});
test('recovery follows actual choices/trades, preserves explicit exploration, and never advances the quarter',()=>{
 const start=createGame(44),event=materialize(mainEvent(start),start),chosen=choose(start,event,0,'main');
 assert.equal(reconcileLesson(start,'confirm',3,null),'letter');
 assert.equal(reconcileLesson(chosen,'done',6,null),'done');
 const before=JSON.stringify(chosen),traded=tradeAt('broker',chosen,'power','buy',3000);
 assert.equal(reconcileLesson(traded,'confirm',3,null),'holding');assert.equal(reconcileLesson(traded,'quarter',3,null),'quarter');
 assert.equal(traded.cash,chosen.cash-3000);assert.equal(traded.quarter,1);assert.equal(JSON.stringify(chosen),before);
 const next={...traded,quarter:2};assert.equal(reconcileLesson(next,'business',3,null),'done');
});
test('budget and selected analysis can round-trip without invalidating old presentation saves',()=>{
 const game=createGame(5),ui={...freshPresentation(game),lesson:'cashflow',lessonAsset:'power',lessonAmount:1500};
 assert.ok(validPresentation(JSON.parse(JSON.stringify(ui)),game));const legacy={...ui};delete legacy.lessonAmount;assert.ok(validPresentation(legacy,game));
 for(const bad of [NaN,-1,Infinity,1e10])assert.equal(validPresentation({...ui,lessonAmount:bad},game),false);
 assert.equal(suggestedLessonAmount({...game,cash:1250}),1200);assert.equal(suggestedLessonAmount(game),3000);
});
test('guided company form exposes one fact at a time and cannot create trades while being read',()=>{
 const game=createGame(20),asset=game.assets.find(a=>a.id==='power'),before=JSON.stringify(game);
 for(const lesson of TRADE_LESSONS){
  const html=renderToStaticMarkup(h(TradeLessonForm,{game,asset,lesson,initialAmount:1500,onLesson:noop,onSkip:noop,onCompanies:noop,onTrade:()=>{throw Error('Rendering must not trade');}}));
  assert.equal((html.match(/aria-current="step"/g)??[]).length,1);
  assert.match(html,new RegExp(`data-lesson-field="${lesson}"`));
  if(['business','revenue','cashflow','debt'].includes(lesson)){assert.doesNotMatch(html,/aria-label="教学买入总预算"/);assert.doesNotMatch(html,/确认买入 ·/);}
  if(lesson==='amount')assert.match(html,/value="1500"/);
  if(lesson==='confirm'){assert.match(html,/确认买入 ·/);assert.ok(html.includes(quoteTrade(game,'power','buy',1500).fee.toFixed(2)));}
 }
 assert.equal(JSON.stringify(game),before);
});
test('folding help is separate from explicitly leaving the introduction',()=>{
 const html=renderToStaticMarkup(h(LessonCoach,{lesson:'ledger',onSkip:noop,onAction:noop}));
 assert.match(html,/折叠指引，保留教学进度/);assert.match(html,/我想自行探索/);assert.doesNotMatch(html,/跳过手把手教学/);
});
test('the actual scene player uses distinct opening branch paintings and never duplicates their painted props',()=>{
 for(const branch of [0,1]){
  const start=createGame(9),event=materialize(mainEvent(start),start),game=choose(start,event,branch,'main');
  const html=renderToStaticMarkup(h(CinematicPlayer,{game,event,answered:branch,guided:true,reducedMotion:true,progress:{eventId:'main-1',phase:'outcome',index:0,choice:branch,inspected:false},onChoose:()=>false,onFinish:noop,onLedger:noop,onProgress:noop}));
  assert.ok(html.includes(branch===0?'data-scene="bookshop-pledge"':'data-scene="attic-kept-letter"'));
  assert.doesNotMatch(html,/class="actor /);assert.doesNotMatch(html,/object-study object-(key|letter|contract)/);
  assert.match(html,/查看物件/);assert.match(html,/回书屋，核对现金|点击继续/);
 }
});
test('new painted story interaction targets stay visible on common phone landscapes and wide screens',()=>{
 for(const [width,height]of [[667,375],[844,390],[1440,1000],[2560,720]])for(const [scene,focus]of [['bookshop-pledge','key'],['attic-kept-letter','letter'],['reading-gathering','book'],['proof-solitary','book']]){
  const frame=coverFrame(width,height,1672,941,0,1),point=SCENE_OBJECT_ANCHORS[scene][focus];
  const x=frame.left+frame.width*point[0]/100,y=frame.top+frame.height*point[1]/100;
  assert.ok(x>24&&x<width-24&&y>24&&y<height-24,`${scene} ${width}x${height}`);
 }
});
test('the decision screen offers working decisions and accounting, with no inactive inspection control',()=>{
 const game=createGame(18),event=materialize(mainEvent(game),game);
 const html=renderToStaticMarkup(h(CinematicPlayer,{game,event,answered:null,guided:true,reducedMotion:true,progress:{eventId:event.id,phase:'choice',index:0,choice:null,inspected:false},onChoose:()=>false,onFinish:noop,onLedger:noop,onProgress:noop}));
 assert.match(html,/data-phase="choice"/);assert.match(html,/先看一眼账本/);assert.doesNotMatch(html,/查看物件/);
});
test('the first holding is a clear acknowledged record, while normal holdings retain company navigation',()=>{
 const game=tradeAt('broker',createGame(12),'power','buy',3000);
 const props={game,tutorial:true,lesson:'holding',onCompany:noop,onBorrow:noop,onRepay:noop,onDone:noop,onLessonAction:noop,onSkip:noop};
 const html=renderToStaticMarkup(h(Ledger,props));assert.match(html,/已买入 ·/);assert.match(html,/class="paper-holding lesson-focus"/);assert.doesNotMatch(html,/<button class="paper-holding/);
 const regular=renderToStaticMarkup(h(Ledger,{...props,lesson:'done',tutorial:false}));assert.match(regular,/<button class="paper-holding"/);
});
