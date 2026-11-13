import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,choose,trade,borrow,endQuarter,selectSide,validateSave,CHAPTER_QUARTERS,storyKind,ending} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,materialize,CHAPTER_EVENTS,SIDE_EVENTS} from '../.sites-runtime/test-modules/stories.mjs';
import {endingEvidence} from '../.sites-runtime/test-modules/ending-evidence.mjs';
import {EndingEvidence} from '../.sites-runtime/test-modules/EndingEvidence.mjs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(new URL('../package.json',import.meta.url));
const {createElement}=await import(pathToFileURL(require.resolve('react')));
const {renderToStaticMarkup}=await import(pathToFileURL(require.resolve('react-dom/server')));
const routes=JSON.parse(readFileSync('tests/fixtures/ending-routes.json','utf8')).routes;
for(const [name,route] of Object.entries(routes))test(`existing legal route to ${name} keeps the same ending and gets truthful read-only evidence`,()=>{
 let s=createGame(route.seed),cache=null;
 for(const action of route.actions){
  if(cache?.quarter!==s.quarter){const side=selectSide(s,SIDE_EVENTS);cache={quarter:s.quarter,main:materialize(mainEvent(s),s),side:side?materialize(side,s):null,chapter:CHAPTER_EVENTS.find(e=>e.id===CHAPTER_QUARTERS[s.quarter])};if(cache.chapter)cache.chapter=materialize(cache.chapter,s);}
  if(action.kind==='choice'){const event=[cache.main,cache.side,cache.chapter].find(e=>e?.id===action.id);s=choose(s,event,action.index,storyKind(event.id));}
  else if(action.kind==='trade')s=trade(s,action.asset,action.side,action.amount);
  else if(action.kind==='borrow')s=borrow(s);
  else s=endQuarter(s);
  assert.equal(validateSave(s),true);
 }
 const before=JSON.stringify(s),result=endingEvidence(s);
 assert.equal(ending(s).name,name);assert.equal(result.name,name);
 const checks=result.selected.checks;
 if(result.selected.mode==='all')assert.ok(checks.every(c=>c.met),name);
 if(result.selected.mode==='any')assert.ok(checks.some(c=>c.met),name);
 const html=renderToStaticMarkup(createElement(EndingEvidence,{game:s}));
 for(const other of Object.keys(routes))if(other!==name)assert.ok(!html.includes('《'+other+'》'),'unearned ending names are not offered as an unlock guide');
 assert.equal(JSON.stringify(s),before);assert.equal(validateSave(JSON.parse(before)),true);
});
test('living games never reveal debrief thresholds and new evidence creates no collection unlocks',()=>{
 const game=createGame(9),before=JSON.stringify(game);assert.equal(endingEvidence(game),null);assert.equal(renderToStaticMarkup(createElement(EndingEvidence,{game})), '');assert.equal(JSON.stringify(game),before);
});
test('differences are exact for an experienced relationship path, while strict boundaries remain strict',()=>{
 const game=createGame(3);game.finished=true;game.flags.familyTime=1;game.relations.he=58;
 const result=endingEvidence(game),path=result.paths.find(p=>p.id==='family');assert.ok(path);
 assert.equal(path.checks[0].met,false);assert.match(path.checks[0].gap,/尚差 1/);assert.match(path.checks[1].gap,/尚差 7/);
 game.flags.community=2;game.relations.tang=60;
 const community=endingEvidence(game).paths.find(p=>p.id==='community');assert.equal(community.checks[1].met,false);
 assert.match(community.checks[1].target,/高于 60/);assert.match(community.checks[1].gap,/不含相等/);
});
