import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,choose,ending} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,materialize,SIDE_EVENTS} from '../.sites-runtime/test-modules/stories.mjs';
import {EPILOGUES,epilogueScript} from '../.sites-runtime/test-modules/epilogues.mjs';
import {freshCollection,readCollection,rememberIntro,rememberChoice,mergeCollections,recoverCollection,collectionReplay,collectionStats} from '../.sites-runtime/test-modules/collection.mjs';
import {StoryboardGallery} from '../.sites-runtime/test-modules/StoryboardGallery.mjs';

const render=(game,collection)=>renderToStaticMarkup(createElement(StoryboardGallery,{game,collection,onClose(){},speed:30,reducedMotion:true}));
test('a prepared event and unfinished dialogue unlock nothing; completed opening unlocks no answer',()=>{
 const game=createGame(51);game.mainSnapshot=materialize(mainEvent(game),game);game.sideSnapshot=materialize(SIDE_EVENTS[0],game);
 const reading={eventId:'main-1',phase:'story',index:0,choice:null,inspected:false};
 const fresh=freshCollection();assert.equal(recoverCollection(fresh,game),fresh);assert.equal(recoverCollection(fresh,game,reading),fresh);
 const opened=recoverCollection(fresh,game,{...reading,phase:'choice'});
 assert.deepEqual(collectionStats(opened),{stories:1,branches:0,endings:0});assert.equal(collectionReplay(opened,'main-1',0),undefined);assert.equal(collectionReplay(opened,'main-2'),undefined);
 assert.equal(collectionReplay(opened,'main-1').title,game.mainSnapshot.title);
});
test('only the committed answer unlocks, and its original words survive JSON round trips',()=>{
 const game=createGame(52),event=materialize(mainEvent(game),game),chosen=choose(game,event,1,'main');
 const collection=recoverCollection(freshCollection(),chosen);
 assert.deepEqual(collectionStats(collection),{stories:1,branches:1,endings:0});assert.equal(collectionReplay(collection,event.id,0),undefined);
 assert.equal(collectionReplay(collection,event.id,1).options[1].response,chosen.history[0].response);
 const restored=readCollection(JSON.parse(JSON.stringify(collection)));assert.deepEqual(restored,collection);
 assert.deepEqual(restored.stories[event.id].branches[1].options[1].effects,{});
 assert.equal(recoverCollection(collection,chosen),collection);
});
test('new runs and imported collections retain earned branches without granting unchosen ones',()=>{
 const first=createGame(53),event=materialize(mainEvent(first),first);
 const a=recoverCollection(freshCollection(),choose(first,event,0,'main'));
 const another=createGame(54);assert.equal(recoverCollection(a,another),a);
 const b=recoverCollection(freshCollection(),choose(another,materialize(mainEvent(another),another),1,'main'));
 const merged=mergeCollections(a,readCollection(JSON.parse(JSON.stringify(b))));
 assert.deepEqual(collectionStats(merged),{stories:1,branches:2,endings:0});assert.ok(collectionReplay(merged,'main-1',0));assert.ok(collectionReplay(merged,'main-1',1));assert.equal(collectionReplay(merged,'s01'),undefined);
 assert.equal(mergeCollections(merged,a),merged);
});
test('legacy history recovers the recorded branch and response, never both branches',()=>{
 const game=createGame(55),event=materialize(mainEvent(game),game),chosen=choose(game,event,1,'main');
 delete chosen.history[0].snapshot;delete chosen.history[0].eventId;delete chosen.history[0].optionIndex;
 chosen.history[0].response='程姨说：「信留在这里。」你将它收好。';
 const collection=recoverCollection(freshCollection(),chosen);
 assert.deepEqual(collectionStats(collection),{stories:1,branches:1,endings:0});assert.equal(collectionReplay(collection,'main-1',0),undefined);assert.equal(collectionReplay(collection,'main-1',1).options[1].response,chosen.history[0].response);
 chosen.history[0].choice='无法识别的旧版答复';assert.deepEqual(collectionStats(recoverCollection(freshCollection(),chosen)),{stories:1,branches:0,endings:0});
 chosen.history[0].quarter=NaN;assert.deepEqual(recoverCollection(freshCollection(),chosen),freshCollection());
});
test('endings remain hidden until achieved and keep their original narration after restart',()=>{
 const game=createGame(56),fresh=freshCollection();assert.deepEqual(recoverCollection(fresh,game).endings,{});
 game.finished=true;game.quarter=12;const end=ending(game),collection=recoverCollection(fresh,game);
 assert.deepEqual(Object.keys(collection.endings),[end.name]);assert.equal(collection.endings[end.name].text,end.text);
 const replay=epilogueScript(createGame(57),end.name,collection.endings[end.name].text);assert.ok(replay.beats.slice(3).map(b=>b.text).join('').includes(end.text));
 assert.equal(recoverCollection(collection,createGame(58)),collection);
});
test('malformed and unknown collection entries cannot expose a replay',()=>{
 const game=createGame(59),event=materialize(mainEvent(game),game),earned=rememberChoice(rememberIntro(freshCollection(),event),event,0),data=JSON.parse(JSON.stringify(earned));
 data.stories['missing-event']=data.stories['main-1'];data.stories['main-1'].branches[1]={id:'main-1'};data.endings['未收录的结局']={text:'unknown'};
 const clean=readCollection(data);assert.deepEqual(collectionStats(clean),{stories:1,branches:1,endings:0});assert.equal(collectionReplay(clean,'main-1',1),undefined);assert.equal(collectionReplay(clean,'missing-event'),undefined);
 assert.deepEqual(readCollection({version:2,stories:data.stories}),freshCollection());
});
test('empty collection markup contains no unreached names, titles, images or branch controls',()=>{
 const game=createGame(60),html=render(game,freshCollection());
 assert.doesNotMatch(html,/<img\b|data-gallery-event=|data-gallery-branch=/);assert.ok(html.includes('往事还没有写下第一页'));
 const endingsMarkup=html.slice(html.indexOf('<section class="gallery-endings"'));
 for(const name of Object.keys(EPILOGUES))assert.ok(!endingsMarkup.slice(0,endingsMarkup.indexOf('</section>')).includes(name));
 for(const event of SIDE_EVENTS)assert.ok(!html.includes(event.title));
 const event=materialize(mainEvent(game),game);assert.ok(!html.includes(event.title));assert.ok(!html.includes(event.options[0].label));
});
test('collection markup exposes only earned answers, with inert placeholders for the others',()=>{
 const game=createGame(61),event=materialize(mainEvent(game),game),collection=recoverCollection(freshCollection(),choose(game,event,0,'main')),html=render(game,collection);
 assert.ok(html.includes(event.title));assert.ok(html.includes(event.options[0].label));assert.ok(!html.includes(event.options[1].label));
 assert.ok(html.includes('data-gallery-branch="main-1-0"'));assert.ok(!html.includes('data-gallery-branch="main-1-1"'));
 assert.equal((html.match(/data-gallery-event=/g)||[]).length,1);assert.equal((html.match(/class="gallery-branch-locked"/g)||[]).length,1);
 assert.ok(!html.includes('data-gallery-event="main-2"'));
});
