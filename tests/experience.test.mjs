import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createGame,choose,debtTotal} from '../.sites-runtime/test-modules/engine.mjs';
import {CHAPTER_EVENTS,mainEvent,materialize,SIDE_EVENTS} from '../.sites-runtime/test-modules/stories.mjs';
import {shortLines,responseDialogue} from '../.sites-runtime/test-modules/dialogue.mjs';
import {STORYBOARDS} from '../.sites-runtime/test-modules/cinematic-content.mjs';
import {outcomeBeats,resumeOutcome,hasAuthoredOutcome,OUTCOME_REVISION} from '../.sites-runtime/test-modules/visuals.mjs';
import {encounterPeople,recoverPeople,characterHistory} from '../.sites-runtime/test-modules/people.mjs';
import {freshPresentation,restartPresentation,validPresentation} from '../.sites-runtime/test-modules/presentation.mjs';
import {initialLesson,LESSONS,nextLesson} from '../.sites-runtime/test-modules/tutorial.mjs';
import {tradeAt,borrowAt,repayAt} from '../.sites-runtime/test-modules/places.mjs';
import {READING_CHAPTERS,READING_SOURCES,EVENT_READING} from '../.sites-runtime/test-modules/reading.mjs';
import {ASSETS} from '../.sites-runtime/test-modules/assets.generated.mjs';
import {coverFrame,HUB_ANCHORS} from '../.sites-runtime/test-modules/assets.mjs';

test('spoken replies and following narration remain separate; inline quoted words stay in context',()=>{
 const beats=responseDialogue('程姨回道：「那钥匙先放你那里。想清楚了再说。」你把信折好，压在了稿纸下面。','程姨',['cheng']);
 assert.equal(beats[0].speaker,'cheng');assert.equal(beats[0].text,'那钥匙先放你那里。');assert.equal(beats[1].speaker,'cheng');assert.equal(beats[2].speaker,'narrator');assert.ok(beats[2].text.startsWith('你把信折好'));
 const word=responseDialogue('你给程姨回了一个「好」字。过了片刻，又补上一句。','程姨',['cheng']);assert.ok(word.every(b=>b.speaker==='narrator'));assert.ok(word[0].text.includes('「好」字'));
 assert.deepEqual(shortLines('她写道：「先放在这里。明天再来。」你点了点头。'),['她写道：「先放在这里。明天再来。」','你点了点头。']);
});
test('all 152 responses avoid orphan quote fragments and one-character tail lines',()=>{
 const s=createGame(7);const events=[...Array.from({length:12},(_,i)=>{s.quarter=i+1;return materialize(mainEvent(s),s);}),...SIDE_EVENTS,...CHAPTER_EVENTS];
 for(const event of events)for(const branch of [0,1])for(const beat of [...outcomeBeats(event,STORYBOARDS[event.id],branch),...responseDialogue(event.options[branch].response,event.sender,STORYBOARDS[event.id].cast)]){
  assert.doesNotMatch(beat.text,/^[」”』，。！？；]/u,`${event.id}: ${beat.text}`);assert.ok(Array.from(beat.text).length>1,`${event.id}: ${beat.text}`);
 }
});
test('a new run always resets the opening, lesson, encounters and reading but preserves preferences',()=>{
 const old=freshPresentation(createGame(1));old.introSeen=true;old.lesson='done';old.speed=15;old.reducedMotion=true;old.people={cheng:{quarter:1,events:['main-1']}};old.readingPage=8;
 const game=createGame(2),next=restartPresentation(game,old);assert.ok(validPresentation(next,game));assert.equal(next.introSeen,false);assert.equal(next.lesson,'letter');assert.deepEqual(next.people,{});assert.equal(next.readingPage,0);assert.equal(next.speed,15);assert.equal(next.reducedMotion,true);
 assert.equal(initialLesson(createGame(3),6),'done');assert.equal(nextLesson('costs'),'confirm');assert.ok(LESSONS.indexOf('confirm')<LESSONS.indexOf('holding'));
 const legacy={...next};delete legacy.lesson;delete legacy.people;delete legacy.place;assert.ok(validPresentation(legacy,game));
});
test('encounters unlock only encountered cast; memories come from actual chosen history',()=>{
 const s=createGame(4),e=materialize(mainEvent(s),s),met=encounterPeople({},e,1);assert.deepEqual(Object.keys(met),['cheng']);
 const chosen=choose(s,e,0,'main'),recovered=recoverPeople(chosen);assert.ok(recovered.cheng);assert.equal(recovered.he,undefined);assert.equal(characterHistory(chosen,'cheng')[0].choice,e.options[0].label);assert.equal(characterHistory(chosen,'lu').length,0);
 assert.equal(encounterPeople(met,e,2).cheng.quarter,1);assert.deepEqual(encounterPeople(met,e,2).cheng.events,['main-1']);
});
test('manual trading is confined to the brokerage; loan and repayment are confined to the bank',()=>{
 const s=createGame(5);for(const place of ['hub','street','bank'])assert.throws(()=>tradeAt(place,s,'power','buy',3000),/证券营业室/);
 for(const place of ['hub','street','broker'])assert.throws(()=>borrowAt(place,s),/银行/);
 const traded=tradeAt('broker',s,'power','buy',3000);assert.equal(traded.cash,117000);assert.ok(traded.assets.find(a=>a.id==='power').units>0);assert.equal(s.cash,120000);
 const loan=borrowAt('bank',s);assert.equal(loan.cash,140000);assert.equal(debtTotal(loan),20000);assert.throws(()=>repayAt('hub',loan),/银行/);const paid=repayAt('bank',loan);assert.equal(paid.cash,120000);assert.equal(debtTotal(paid),0);
});
test('all runtime art has fingerprinted real files and smaller phone backgrounds; masters are retained',()=>{
 let originals=0,runtime=0;for(const [path,a]of Object.entries(ASSETS)){const buffer=readFileSync(`public${a.src}`),hash=createHash('sha256').update(buffer).digest('hex').slice(0,10);assert.ok(a.src.includes(hash));assert.equal(buffer.length,a.bytes);originals+=readFileSync(`public${path}`).length;runtime+=buffer.length;if(a.small){assert.ok(readFileSync(`public${a.small.src}`).length<a.bytes);assert.equal(a.small.width,960);assert.ok(a.placeholder.startsWith('data:image/webp;base64,'));}}
 assert.ok(runtime<originals*.6,`${runtime}/${originals}`);
});
test('painting coordinates remain inside the same cover geometry in desktop and landscape viewports',()=>{
 for(const [width,height]of [[1440,1000],[844,390],[667,375],[1920,1080]]){
  const frame=coverFrame(width,height);assert.ok(frame.width>=width-0.01&&frame.height>=height-0.01);assert.ok(Math.abs(frame.left+frame.width/2-width/2)<0.01);assert.ok(Math.abs(frame.top+frame.height/2-height/2)<0.01);
  const point=HUB_ANCHORS['bookshop-night'].letter,x=frame.left+frame.width*point[0]/100,y=frame.top+frame.height*point[1]/100;assert.ok(x>=0&&x<=width&&y>=0&&y<=height,`${width}x${height}`);
 }
});
test('the book covers every event, contains substantial original summaries, and keeps short quotes attributed',()=>{
 assert.equal(READING_CHAPTERS.length,18);assert.equal(Object.keys(READING_SOURCES).length,17);assert.deepEqual(Object.keys(EVENT_READING).sort(),Object.keys(STORYBOARDS).sort());const ids=new Set(READING_CHAPTERS.map(c=>c.id));
 for(const references of Object.values(EVENT_READING))assert.ok(references.length&&references.every(id=>ids.has(id)));
 for(const chapter of READING_CHAPTERS){assert.ok(chapter.summary.length>=3);assert.ok(chapter.example.length>=2);assert.ok(chapter.summary.join('').length>=180);assert.ok(chapter.sources.every(id=>READING_SOURCES[id]));if(chapter.quote){assert.ok(chapter.quote.text.split(/\s+/).length<=25);assert.ok(chapter.quote.locator&&chapter.quote.translation&&READING_SOURCES[chapter.quote.source]);}}
 assert.doesNotMatch(readFileSync('components/game/EconomicsBook.tsx','utf8'),/href=/);
});
test('bookshop desk framing keeps complete interaction rings visible across seasons and aspect ratios',()=>{
 for(const [width,height]of [[1440,1000],[844,390],[667,375],[2560,720]])for(const scene of ['bookshop-night','bookshop-day','reading-room']){
  const frame=coverFrame(width,height,1672,941,0,1),points=HUB_ANCHORS[scene];
  for(const key of ['letter','ledger','newspaper']){const [px,py]=points[key],x=frame.left+frame.width*px/100,y=frame.top+frame.height*py/100;assert.ok(x>=24&&x<=width-24&&y>=24&&y<=height-24,`${scene} ${key} ${width}x${height}`);}
 }
});
test('bank, brokerage and travel street use independent paintings instead of story backdrops',()=>{
 const paths=['district-street','neighborhood-bank','securities-office'].map(id=>`public/art/backgrounds/${id}.webp`);const hashes=paths.map(path=>createHash('sha256').update(readFileSync(path)).digest('hex'));assert.equal(new Set(hashes).size,3);
 const old=['old-street','bank','bookshop-night','bookshop-day','brokerage'].map(id=>createHash('sha256').update(readFileSync(`public/art/backgrounds/${id}.webp`)).digest('hex'));assert.ok(hashes.every(hash=>!old.includes(hash)));
});

// Regression: the two sources used to repeat the same reply in different words.
test('both opening answers are performed once, including the key reply and window promise',()=>{
 const g=createGame(77),event=materialize(mainEvent(g),g),before=structuredClone(event),script=STORYBOARDS[event.id];
 const no=outcomeBeats(event,script,1),yes=outcomeBeats(event,script,0);
 assert.equal(no.filter(b=>b.text.includes('钥匙先放')).length,1);assert.equal(no.filter(b=>b.text.includes('想清楚')).length,1);
 assert.equal(no.find(b=>b.text.includes('钥匙先放')).speaker,'cheng');assert.equal(no.at(-1).speaker,'narrator');
 assert.equal(yes.filter(b=>b.text.includes('后窗')).length,1);assert.deepEqual(event,before);
});
test('a saved reply from another content version keeps its own words, amounts and dates without the new performance',()=>{
 const g=createGame(78),event=materialize(mainEvent(g),g);event.options[1].response='程姨回道：「先留三天。」第六季退回2,345元。';
 const before=structuredClone(event),beats=outcomeBeats(event,STORYBOARDS[event.id],1);
 assert.equal(hasAuthoredOutcome(event,1),false);assert.deepEqual(beats.map(b=>[b.speaker,b.text]),[['cheng','先留三天。'],['narrator','第六季退回2,345元。']]);assert.deepEqual(event,before);
});
test('variant roof outcomes cannot inherit a performance for a different responsibility',()=>{
 const g=createGame(79);g.quarter=5;const event=materialize(mainEvent(g),g),beats=outcomeBeats(event,STORYBOARDS[event.id],0);
 assert.equal(hasAuthoredOutcome(event,0),false);assert.equal(beats.map(b=>b.text).join(''),event.options[0].response);assert.doesNotMatch(beats.map(b=>b.text).join(''),/旧瓦|改签/);
});
test('old aftermath cursors skip a removed repeated summary; new cursors retain every authored line',()=>{
 const g=createGame(80),e=materialize(mainEvent(g),g),script=STORYBOARDS[e.id],old={eventId:e.id,phase:'outcome',index:3,choice:1,inspected:false};
 const chosen=choose(g,e,1,'main'),before=structuredClone(chosen);
 assert.deepEqual(resumeOutcome(e,script,1,old),{index:0,finished:true});
 assert.deepEqual(resumeOutcome(e,script,1,{...old,index:1}),{index:1,finished:false});
 const current={...old,index:2,outcomeRevision:OUTCOME_REVISION};assert.deepEqual(resumeOutcome(e,script,1,JSON.parse(JSON.stringify(current))),{index:2,finished:false});
 const ui=freshPresentation(chosen);ui.reading=current;assert.ok(validPresentation(JSON.parse(JSON.stringify(ui)),chosen));
 assert.deepEqual(chosen,before,'resuming does not apply the choice or effects again');
 const legacy=structuredClone(e);legacy.options[1].response='程姨回道：「先留三天。明早再来。」信留在桌上。';
 assert.deepEqual(resumeOutcome(legacy,script,1,old),{index:1,finished:false});
});
test('all reviewed branch performances are complete and contain no repeated sentence',()=>{
 const seen=new Set();for(const shop of [0,1]){const game=createGame(81);game.flags.shop=shop;
 const events=[...Array.from({length:12},(_,i)=>{game.quarter=i+1;return materialize(mainEvent(game),game);}),...SIDE_EVENTS,...CHAPTER_EVENTS];
 for(const e of events)for(const i of [0,1]){
  const beats=outcomeBeats(e,STORYBOARDS[e.id],i),sentences=beats.flatMap(b=>shortLines(b.text)).map(t=>t.replace(/[\p{P}\p{Z}\s]/gu,''));
  assert.equal(new Set(sentences).size,sentences.length,`${e.id}/${i}`);assert.ok(beats.every(b=>b.text.length>1));seen.add(e.id+'/'+i);
 }}assert.equal(seen.size,152);
});
