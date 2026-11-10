import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement as h} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createGame,choose,trade,endQuarter,validateSave,validStoryOpening} from '../.sites-runtime/test-modules/engine.mjs';
import {mainEvent,materialize} from '../.sites-runtime/test-modules/stories.mjs';
import {STORYBOARDS} from '../.sites-runtime/test-modules/cinematic-content.mjs';
import {MAIN_REVISED_BEATS,EVENT_CONTEXTS,CAST_ENTRANCES} from '../.sites-runtime/test-modules/narrative-content.mjs';
import {prepareNarrative,previousAnswer} from '../.sites-runtime/test-modules/narrative.mjs';
import {tradePractice,decisionFacts} from '../.sites-runtime/test-modules/learning.mjs';
import {rememberIntro,readCollection,freshCollection,collectionReplay} from '../.sites-runtime/test-modules/collection.mjs';
import {freshPresentation,validPresentation} from '../.sites-runtime/test-modules/presentation.mjs';
import {TradeLessonForm} from '../.sites-runtime/test-modules/TradeLessonForm.mjs';
import Bookshelf from '../.sites-runtime/test-modules/Bookshelf.mjs';
import {seasonalNews,companyNews,COMPANY_QUESTIONS} from '../.sites-runtime/test-modules/news.mjs';
import {News} from '../.sites-runtime/test-modules/NewsPanels.mjs';
import {Newspaper} from '../.sites-runtime/test-modules/PaperViews.mjs';
import {CinematicPlayer} from '../.sites-runtime/test-modules/CinematicPlayer.mjs';

test('all stories have an understandable situation and choice, main openings separate voices',()=>{
 assert.deepEqual(Object.keys(EVENT_CONTEXTS).sort(),Object.keys(STORYBOARDS).sort());assert.equal(Object.keys(MAIN_REVISED_BEATS).length,16);assert.equal(Object.keys(CAST_ENTRANCES).length,10);
 for(const [id,beats]of Object.entries(MAIN_REVISED_BEATS)){assert.ok(validStoryOpening(beats));assert.ok(beats.length>=6&&beats.length<=10);for(const b of beats){assert.ok(b.text.length<=55);assert.ok(['self','narrator',...STORYBOARDS[id].cast].includes(b.speaker));}}
 for(const c of Object.values(EVENT_CONTEXTS)){assert.ok(c.bridge&&c.question);assert.equal(c.options.length,2);assert.ok(c.options.every(o=>o.label&&o.reason));}
});
test('new openings keep real prior choices and remain immutable in cross-run collections',()=>{
 const game=createGame(8),old=materialize(mainEvent(game),game),fresh=prepareNarrative(game,old,2);
 assert.ok(fresh.opening.length>=6);assert.equal(old.opening,undefined);assert.deepEqual(fresh.options,old.options);
 const memory=readCollection(rememberIntro(freshCollection(),fresh));assert.deepEqual(collectionReplay(memory,old.id).opening,fresh.opening);
 assert.equal(prepareNarrative(game,old,1),old,'legacy reading indexes retain their original script');
 const next=endQuarter(choose(game,fresh,0,'main'));const second=prepareNarrative(next,materialize(mainEvent(next),next),2);
 assert.equal(previousAnswer(next,second).title,old.title);assert.equal(previousAnswer(next,second).choice,old.options[0].label);assert.ok(second.opening.every(b=>!b.text.startsWith('上次在「')));
 const ui=freshPresentation(game);assert.equal(ui.storyRevision,2);const legacy={...ui};delete legacy.storyRevision;assert.ok(validPresentation(legacy,game));
 assert.equal(validStoryOpening([{speaker:'unknown',text:'bad'}]),false);
});
test('profit exercises use real fees without altering game state, and unchanged prices lose costs',()=>{
 const game=createGame(21),before=structuredClone(game),p=tradePractice(game,'power',3000,0),up=tradePractice(game,'power',3000,.1),down=tradePractice(game,'power',3000,-.1);
 assert.ok(p.profit<0);assert.ok(p.breakEven>p.currentPrice);assert.ok(up.profit>p.profit&&down.profit<p.profit);assert.deepEqual(game,before);
 const actual=trade(game,'power','buy',3000),asset=actual.assets.find(a=>a.id==='power'),sold=trade(actual,'power','sell',asset.units*asset.price);
 assert.equal(sold.assets.find(a=>a.id==='power').units,0);assert.ok(Math.abs(sold.transactions.at(-1).realized-p.profit)<.02);
});
test('quarterly disclosures are real public observations and old saves remain readable',()=>{
 const game=createGame(22);assert.equal(game.assets[0].disclosures.length,1);
 const bought=trade(choose(game,materialize(mainEvent(game),game),0,'main'),'power','buy',3000),next=endQuarter(bought);
 for(const a of next.assets){const last=a.disclosures.at(-1);assert.equal(last.quarter,1);assert.equal(last.revenue,a.revenue);assert.equal(last.cashflow,a.cashflow);assert.equal(last.price,a.price);}
 assert.ok(next.journal.some(e=>e.category==='dividend'));assert.ok(validateSave(next));
 const legacy=structuredClone(next);for(const a of legacy.assets)delete a.disclosures;assert.ok(validateSave(legacy));
});
test('visible choice conditions derive amounts and dates from the actual option',()=>{
 const game=createGame(3),event=materialize(mainEvent(game),game),before=structuredClone(event);
 for(const o of event.options){const facts=decisionFacts(o);assert.ok(facts[0].label==='现在');for(const p of o.effects.promises??[])assert.ok(facts.some(f=>f.text.includes(`第${p.due}季`)));}
 assert.deepEqual(event,before);
});
test('shelf unifies people, memories and reading; trading offers clear sale quantities',()=>{
 const game=trade(createGame(1),'power','buy',3000),asset=game.assets.find(a=>a.id==='power');
 const shelf=renderToStaticMarkup(h(Bookshelf,{game,presentation:freshPresentation(game),collection:freshCollection(),tab:'overview',onTab:()=>{},onPage:()=>{},sound:false,onSound:()=>{},onAudioFocus:()=>{}}));
 for(const text of ['人物往来','往事收藏','经济读物'])assert.ok(shelf.includes(text));
 const form=renderToStaticMarkup(h(TradeLessonForm,{game,asset,initialSide:'sell',onTrade:()=>false,onLesson:()=>{},onSkip:()=>{},onCompanies:()=>{}}));
 for(const text of ['卖出市值金额','按份额','卖出25%','全部卖出','预计净到账','逐季对比 / 分红到账'])assert.ok(form.includes(text));
});

test('existing due payments stay visible unless this answer actually cancels them',()=>{
 const game=createGame(3);game.promises=[{id:'main-4-0',label:'书店屋顶修缮',due:1,amount:24000,status:'pending',kind:'payment'}];
 const unchanged={label:'照约施工',detail:'本季结算付款',response:'开工',effects:{}};
 const altered={...unchanged,effects:{cancelPayment:'main-4',promises:[{label:'局部修补',due:1,amount:9000,kind:'payment'}]}};
 assert.ok(decisionFacts(unchanged,game).some(f=>f.label==='已约定'&&f.text.includes('24,000')));
 const revised=decisionFacts(altered,game);assert.ok(revised.some(f=>f.text.includes('9,000')));assert.ok(!revised.some(f=>f.label==='已约定'));
 assert.equal(game.promises[0].status,'pending','preview must not rewrite the promise');
});

test('a loan follow-up recalls the actual loan rather than a newer unrelated encounter',()=>{
 let game=createGame(3);const first=materialize(mainEvent(game),game);game=choose(game,first,0,'main');
 const loan={...first,id:'main-3',title:'没有盖章的订单',atQuarter:3};
 game.history=[{...game.history[0],quarter:3,eventId:'main-3',title:loan.title,choice:'借出两万元，写清还款日期'},{...game.history[0],quarter:4,eventId:'side-2',title:'不再出版的一本书',choice:'保留给来店的人'}];
 game.quarter=7;const current=materialize(mainEvent(game),game),opened=prepareNarrative(game,current,2);
 assert.equal(previousAnswer(game,current).title,loan.title);assert.ok(previousAnswer(game,current).choice.includes('借出两万元'));assert.ok(opened.opening.every(b=>!b.text.startsWith('上次在「')));
});

test('real quarterly newspaper and tutorial never present daily timestamps',()=>{
 const game=createGame(82),noop=()=>{};
 for(let quarter=1;quarter<=12;quarter++){
  game.quarter=quarter;const before=structuredClone(game);
  const paper=renderToStaticMarkup(h(Newspaper,{game,onMarket:noop,tutorial:false,onSkip:noop,onLessonAction:noop}));
  const news=renderToStaticMarkup(h(News,{game}));
  assert.match(paper,/澄港季报/);assert.match(paper,/每季一期/);assert.doesNotMatch(paper+news,/日报|今日|昨日|今晨/);assert.match(news,/公司观察/);assert.equal((news.match(/class="news-item"/g)||[]).length,3);assert.deepEqual(game,before);
 }
});
test('the real player does not flash the duplicated line when an old save stopped in its removed summary',()=>{
 const start=createGame(83),event=materialize(mainEvent(start),start),game=choose(start,event,1,'main'),noop=()=>{};
 const html=renderToStaticMarkup(h(CinematicPlayer,{game,event,answered:1,reducedMotion:true,progress:{eventId:event.id,phase:'outcome',index:2,choice:1,inspected:false},onChoose:()=>false,onFinish:noop,onLedger:noop,onProgress:noop}));
 assert.equal(html,'');assert.equal(game.history.length,1);assert.equal(game.cash,120000);
});

test('quarterly news covers all six businesses with public figures, comparisons and distinct follow-up questions',()=>{
 const game=createGame(84),before=structuredClone(game),paper=seasonalNews(game);
 assert.equal(paper.companies.length,6);assert.equal(new Set(paper.companies.map(c=>c.question)).size,6);
 for(const c of paper.companies){assert.ok(COMPANY_QUESTIONS[c.id]);assert.equal(c.previous,undefined);assert.equal(c.priceChange,null);assert.match(c.comparison,/尚无上一份披露/);assert.ok(c.facts.includes(c.current.debtRatio.toFixed(1)));}
 assert.deepEqual(game,before);const privateChange=structuredClone(game);
 for(const a of privateChange.assets){a.fundamental=999;a.trueRevenue=888888;a.trueCashflow=-77777;}
 assert.deepEqual(seasonalNews(privateChange),paper,'unpublished economic state must not enter a newspaper');
 const a=structuredClone(game.assets[0]);a.disclosures.push({...a.disclosures[0],quarter:1,revenue:4500,cashflow:210,debtRatio:49,price:25});
 const changed=companyNews(a);assert.match(changed.headline,/营收增加.*走弱/);assert.match(changed.comparison,/第0季|开局披露/);assert.equal(changed.current.cashflow,210);assert.ok(changed.priceChange>0);
 delete a.disclosures;const old=companyNews(a);assert.equal(old.previous,undefined);assert.equal(old.priceChange,null);assert.match(old.asOf,/旧档未保留/);
});
test('local newspaper notes use only known choices and deadlines without inventing receipts',()=>{
 const game=createGame(85);game.quarter=3;game.history=[{quarter:1,title:'雨夜续租',choice:'暂时照看',response:'她说可以慢慢想。',principle:'机会成本',cash:0}];
 game.promises=[{id:'p',label:'已答应的修理费',due:3,amount:900,status:'pending',kind:'payment'},{id:'r',label:'待收回款',due:4,amount:2100,status:'pending',kind:'receipt',chance:.5},{id:'future',label:'远期付款',due:8,amount:8000,status:'pending',kind:'payment'}];
 const before=structuredClone(game),news=seasonalNews(game);assert.deepEqual(news.commitments.map(p=>p.id),['p','r']);assert.ok(news.notes.some(n=>n.title.startsWith('第1季留下的回声')));assert.deepEqual(game,before);
});
