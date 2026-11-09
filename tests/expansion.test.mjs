import{test,after}from'node:test';
import assert from'node:assert/strict';
import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{createGame,choose,trade,borrow,endQuarter,selectSide,optionError,validateSave,CHAPTER_QUARTERS,pendingChapter,storyKind,ending,normalizeEndingName}from'../.sites-runtime/test-modules/engine.mjs';
import{mainEvent,materialize,CHAPTER_EVENTS,SIDE_EVENTS}from'../.sites-runtime/test-modules/stories.mjs';
import{STORYBOARDS}from'../.sites-runtime/test-modules/cinematic-content.mjs';
import{SCENES,outcomeBeats,outcomeScene}from'../.sites-runtime/test-modules/visuals.mjs';
import{SEASON_PLACEMENTS,SEASONS_VISUAL,seasonForQuarter,seasonPropFrame}from'../.sites-runtime/test-modules/seasons.mjs';
import{coverFrame}from'../.sites-runtime/test-modules/assets.mjs';
import{EPILOGUES,epilogueScript}from'../.sites-runtime/test-modules/epilogues.mjs';
import{freshCollection,recoverCollection,collectionReplay,readCollection}from'../.sites-runtime/test-modules/collection.mjs';

const branchReport=[];
function completeChapter(s,index=0){if(pendingChapter(s)){const e=materialize(CHAPTER_EVENTS.find(e=>e.id===CHAPTER_QUARTERS[s.quarter]),s);s=choose(s,e,optionError(s,e.options[index])?1-index:index,'chapter');}return s;}
function check(s){assert.ok(validateSave(s));assert.ok(Math.abs(s.cash-s.journal.reduce((n,e)=>n+e.amount,0))<.1);assert.ok(s.cash>=0);}
function fixture(id){
 let s=trade(createGame(451),'harbor','buy',6000);s.flags.shop=1;
 if(id==='s05')s.fatigue=24;if(id==='s25')s.regime=1;if(id==='s49')s.flags.temporaryRoof=1;if(id==='s50')s=borrow(s);if(id==='s41')s.flags.fraud=1;
 const source=id.startsWith('main-')?null:[...CHAPTER_EVENTS,...SIDE_EVENTS].find(e=>e.id===id);
 if(id.startsWith('main-'))s.quarter=Number(id.slice(5));else if(id.startsWith('chapter-'))s.quarter=Number(id.slice(8));else{s.quarter=Array.from({length:10},(_,i)=>i+2).find(q=>!source.when||source.when({...s,quarter:q}))??5;assert.ok(!source.when||source.when(s),`${id} eligibility`);}
 if(!id.startsWith('main-'))s=choose(s,materialize(mainEvent(s),s),1,'main');
 return{s,event:materialize(source??mainEvent(s),s)};
}
for(const id of Object.keys(STORYBOARDS))for(const branch of[0,1])test(`execute ${id} / ${branch===0?'A':'B'} through response, save and quarter settlement`,()=>{
 const{s,event}=fixture(id),before=structuredClone(s);assert.equal(optionError(s,event.options[branch]),null);
 const chosen=choose(s,event,branch,storyKind(id));assert.deepEqual(s,before);check(chosen);assert.equal(chosen.history.at(-1).eventId,id);assert.equal(chosen.history.at(-1).optionIndex,branch);
 assert.throws(()=>choose(chosen,event,branch,storyKind(id)),/回复/);
 const beats=outcomeBeats(event,STORYBOARDS[id],branch);assert.ok(beats.length>=2);assert.ok(SCENES[outcomeScene(id,branch,STORYBOARDS[id].scene)]);
 const restored=JSON.parse(JSON.stringify(chosen));check(restored);const collection=recoverCollection(freshCollection(),restored);assert.ok(collectionReplay(collection,id,branch));assert.equal(collectionReplay(collection,id,1-branch),undefined);
 let settled=endQuarter(completeChapter(restored));check(settled);assert.ok(settled.quarters.some(q=>q.quarter===s.quarter));assert.equal(settled.promises.filter(p=>p.status==='pending'&&p.due===s.quarter).length,0);
 while(!settled.finished){const next=materialize(mainEvent(settled),settled),i=optionError(settled,next.options[1])?0:1;assert.equal(optionError(settled,next.options[i]),null);settled=endQuarter(completeChapter(choose(settled,next,i,'main')));check(settled);}
 assert.ok(settled.finished);assert.equal(settled.promises.filter(p=>p.status==='pending'&&p.due<=12).length,0);
 branchReport.push({id,branch,quarter:s.quarter,season:seasonForQuarter(s.quarter).id,scene:outcomeScene(id,branch,STORYBOARDS[id].scene),cashBefore:s.cash,cashAfter:chosen.cash,lines:beats.length,saveRoundTrip:true,quarterSettled:true,finishedThreeYears:true});
});
test('four main continuations gate the correct quarters, are stable and cannot consume the daily choice',()=>{
 for(const e of CHAPTER_EVENTS){let s=createGame(1);s.quarter=Number(e.id.slice(8));assert.throws(()=>choose(s,materialize(e,s),0,'chapter'),/先读完/);s=choose(s,materialize(mainEvent(s),s),1,'main');assert.throws(()=>endQuarter(s),/主线续章/);
  const snapshot=materialize(e,s);s.chapterSnapshot=snapshot;const a=choose(s,snapshot,0,'chapter');assert.equal(a.sideChoice,null);assert.equal(a.mainChoice,1);assert.deepEqual(a.chapterSnapshot,snapshot);assert.equal(pendingChapter(a),false);assert.equal(endQuarter(a).chapterSnapshot,undefined);
 }
});
test('all sixteen continuation combinations complete a real twelve-season life',()=>{
 for(let mask=0;mask<16;mask++){let s=createGame(16+mask),i=0;while(!s.finished){s=choose(s,materialize(mainEvent(s),s),1,'main');if(pendingChapter(s))s=completeChapter(s,(mask>>i++)&1);s=endQuarter(s);check(s);}assert.equal(s.history.filter(h=>h.eventId.startsWith('chapter-')).length,4);assert.equal(s.quarters.length,12);}
});
test('every scene has four seasons with real transparent art and independent new story paintings',()=>{
 assert.deepEqual(Object.keys(SEASON_PLACEMENTS).sort(),Object.keys(SCENES).sort());
 for(let q=1;q<=12;q++)assert.equal(seasonForQuarter(q).id,SEASONS_VISUAL[(q-1)%4].id);
 for(const p of Object.values(SEASON_PLACEMENTS)){assert.ok(p.prop.every(Number.isFinite));assert.ok(p.prop[0]>0&&p.prop[0]<100&&p.prop[1]>0&&p.prop[1]<=100&&p.prop[2]>=4&&p.prop[2]<=15);}
 const manifest=JSON.parse(readFileSync('docs/ASSET_MANIFEST.json','utf8')).assets;for(const season of SEASONS_VISUAL){const a=manifest[`season-${season.id}`];assert.equal(a.path,season.art);assert.equal(a.alpha,true);assert.ok(readFileSync(`public${season.art}`).length>10000);}
 const newIds=[...CHAPTER_EVENTS,...SIDE_EVENTS.filter(e=>Number(e.id.slice(1))>=53)].map(e=>STORYBOARDS[e.id].scene);assert.equal(new Set(newIds).size,12);
 const hashes=newIds.map(id=>createHash('sha256').update(readFileSync(`public${SCENES[id].image}`)).digest('hex'));assert.equal(new Set(hashes).size,12);
});
test('old ending names migrate into four-character names without losing earned text',()=>{
 const saved={version:1,stories:{},endings:{'守住一盏灯':{text:'那一年的灯还亮着。'},'传奇操盘手':{text:'旧纪录'}}};const c=readCollection(saved);assert.deepEqual(Object.keys(c.endings),['泊灯长明','知止乘潮']);assert.equal(c.endings['泊灯长明'].text,saved.endings['守住一盏灯'].text);assert.equal(normalizeEndingName('激流勇退'),'激流勇退');
});
test('seasonal objects retain their support when cropped, and hidden still lifes never slide across the scene',()=>{
 for(const [w,h]of[[1440,1000],[844,390],[667,375],[2560,720]])for(const scene of Object.keys(SCENES))for(const [ax,ay]of[[0,1],[.5,.5]]){
  const f=coverFrame(w,h,1672,941,ax,ay),visible={left:-f.left/f.width*100,right:(w-f.left)/f.width*100,top:-f.top/f.height*100,bottom:(h-f.top)/f.height*100},p=seasonPropFrame(scene,visible);
  assert.deepEqual([p.x,p.y,p.width],SEASON_PLACEMENTS[scene].prop);if(p.shown){assert.ok(p.x-p.width/2>=visible.left&&p.x+p.width/2<=visible.right);assert.ok(p.y<=visible.bottom);assert.ok(p.y-p.width*1.8>=visible.top);}
 }
});
test('new seasonal daily events can actually be selected, including summer quarters',()=>{
 const found=new Set();for(let seed=0;seed<400;seed++)for(const q of[2,3,4,5]){const s=createGame(seed);s.quarter=q;const e=selectSide(s,SIDE_EVENTS);if(e&&Number(e.id.slice(1))>=53)found.add(e.id);}
 assert.deepEqual([...found].sort(),['s53','s54','s55','s56','s57','s58','s59','s60']);
});
const routes=JSON.parse(readFileSync('tests/fixtures/ending-routes.json','utf8')).routes;
test('all twelve endings have a recorded legal route from the ordinary initial savings',()=>assert.deepEqual(Object.keys(routes).sort(),Object.keys(EPILOGUES).sort()));
for(const [name,route]of Object.entries(routes))test(`reach ending ${name} from createGame(${route.seed}) using only recorded legal actions`,()=>{
 let s=createGame(route.seed),cache=null;assert.equal(s.cash,120000);
 for(const action of route.actions){
  if(cache?.quarter!==s.quarter){const side=selectSide(s,SIDE_EVENTS);cache={quarter:s.quarter,main:materialize(mainEvent(s),s),side:side?materialize(side,s):null,chapter:CHAPTER_EVENTS.find(e=>e.id===CHAPTER_QUARTERS[s.quarter])};if(cache.chapter)cache.chapter=materialize(cache.chapter,s);}
  assert.equal(action.quarter,s.quarter);
  if(action.kind==='choice'){const event=[cache.main,cache.side,cache.chapter].find(e=>e?.id===action.id);assert.ok(event,`${name}: ${action.id} was not offered by the seeded game`);assert.equal(optionError(s,event.options[action.index]),null);s=choose(s,event,action.index,storyKind(event.id));}
  else if(action.kind==='trade')s=trade(s,action.asset,action.side,action.amount);
  else if(action.kind==='borrow')s=borrow(s);
  else if(action.kind==='end')s=endQuarter(s);
  else assert.fail(`Unknown route action ${action.kind}`);
  check(s);
 }
 assert.equal(s.finished,true);assert.equal(s.quarters.length,12);assert.equal(ending(s).name,name);const c=recoverCollection(freshCollection(),s);assert.deepEqual(Object.keys(c.endings),[name]);assert.ok(epilogueScript(s,name).beats.length>=4);
});
after(()=>{assert.equal(branchReport.length,152);writeFileSync('docs/BRANCH_EXECUTION.json',JSON.stringify({method:'Node execution of actual engine, authored response, collection replay gate, JSON round trip, quarter settlement and continuation to the end of year three. Synthetic eligible preconditions; not browser clicks.',branches:branchReport.sort((a,b)=>a.id.localeCompare(b.id)||a.branch-b.branch)},null,2)+'\n');});
